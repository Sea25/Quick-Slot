import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

const TABS = ["All", "Active", "Expired", "Cancelled"];

const statusConfig = {
  pending: { label: "Active", color: "#4ade80", bg: "rgba(34,197,94,0.12)", border: "rgba(34,197,94,0.3)" },
  confirmed: { label: "Confirmed", color: "#60a5fa", bg: "rgba(96,165,250,0.12)", border: "rgba(96,165,250,0.3)" },
  expired: { label: "Expired", color: "#f87171", bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.3)" },
  cancelled: { label: "Cancelled", color: "#fb923c", bg: "rgba(251,146,60,0.12)", border: "rgba(251,146,60,0.3)" },
};

export default function MyBookings() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("parking_user"));
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");

  useEffect(() => {
    fetchBookings();
  }, []);

  async function fetchBookings() {
    setLoading(true);
    const { data, error } = await supabase
      .from("reservations")
      .select(`
        id,
        status,
        reserved_at,
        expires_at,
        cancelled_at,
        slots (
          id,
          slot_number,
          vehicle_type,
          parking_locations (
            name,
            floor_level,
            buildings (
              name,
              district,
              city
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
      .eq("user_id", user.id)
      .order("reserved_at", { ascending: false });

    if (!error) setBookings(data || []);
    setLoading(false);
  }

  async function handleCancel(booking) {
    const confirmed = window.confirm("Cancel this booking?");
    if (!confirmed) return;

    await supabase
      .from("reservations")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("id", booking.id);

    await supabase
      .from("slots")
      .update({ status: "available" })
      .eq("id", booking.slots?.id);

    fetchBookings();
  }

  const filtered = bookings.filter((b) => {
    if (activeTab === "All") return true;
    if (activeTab === "Active") return b.status === "pending" || b.status === "confirmed";
    if (activeTab === "Expired") return b.status === "expired";
    if (activeTab === "Cancelled") return b.status === "cancelled";
    return true;
  });

  const counts = {
    All: bookings.length,
    Active: bookings.filter((b) => b.status === "pending" || b.status === "confirmed").length,
    Expired: bookings.filter((b) => b.status === "expired").length,
    Cancelled: bookings.filter((b) => b.status === "cancelled").length,
  };

  return (
    <div style={s.page}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .booking-card { animation: fadeIn 0.3s ease forwards; }
        .cancel-btn:hover { background: rgba(239,68,68,0.2) !important; }
        .view-btn:hover { background: rgba(99,102,241,0.25) !important; }
        .tab-btn:hover { background: rgba(255,255,255,0.08) !important; }
      `}</style>

      {/* Navbar */}
      <nav style={s.navbar}>
        <div style={s.logo} onClick={() => navigate("/dashboard")}>
          <div style={s.logoIcon}>P</div>
          <span style={s.logoText}>QuickSlot</span>
        </div>
        <button style={s.backBtn} onClick={() => navigate("/dashboard")}>
          ← Dashboard
        </button>
      </nav>

      <div style={s.content}>
        {/* Header */}
        <div style={s.header}>
          <h1 style={s.title}>My Bookings</h1>
          <p style={s.subtitle}>Track all your parking reservations</p>
        </div>

        {/* Tabs */}
        <div style={s.tabRow}>
          {TABS.map((tab) => (
            <button
              key={tab}
              className="tab-btn"
              onClick={() => setActiveTab(tab)}
              style={{
                ...s.tab,
                background: activeTab === tab
                  ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                  : "rgba(255,255,255,0.04)",
                border: activeTab === tab
                  ? "1px solid transparent"
                  : "1px solid rgba(255,255,255,0.1)",
                color: activeTab === tab ? "#fff" : "rgba(255,255,255,0.5)",
              }}
            >
              {tab}
              <span style={{
                ...s.tabCount,
                background: activeTab === tab ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.08)",
              }}>
                {counts[tab]}
              </span>
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div style={s.center}>
            <div style={s.spinner} />
            <p style={s.loadingText}>Fetching your bookings…</p>
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div style={s.emptyBox}>
            <div style={s.emptyIcon}>🅿️</div>
            <p style={s.emptyTitle}>No bookings found</p>
            <p style={s.emptySub}>
              {activeTab === "All"
                ? "You haven't made any bookings yet."
                : `No ${activeTab.toLowerCase()} bookings.`}
            </p>
            {activeTab === "All" && (
              <button style={s.bookNowBtn} onClick={() => navigate("/dashboard")}>
                Book a Slot →
              </button>
            )}
          </div>
        )}

        {/* Booking Cards */}
        {!loading && filtered.length > 0 && (
          <div style={s.grid}>
            {filtered.map((booking, i) => {
              const cfg = statusConfig[booking.status] || statusConfig.expired;
              const slot = booking.slots;
              const loc = slot?.parking_locations;
              const building = loc?.buildings;
              const vehicle = booking.vehicles;
              const isActive = booking.status === "pending" || booking.status === "confirmed";

              return (
                <div
                  key={booking.id}
                  className="booking-card"
                  style={{ ...s.card, animationDelay: `${i * 0.05}s` }}
                >
                  {/* Card Header */}
                  <div style={s.cardHeader}>
                    <div>
                      <p style={s.buildingName}>{building?.name || "—"}</p>
                      <p style={s.locationText}>
                        📍 {loc?.name || "—"} · {building?.district || "—"}
                      </p>
                    </div>
                    <div style={{
                      ...s.badge,
                      color: cfg.color,
                      background: cfg.bg,
                      border: `1px solid ${cfg.border}`,
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.color, display: "inline-block" }} />
                      {cfg.label}
                    </div>
                  </div>

                  <div style={s.divider} />

                  {/* Details Grid */}
                  <div style={s.detailGrid}>
                    <div style={s.detailItem}>
                      <p style={s.detailLabel}>Slot</p>
                      <p style={s.detailValue}>#{slot?.slot_number || "—"}</p>
                    </div>
                    <div style={s.detailItem}>
                      <p style={s.detailLabel}>Floor</p>
                      <p style={s.detailValue}>{loc?.floor_level || "—"}</p>
                    </div>
                    <div style={s.detailItem}>
                      <p style={s.detailLabel}>Vehicle</p>
                      <p style={s.detailValue}>{vehicle?.plate_number || "—"}</p>
                    </div>
                    <div style={s.detailItem}>
                      <p style={s.detailLabel}>Type</p>
                      <p style={s.detailValue}>{vehicle?.vehicle_type || "—"}</p>
                    </div>
                    <div style={s.detailItem}>
                      <p style={s.detailLabel}>Booked At</p>
                      <p style={s.detailValue}>
                        {booking.reserved_at
                          ? new Date(booking.reserved_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })
                          : "—"}
                      </p>
                    </div>
                    <div style={s.detailItem}>
                      <p style={s.detailLabel}>{booking.status === "cancelled" ? "Cancelled At" : "Expires At"}</p>
                      <p style={s.detailValue}>
                        {booking.status === "cancelled"
                          ? booking.cancelled_at
                            ? new Date(booking.cancelled_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })
                            : "—"
                          : booking.expires_at
                            ? new Date(booking.expires_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })
                            : "—"}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={s.actions}>
                    {isActive && (
                      <>
                        <button
                          className="view-btn"
                          style={s.viewBtn}
                          onClick={() => navigate(`/booking/${booking.id}`)}
                        >
                          View QR →
                        </button>
                        <button
                          className="cancel-btn"
                          style={s.cancelBtn}
                          onClick={() => handleCancel(booking)}
                        >
                          Cancel
                        </button>
                      </>
                    )}
                    {!isActive && (
                      <button
                        className="view-btn"
                        style={{ ...s.viewBtn, width: "100%" }}
                        onClick={() => navigate(`/booking/${booking.id}`)}
                      >
                        View Details →
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
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
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "1rem 2rem",
    borderBottom: "1px solid rgba(255,255,255,0.07)",
    background: "rgba(255,255,255,0.03)",
    backdropFilter: "blur(12px)",
  },
  logo: {
    display: "flex", alignItems: "center", gap: "0.6rem", cursor: "pointer",
  },
  logoIcon: {
    width: 36, height: 36, borderRadius: 10,
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 700, fontSize: 18, color: "#fff",
  },
  logoText: {
    fontSize: 20, fontWeight: 700,
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
  },
  backBtn: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "#cbd5e1", borderRadius: 8,
    padding: "0.4rem 1rem", cursor: "pointer", fontSize: 14,
  },
  content: {
    maxWidth: 900, margin: "0 auto", padding: "2.5rem 1.5rem",
  },
  header: { marginBottom: "2rem" },
  title: { fontSize: 28, fontWeight: 800, marginBottom: 6, color: "#f1f5f9" },
  subtitle: { fontSize: 14, color: "rgba(255,255,255,0.4)" },
  tabRow: {
    display: "flex", gap: 10, flexWrap: "wrap", marginBottom: "2rem",
  },
  tab: {
    display: "flex", alignItems: "center", gap: 8,
    padding: "0.5rem 1.1rem", borderRadius: 10,
    fontSize: 13, fontWeight: 600, cursor: "pointer",
    transition: "all 0.2s",
  },
  tabCount: {
    fontSize: 11, padding: "2px 7px",
    borderRadius: 20, fontWeight: 700,
  },
  center: {
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    gap: "1rem", minHeight: 200,
  },
  spinner: {
    width: 36, height: 36,
    border: "3px solid rgba(99,102,241,0.2)",
    borderTop: "3px solid #6366f1",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  loadingText: { color: "rgba(255,255,255,0.35)", fontSize: 14 },
  emptyBox: {
    textAlign: "center", padding: "4rem 2rem",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 20,
  },
  emptyIcon: { fontSize: 48, marginBottom: "1rem" },
  emptyTitle: { fontSize: 18, fontWeight: 700, color: "#e2e8f0", marginBottom: 8 },
  emptySub: { fontSize: 14, color: "rgba(255,255,255,0.35)", marginBottom: "1.5rem" },
  bookNowBtn: {
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    border: "none", color: "#fff", borderRadius: 10,
    padding: "0.65rem 1.5rem", fontSize: 14,
    fontWeight: 600, cursor: "pointer",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))",
    gap: "1.2rem",
  },
  card: {
    background: "rgba(255,255,255,0.05)",
    backdropFilter: "blur(24px)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 16, padding: "1.5rem",
    opacity: 0,
  },
  cardHeader: {
    display: "flex", justifyContent: "space-between",
    alignItems: "flex-start", marginBottom: "1rem",
  },
  buildingName: { fontSize: 16, fontWeight: 700, color: "#f1f5f9", marginBottom: 4 },
  locationText: { fontSize: 12, color: "rgba(255,255,255,0.4)" },
  badge: {
    display: "flex", alignItems: "center", gap: 6,
    padding: "0.3rem 0.8rem", borderRadius: 20,
    fontSize: 12, fontWeight: 600, whiteSpace: "nowrap",
  },
  divider: { height: 1, background: "rgba(255,255,255,0.07)", marginBottom: "1rem" },
  detailGrid: {
    display: "grid", gridTemplateColumns: "1fr 1fr",
    gap: "0.8rem", marginBottom: "1.2rem",
  },
  detailItem: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 10, padding: "0.65rem 0.85rem",
  },
  detailLabel: {
    fontSize: 10, color: "rgba(255,255,255,0.35)",
    textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 3,
  },
  detailValue: { fontSize: 13, fontWeight: 600, color: "#e2e8f0" },
  actions: { display: "flex", gap: 10 },
  viewBtn: {
    flex: 1, padding: "0.65rem",
    background: "rgba(99,102,241,0.15)",
    border: "1px solid rgba(99,102,241,0.35)",
    borderRadius: 10, color: "#a5b4fc",
    fontSize: 13, fontWeight: 600, cursor: "pointer",
    transition: "all 0.2s",
  },
  cancelBtn: {
    padding: "0.65rem 1.2rem",
    background: "rgba(239,68,68,0.1)",
    border: "1px solid rgba(239,68,68,0.25)",
    borderRadius: 10, color: "#fca5a5",
    fontSize: 13, fontWeight: 600, cursor: "pointer",
    transition: "all 0.2s",
  },
};
