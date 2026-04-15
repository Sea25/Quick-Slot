import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { Html5Qrcode } from "html5-qrcode";

export default function StaffPanel() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("parking_user"));

  const [tab, setTab] = useState("scanner");
  const [scanning, setScanning] = useState(false);
  const [manualId, setManualId] = useState("");
  const [loadingRes, setLoadingRes] = useState(false);
  const [reservation, setReservation] = useState(null);
  const [resError, setResError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState("");
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  const html5QrRef = useRef(null);

  useEffect(() => {
    if (tab === "sessions") fetchActiveSessions();
    return () => stopScanner();
  }, [tab]);

  async function startScanner() {
    setScanning(true);
    setResError("");
    try {
      html5QrRef.current = new Html5Qrcode("qr-reader");
      await html5QrRef.current.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        async (decodedText) => {
          await stopScanner();
          await lookupReservation(decodedText.trim());
        },
        () => {}
      );
    } catch (e) {
      setResError("Camera not accessible. Use manual entry below.");
      setScanning(false);
    }
  }

  async function stopScanner() {
    if (html5QrRef.current) {
      try {
        await html5QrRef.current.stop();
        html5QrRef.current.clear();
      } catch (_) {}
      html5QrRef.current = null;
    }
    setScanning(false);
  }

  async function lookupReservation(id) {
    if (!id) return;
    setLoadingRes(true);
    setResError("");
    setReservation(null);
    setActionMsg("");

    const { data, error } = await supabase
      .from("reservations")
      .select(`
        id, status, reserved_at, expires_at,
        user_id,
        slots ( id, slot_number, vehicle_type,
          parking_locations ( id, name, floor_level,
            buildings ( id, name, district, city )
          )
        ),
        vehicles ( id, plate_number, vehicle_type, brand, color ),
        users ( id, full_name, phone, email ),
        parking_sessions ( id, status, entry_time )
      `)
      .eq("id", id)
      .single();

    if (error || !data) {
      setResError("Reservation not found. Check the ID and try again.");
    } else {
      setReservation(data);
    }
    setLoadingRes(false);
  }

  async function handleStartSession() {
    if (!reservation) return;
    setActionLoading(true);
    setActionMsg("");

    const existing = reservation.parking_sessions?.find(s => s.status === "active");
    if (existing) {
      setActionMsg("warn:An active session already exists for this reservation.");
      setActionLoading(false);
      return;
    }

    const now = new Date().toISOString();

    const { error: sessionErr } = await supabase
      .from("parking_sessions")
      .insert({
        reservation_id: reservation.id,
        user_id: reservation.user_id,
        vehicle_id: reservation.vehicles?.id,
        slot_id: reservation.slots?.id,
        entry_time: now,
        status: "active",
      });

    if (sessionErr) {
      setActionMsg("err:Failed to start session: " + sessionErr.message);
      setActionLoading(false);
      return;
    }

    await supabase.from("slots")
      .update({ status: "occupied", updated_at: now })
      .eq("id", reservation.slots?.id);

    await supabase.from("reservations")
      .update({ status: "confirmed" })
      .eq("id", reservation.id);

    setActionMsg("ok:Session started! Vehicle entry recorded.");
    await lookupReservation(reservation.id);
    setActionLoading(false);
  }

  async function handleEndSession(sessionId) {
    setActionLoading(true);
    setActionMsg("");

    const now = new Date();

    const { data: sess } = await supabase
      .from("parking_sessions")
      .select("id, entry_time, slot_id, vehicle_id")
      .eq("id", sessionId)
      .single();

    if (!sess) {
      setActionMsg("err:Session not found.");
      setActionLoading(false);
      return;
    }

    const entryTime = new Date(sess.entry_time + "Z");
    const durationMinutes = Math.max(1, Math.ceil((now - entryTime) / 60000));

    await supabase.from("parking_sessions").update({
      exit_time: now.toISOString(),
      duration_minutes: durationMinutes,
      status: "completed",
    }).eq("id", sessionId);

    const buildingId = reservation?.slots?.parking_locations?.buildings?.id;
    const vehicleType = reservation?.vehicles?.vehicle_type;

    const { data: rateData } = await supabase
      .from("parking_rates")
      .select("rate_per_hour, min_charge")
      .eq("building_id", buildingId)
      .eq("vehicle_type", vehicleType)
      .single();

    const ratePerHour = rateData?.rate_per_hour || 0;
    const minCharge = rateData?.min_charge || 0;
    const amount = Math.max(minCharge, (durationMinutes / 60) * ratePerHour);

    await supabase.from("payments").insert({
      session_id: sessionId,
      amount: Math.ceil(amount),
      rate_per_hour: ratePerHour,
      payment_method: "cash",
      status: "pending",
    });

    await supabase.from("slots")
      .update({ status: "available", updated_at: now.toISOString() })
      .eq("id", reservation?.slots?.id);

    setActionLoading(false);
    navigate(`/bill/${sessionId}`);
  }

  async function fetchActiveSessions() {
    setSessionsLoading(true);
    const { data } = await supabase
      .from("parking_sessions")
      .select(`
        id, entry_time, status,
        slots ( slot_number, parking_locations ( name, floor_level, buildings ( name ) ) ),
        vehicles ( plate_number, vehicle_type ),
        users ( full_name )
      `)
      .eq("status", "active")
      .order("entry_time", { ascending: false });

    setSessions(data || []);
    setSessionsLoading(false);
  }

  function getDuration(entryTime) {
    const mins = Math.floor((Date.now() - new Date(entryTime + "Z").getTime()) / 60000);
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  }

  const activeSession = reservation?.parking_sessions?.find(s => s.status === "active");
  const isExpired = reservation && new Date(reservation.expires_at + "Z") < new Date();
  const canStart = reservation &&
    !activeSession &&
    reservation.status !== "expired" &&
    reservation.status !== "cancelled" &&
    !isExpired;

  function msgStyle(msg) {
    if (msg.startsWith("ok:")) return { bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.3)", color: "#4ade80" };
    if (msg.startsWith("err:")) return { bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.3)", color: "#fca5a5" };
    return { bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.3)", color: "#fbbf24" };
  }
  function msgText(msg) { return msg.replace(/^(ok|err|warn):/, ""); }

  return (
    <div style={s.page}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(10px);} to {opacity:1;transform:translateY(0);} }
        #qr-reader video { border-radius: 12px !important; width: 100% !important; }
        #qr-reader { border: none !important; background: transparent !important; }
        #qr-reader__scan_region { border-radius: 12px; }
      `}</style>

      {/* Navbar */}
      <nav style={s.navbar}>
        <div style={s.logo}>
          <div style={s.logoIcon}>P</div>
          <span style={s.logoText}>QuickSlot</span>
          <span style={s.staffBadge}>Staff</span>
        </div>
        <button style={s.logoutBtn} onClick={() => { localStorage.removeItem("parking_user"); navigate("/"); }}>
          Logout
        </button>
      </nav>

      <div style={s.content}>
        <div style={s.header}>
          <h1 style={s.title}>Staff Panel</h1>
          <p style={s.subtitle}>Scan QR codes to manage vehicle entry and exit</p>
        </div>

        {/* Tabs */}
        <div style={s.tabRow}>
          {[["scanner", "🔍 Scanner"], ["sessions", "🚗 Active Sessions"]].map(([key, label]) => (
            <button key={key}
              onClick={() => { setTab(key); setReservation(null); setResError(""); setActionMsg(""); stopScanner(); }}
              style={{
                ...s.tabBtn,
                background: tab === key ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "rgba(255,255,255,0.04)",
                border: tab === key ? "1px solid transparent" : "1px solid rgba(255,255,255,0.1)",
                color: tab === key ? "#fff" : "rgba(255,255,255,0.5)",
              }}>
              {label}
            </button>
          ))}
        </div>

        {/* ── SCANNER TAB ── */}
        {tab === "scanner" && (
          <div style={s.twoCol}>
            {/* Left */}
            <div style={s.card}>
              <p style={s.cardTitle}>Scan QR Code</p>
              <div style={s.qrArea}>
                <div id="qr-reader" style={{ width: "100%" }} />
                {!scanning && (
                  <div style={s.qrPlaceholder}>
                    <div style={{ fontSize: 44, marginBottom: 8 }}>📷</div>
                    <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>Camera preview appears here</p>
                  </div>
                )}
              </div>

              {!scanning ? (
                <button style={s.primaryBtn} onClick={startScanner}>Start Camera Scan</button>
              ) : (
                <button style={s.dangerBtn} onClick={stopScanner}>Stop Scanner</button>
              )}

              <div style={s.orDivider}><span style={s.orText}>or enter manually</span></div>

              <div style={s.manualRow}>
                <input style={s.input} placeholder="Paste Reservation UUID"
                  value={manualId} onChange={e => setManualId(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && manualId && lookupReservation(manualId.trim())}
                />
                <button style={s.lookupBtn}
                  onClick={() => manualId && lookupReservation(manualId.trim())}
                  disabled={!manualId || loadingRes}>
                  {loadingRes ? "…" : "Go"}
                </button>
              </div>
              {resError && <p style={{ color: "#fca5a5", fontSize: 13, marginTop: 10 }}>⚠️ {resError}</p>}
            </div>

            {/* Right */}
            <div>
              {loadingRes && (
                <div style={s.card}>
                  <div style={s.centerBox}><div style={s.spinner} /><p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13 }}>Looking up…</p></div>
                </div>
              )}

              {!loadingRes && !reservation && (
                <div style={s.card}>
                  <div style={s.centerBox}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>🎫</div>
                    <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, textAlign: "center" }}>
                      Scan or enter a reservation ID to see booking details
                    </p>
                  </div>
                </div>
              )}

              {!loadingRes && reservation && (
                <div style={{ ...s.card, animation: "fadeIn 0.3s ease" }}>
                  {/* Header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <p style={s.cardTitle}>Booking Details</p>
                    <div style={{
                      fontSize: 12, fontWeight: 600, padding: "0.3rem 0.8rem", borderRadius: 20,
                      background: activeSession ? "rgba(96,165,250,0.15)" : isExpired ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.15)",
                      border: `1px solid ${activeSession ? "rgba(96,165,250,0.35)" : isExpired ? "rgba(239,68,68,0.35)" : "rgba(34,197,94,0.35)"}`,
                      color: activeSession ? "#60a5fa" : isExpired ? "#f87171" : "#4ade80",
                    }}>
                      {activeSession ? "🔵 Session Active" : isExpired ? "🔴 Expired" : "🟢 Valid"}
                    </div>
                  </div>

                  {/* User */}
                  <div style={s.userRow}>
                    <div style={s.avatar}>{reservation.users?.full_name?.[0]?.toUpperCase() || "U"}</div>
                    <div>
                      <p style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9" }}>{reservation.users?.full_name || "—"}</p>
                      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{reservation.users?.phone || reservation.users?.email || "—"}</p>
                    </div>
                  </div>

                  {/* Info Grid */}
                  <div style={s.infoGrid}>
                    {[
                      ["Slot", `#${reservation.slots?.slot_number}`],
                      ["Floor", reservation.slots?.parking_locations?.floor_level],
                      ["Building", reservation.slots?.parking_locations?.buildings?.name],
                      ["Vehicle", reservation.vehicles?.plate_number],
                      ["Type", reservation.vehicles?.vehicle_type],
                      ["Brand", reservation.vehicles?.brand || "—"],
                    ].map(([label, value]) => (
                      <div key={label} style={s.infoItem}>
                        <p style={s.infoLabel}>{label}</p>
                        <p style={s.infoValue}>{value || "—"}</p>
                      </div>
                    ))}
                  </div>

                  {/* Entry time if active */}
                  {activeSession && (
                    <div style={{ background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.2)", borderRadius: 10, padding: "0.75rem 1rem", marginBottom: "1rem", fontSize: 13, color: "#93c5fd" }}>
                      ⏱ Session started at {new Date(activeSession.entry_time + "Z").toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · {getDuration(activeSession.entry_time)} ago
                    </div>
                  )}

                  {/* Action message */}
                  {actionMsg && (() => { const st = msgStyle(actionMsg); return (
                    <div style={{ background: st.bg, border: `1px solid ${st.border}`, color: st.color, borderRadius: 10, padding: "0.75rem 1rem", fontSize: 13, fontWeight: 600, marginBottom: "1rem" }}>
                      {msgText(actionMsg)}
                    </div>
                  ); })()}

                  {/* Actions */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 10 }}>
                    {canStart && (
                      <button style={s.startBtn} onClick={handleStartSession} disabled={actionLoading}>
                        {actionLoading ? "Starting…" : "✅ Record Entry"}
                      </button>
                    )}
                    {activeSession && (
                      <button style={s.endBtn} onClick={() => handleEndSession(activeSession.id)} disabled={actionLoading}>
                        {actionLoading ? "Ending…" : "🏁 End Session & Generate Bill"}
                      </button>
                    )}
                    {!canStart && !activeSession && (
                      <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, textAlign: "center" }}>No action available for this reservation.</p>
                    )}
                  </div>

                  <button style={s.clearBtn} onClick={() => { setReservation(null); setManualId(""); setActionMsg(""); }}>
                    Clear ✕
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── SESSIONS TAB ── */}
        {tab === "sessions" && (
          <div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
              <button style={s.refreshBtn} onClick={fetchActiveSessions}>↻ Refresh</button>
            </div>

            {sessionsLoading && <div style={s.centerBox}><div style={s.spinner} /></div>}

            {!sessionsLoading && sessions.length === 0 && (
              <div style={{ ...s.card, textAlign: "center", padding: "4rem" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🅿️</div>
                <p style={{ color: "#e2e8f0", fontWeight: 700, fontSize: 18, marginBottom: 6 }}>No active sessions</p>
                <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13 }}>All slots are currently free.</p>
              </div>
            )}

            {!sessionsLoading && sessions.length > 0 && (
              <div style={s.sessGrid}>
                {sessions.map(sess => (
                  <div key={sess.id} style={s.sessCard}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                      <div>
                        <p style={{ fontSize: 18, fontWeight: 800, color: "#f1f5f9" }}>{sess.vehicles?.plate_number || "—"}</p>
                        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{sess.users?.full_name || "—"}</p>
                      </div>
                      <div style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", color: "#a5b4fc", fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 20 }}>
                        ⏱ {getDuration(sess.entry_time)}
                      </div>
                    </div>
                    <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "0.75rem 0" }} />
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: "1rem" }}>
                      <span>🏢 {sess.slots?.parking_locations?.buildings?.name || "—"}</span>
                      <span>📍 {sess.slots?.parking_locations?.name || "—"} · Floor {sess.slots?.parking_locations?.floor_level || "—"}</span>
                      <span>🅿️ Slot #{sess.slots?.slot_number || "—"}</span>
                    </div>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginBottom: 4 }}>
                      Entry: {new Date(sess.entry_time + "Z").toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                    <p style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", wordBreak: "break-all" }}>ID: {sess.id}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #0f0f1a 100%)",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    color: "#fff",
  },
  navbar: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "1rem 2rem",
    borderBottom: "1px solid rgba(255,255,255,0.07)",
    background: "rgba(255,255,255,0.03)",
    backdropFilter: "blur(12px)",
  },
  logo: { display: "flex", alignItems: "center", gap: "0.6rem" },
  logoIcon: {
    width: 36, height: 36, borderRadius: 10,
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 700, fontSize: 18,
  },
  logoText: {
    fontSize: 20, fontWeight: 700,
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
  },
  staffBadge: {
    background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.4)",
    color: "#a5b4fc", fontSize: 11, fontWeight: 700,
    padding: "2px 10px", borderRadius: 20, letterSpacing: 1,
  },
  logoutBtn: {
    background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
    color: "#fca5a5", borderRadius: 8, padding: "0.4rem 1rem",
    cursor: "pointer", fontSize: 14,
  },
  content: { maxWidth: 1100, margin: "0 auto", padding: "2rem 1.5rem" },
  header: { marginBottom: "1.5rem" },
  title: { fontSize: 28, fontWeight: 800, color: "#f1f5f9", marginBottom: 6 },
  subtitle: { fontSize: 14, color: "rgba(255,255,255,0.4)" },
  tabRow: { display: "flex", gap: 10, marginBottom: "2rem" },
  tabBtn: {
    padding: "0.55rem 1.4rem", borderRadius: 10,
    fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
  },
  twoCol: {
    display: "grid", gridTemplateColumns: "1fr 1fr",
    gap: "1.5rem", alignItems: "start",
  },
  card: {
    background: "rgba(255,255,255,0.05)",
    backdropFilter: "blur(24px)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 16, padding: "1.5rem",
  },
  cardTitle: { fontSize: 16, fontWeight: 700, color: "#f1f5f9", marginBottom: "1rem" },
  qrArea: {
    background: "rgba(0,0,0,0.3)", borderRadius: 12,
    minHeight: 240, display: "flex", alignItems: "center",
    justifyContent: "center", marginBottom: "1rem", overflow: "hidden",
  },
  qrPlaceholder: { textAlign: "center", padding: "2rem" },
  primaryBtn: {
    width: "100%", padding: "0.7rem",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    border: "none", borderRadius: 10, color: "#fff",
    fontSize: 14, fontWeight: 600, cursor: "pointer", marginBottom: "0.75rem",
  },
  dangerBtn: {
    width: "100%", padding: "0.7rem",
    background: "rgba(239,68,68,0.15)",
    border: "1px solid rgba(239,68,68,0.3)",
    borderRadius: 10, color: "#fca5a5",
    fontSize: 14, fontWeight: 600, cursor: "pointer", marginBottom: "0.75rem",
  },
  orDivider: {
    textAlign: "center", margin: "0.75rem 0",
    borderTop: "1px solid rgba(255,255,255,0.07)",
    paddingTop: "0.75rem",
  },
  orText: { color: "rgba(255,255,255,0.25)", fontSize: 12 },
  manualRow: { display: "flex", gap: 8 },
  input: {
    flex: 1, padding: "0.65rem 0.9rem",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 10, color: "#fff", fontSize: 13, outline: "none",
  },
  lookupBtn: {
    padding: "0.65rem 1rem",
    background: "rgba(99,102,241,0.2)",
    border: "1px solid rgba(99,102,241,0.4)",
    borderRadius: 10, color: "#a5b4fc",
    fontSize: 13, fontWeight: 600, cursor: "pointer",
  },
  centerBox: {
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    gap: 12, minHeight: 200, textAlign: "center",
  },
  spinner: {
    width: 36, height: 36,
    border: "3px solid rgba(99,102,241,0.2)",
    borderTop: "3px solid #6366f1",
    borderRadius: "50%", animation: "spin 0.8s linear infinite",
  },
  userRow: {
    display: "flex", alignItems: "center", gap: 12,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 12, padding: "0.85rem 1rem", marginBottom: "1rem",
  },
  avatar: {
    width: 40, height: 40, borderRadius: "50%",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 700, fontSize: 16, flexShrink: 0,
  },
  infoGrid: {
    display: "grid", gridTemplateColumns: "1fr 1fr",
    gap: "0.7rem", marginBottom: "1rem",
  },
  infoItem: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 10, padding: "0.6rem 0.8rem",
  },
  infoLabel: {
    fontSize: 10, color: "rgba(255,255,255,0.35)",
    textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 3,
  },
  infoValue: { fontSize: 13, fontWeight: 600, color: "#e2e8f0" },
  startBtn: {
    width: "100%", padding: "0.8rem",
    background: "linear-gradient(135deg, #22c55e, #16a34a)",
    border: "none", borderRadius: 10, color: "#fff",
    fontSize: 14, fontWeight: 700, cursor: "pointer",
  },
  endBtn: {
    width: "100%", padding: "0.8rem",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    border: "none", borderRadius: 10, color: "#fff",
    fontSize: 14, fontWeight: 700, cursor: "pointer",
  },
  clearBtn: {
    width: "100%", padding: "0.55rem",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10, color: "rgba(255,255,255,0.4)",
    fontSize: 12, cursor: "pointer",
  },
  refreshBtn: {
    background: "rgba(99,102,241,0.15)",
    border: "1px solid rgba(99,102,241,0.3)",
    color: "#a5b4fc", borderRadius: 8,
    padding: "0.4rem 1rem", cursor: "pointer", fontSize: 13, fontWeight: 600,
  },
  sessGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "1rem",
  },
  sessCard: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 16, padding: "1.25rem",
  },
};