import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { QRCodeSVG as QRCode } from "qrcode.react";

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #0f0f1a 100%)",
    display: "flex",
    flexDirection: "column",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    color: "#fff",
  },
  navbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "1rem 2rem",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.03)",
    backdropFilter: "blur(12px)",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: "0.6rem",
    textDecoration: "none",
    cursor: "pointer",
  },
  logoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 18,
    color: "#fff",
  },
  logoText: {
    fontSize: 20,
    fontWeight: 700,
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  navBtn: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "#cbd5e1",
    borderRadius: 8,
    padding: "0.4rem 1rem",
    cursor: "pointer",
    fontSize: 14,
    transition: "all 0.2s",
  },
  main: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "2rem 1rem",
  },
  card: {
    background: "rgba(255,255,255,0.05)",
    backdropFilter: "blur(24px)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 20,
    padding: "2.5rem",
    maxWidth: 520,
    width: "100%",
    boxShadow: "0 24px 60px rgba(0,0,0,0.4)",
  },
  successBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    background: "rgba(34,197,94,0.15)",
    border: "1px solid rgba(34,197,94,0.3)",
    borderRadius: 30,
    padding: "0.35rem 1rem",
    fontSize: 13,
    color: "#4ade80",
    marginBottom: "1.5rem",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "#4ade80",
    animation: "pulse 1.5s ease-in-out infinite",
  },
  expiredBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    background: "rgba(239,68,68,0.15)",
    border: "1px solid rgba(239,68,68,0.3)",
    borderRadius: 30,
    padding: "0.35rem 1rem",
    fontSize: 13,
    color: "#f87171",
    marginBottom: "1.5rem",
  },
  title: {
    fontSize: 26,
    fontWeight: 700,
    marginBottom: "0.25rem",
    color: "#f1f5f9",
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.5)",
    marginBottom: "2rem",
  },
  divider: {
    height: 1,
    background: "rgba(255,255,255,0.08)",
    margin: "1.5rem 0",
  },
  qrWrapper: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginBottom: "1.5rem",
    gap: "1rem",
  },
  qrBox: {
    background: "#fff",
    borderRadius: 16,
    padding: 16,
    display: "inline-block",
    boxShadow: "0 0 0 4px rgba(99,102,241,0.3)",
  },
  qrLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.4)",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "0.9rem",
    marginBottom: "1.5rem",
  },
  infoItem: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 12,
    padding: "0.85rem 1rem",
  },
  infoLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.4)",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: 600,
    color: "#e2e8f0",
  },
  timerSection: {
    background: "rgba(99,102,241,0.08)",
    border: "1px solid rgba(99,102,241,0.25)",
    borderRadius: 14,
    padding: "1.2rem",
    textAlign: "center",
    marginBottom: "1.5rem",
  },
  timerLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.45)",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  timerValue: {
    fontSize: 42,
    fontWeight: 700,
    fontVariantNumeric: "tabular-nums",
    letterSpacing: 2,
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  timerExpired: {
    fontSize: 42,
    fontWeight: 700,
    color: "#f87171",
  },
  timerSub: {
    fontSize: 12,
    color: "rgba(255,255,255,0.35)",
    marginTop: 4,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    background: "rgba(255,255,255,0.08)",
    overflow: "hidden",
    marginTop: "0.8rem",
  },
  progressFill: (pct) => ({
    height: "100%",
    width: `${pct}%`,
    background: pct > 30 ? "linear-gradient(90deg, #6366f1, #8b5cf6)" : "linear-gradient(90deg, #ef4444, #f87171)",
    borderRadius: 2,
    transition: "width 1s linear",
  }),
  myBookingsBtn: {
    width: "100%",
    padding: "0.85rem",
    borderRadius: 12,
    border: "none",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    color: "#fff",
    fontWeight: 600,
    fontSize: 15,
    cursor: "pointer",
    transition: "opacity 0.2s",
  },
  loadingWrap: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "1rem",
    minHeight: 300,
  },
  spinner: {
    width: 40,
    height: 40,
    border: "3px solid rgba(99,102,241,0.2)",
    borderTop: "3px solid #6366f1",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  errorText: {
    color: "#f87171",
    textAlign: "center",
    fontSize: 15,
  },
};

// Inject keyframes once
const injectKeyframes = () => {
  if (document.getElementById("qs-keyframes")) return;
  const el = document.createElement("style");
  el.id = "qs-keyframes";
  el.textContent = `
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
  `;
  document.head.appendChild(el);
};

const TOTAL_SECONDS = 3600; // 1 hour

export default function BookingConfirm() {
  const { reservationId } = useParams();
  const navigate = useNavigate();

  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS);
  const [expired, setExpired] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    injectKeyframes();
    fetchReservation();
    return () => clearInterval(timerRef.current);
  }, [reservationId]);

  const fetchReservation = async () => {
    try {
      setLoading(true);
      const { data, error: err } = await supabase
        .from("reservations")
        .select(`
          id,
          status,
          reserved_at,
          expires_at,
          slots (
            slot_number,
            vehicle_type,
            parking_locations (
              name,
              floor_level,
              buildings (
                name,
                address,
                district
              )
            )
          ),
          vehicles (
            plate_number,
            vehicle_type,
            brand,
            color
          )
        `)
        .eq("id", reservationId)
        .single();

      if (err) throw err;
      if (!data) throw new Error("Reservation not found.");

      setReservation(data);

      // Calculate remaining seconds from expires_at
const expiresAt = new Date(data.expires_at).getTime();
const now = Date.now();
const remaining = Math.floor((expiresAt - now) / 1000);

console.log("expires_at:", data.expires_at);
console.log("now (local):", new Date().toISOString());
console.log("remaining seconds:", remaining);

if (remaining <= 0) {
  setExpired(true);
  setSecondsLeft(0);
} else {
  setSecondsLeft(remaining);
  startCountdown(remaining, data.slots?.id || null);
}
    } catch (e) {
      setError(e.message || "Failed to load reservation.");
    } finally {
      setLoading(false);
    }
  };

  const startCountdown = (initial, slotId) => {
    let secs = initial;
    timerRef.current = setInterval(async () => {
      secs -= 1;
      setSecondsLeft(secs);
      if (secs <= 0) {
        clearInterval(timerRef.current);
        setExpired(true);
        await handleExpiry(slotId);
      }
    }, 1000);
  };

  const handleExpiry = async (slotId) => {
    // Mark reservation as expired
    await supabase
      .from("reservations")
      .update({ status: "expired" })
      .eq("id", reservationId);

    // Free the slot back to available
    if (slotId) {
      await supabase
        .from("slots")
        .update({ status: "available" })
        .eq("id", slotId);
    }
  };

  const formatTime = (secs) => {
    const m = String(Math.floor(secs / 60)).padStart(2, "0");
    const s = String(secs % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  const pct = Math.min(100, (secondsLeft / TOTAL_SECONDS) * 100);

  const slot = reservation?.slots;
  const location = slot?.parking_locations;
  const building = location?.buildings;
  const vehicle = reservation?.vehicles;

  const expiresAt = reservation?.expires_at
    ? new Date(reservation.expires_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "—";

  const reservedAt = reservation?.reserved_at
  ? new Date(reservation.reserved_at + "Z").toLocaleString([], {
      dateStyle: "medium",
      timeStyle: "short",
    })
  : "—";

  return (
    <div style={styles.page}>
      {/* Navbar */}
      <nav style={styles.navbar}>
        <div style={styles.logo} onClick={() => navigate("/dashboard")}>
          <div style={styles.logoIcon}>P</div>
          <span style={styles.logoText}>QuickSlot</span>
        </div>
        <button style={styles.navBtn} onClick={() => navigate("/my-bookings")}>
          My Bookings
        </button>
      </nav>

      {/* Main */}
      <main style={styles.main}>
        {loading && (
          <div style={styles.loadingWrap}>
            <div style={styles.spinner} />
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>Loading booking details…</p>
          </div>
        )}

        {!loading && error && (
          <div style={styles.card}>
            <p style={styles.errorText}>{error}</p>
            <button style={{ ...styles.myBookingsBtn, marginTop: "1.5rem" }} onClick={() => navigate("/dashboard")}>
              Back to Dashboard
            </button>
          </div>
        )}

        {!loading && !error && reservation && (
          <div style={styles.card}>
            {/* Status Badge */}
            {expired ? (
              <div style={styles.expiredBadge}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#f87171", display: "inline-block" }} />
                Reservation Expired
              </div>
            ) : (
              <div style={styles.successBadge}>
                <span style={styles.dot} />
                Booking Confirmed
              </div>
            )}

            <h1 style={styles.title}>
              {expired ? "Slot Released" : "Your Slot is Held!"}
            </h1>
            <p style={styles.subtitle}>
              {expired
                ? "Your reservation has expired and the slot is now available for others."
                : "Show this QR code to staff when you arrive at the parking."}
            </p>

            {/* QR Code */}
            <div style={styles.qrWrapper}>
              <div style={{ ...styles.qrBox, opacity: expired ? 0.35 : 1, filter: expired ? "grayscale(1)" : "none" }}>
                <QRCode value={reservationId} size={160} level="H" />
              </div>
              <p style={styles.qrLabel}>Scan at Entry</p>
            </div>

            <div style={styles.divider} />

            {/* Info Grid */}
            <div style={styles.infoGrid}>
              <div style={styles.infoItem}>
                <p style={styles.infoLabel}>Slot</p>
                <p style={styles.infoValue}>#{slot?.slot_number ?? "—"}</p>
              </div>
              <div style={styles.infoItem}>
                <p style={styles.infoLabel}>Floor</p>
                <p style={styles.infoValue}>{location?.floor_level ?? "—"}</p>
              </div>
              <div style={styles.infoItem}>
                <p style={styles.infoLabel}>Building</p>
                <p style={{ ...styles.infoValue, fontSize: 13 }}>{building?.name ?? "—"}</p>
              </div>
              <div style={styles.infoItem}>
                <p style={styles.infoLabel}>District</p>
                <p style={styles.infoValue}>{building?.district ?? "—"}</p>
              </div>
              <div style={styles.infoItem}>
                <p style={styles.infoLabel}>Vehicle</p>
                <p style={{ ...styles.infoValue, fontSize: 13 }}>{vehicle?.plate_number ?? "—"}</p>
              </div>
              <div style={styles.infoItem}>
                <p style={styles.infoLabel}>Type</p>
                <p style={styles.infoValue}>{vehicle?.vehicle_type ?? "—"}</p>
              </div>
              <div style={{ ...styles.infoItem, gridColumn: "1 / -1" }}>
                <p style={styles.infoLabel}>Booked At</p>
                <p style={styles.infoValue}>{reservedAt}</p>
              </div>
            </div>

            {/* Countdown Timer */}
            <div style={styles.timerSection}>
              <p style={styles.timerLabel}>
                {expired ? "Expired at" : "Expires at"} {expiresAt}
              </p>
              {expired ? (
                <p style={styles.timerExpired}>00:00</p>
              ) : (
                <p style={styles.timerValue}>{formatTime(secondsLeft)}</p>
              )}
              <p style={styles.timerSub}>
                {expired ? "Reservation is no longer valid" : "Arrive before this time to use your slot"}
              </p>
              <div style={styles.progressBar}>
                <div style={styles.progressFill(pct)} />
              </div>
            </div>

            {/* CTA */}
            <button
              style={styles.myBookingsBtn}
              onMouseEnter={(e) => (e.target.style.opacity = "0.85")}
              onMouseLeave={(e) => (e.target.style.opacity = "1")}
              onClick={() => navigate("/my-bookings")}
            >
              View My Bookings
            </button>
          </div>
        )}
      </main>
    </div>
  );
}