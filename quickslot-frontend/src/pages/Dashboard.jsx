import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function Dashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('parking_user')
    if (!stored) { navigate('/'); return }
    setUser(JSON.parse(stored))
    fetchCategories()
  }, [])

  async function fetchCategories() {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
    setCategories(data || [])
    setLoading(false)
  }

  function handleLogout() {
    localStorage.removeItem('parking_user')
    navigate('/')
  }

  const categoryIcons = {
    Mall: '🏬',
    Hospital: '🏥',
    Theatre: '🎬',
  }

  const categoryColors = {
    Mall: { from: '#6366f1', to: '#8b5cf6' },
    Hospital: { from: '#06b6d4', to: '#0891b2' },
    Theatre: { from: '#f59e0b', to: '#d97706' },
  }

  const categoryDesc = {
    Mall: 'Find parking at top shopping malls',
    Hospital: 'Hassle-free hospital parking',
    Theatre: 'Book before the movie starts',
  }

  return (
    <div style={styles.page}>
      <div style={styles.glow1} />
      <div style={styles.glow2} />

      {/* Navbar */}
      <div style={styles.navbar}>
        <div style={styles.logoRow}>
          <div style={styles.logoIcon}>P</div>
          <span style={styles.logoText}>QuickSlot</span>
        </div>
        <div style={styles.navRight}>
          <button style={styles.myBookingsBtn}
            onClick={() => navigate('/my-bookings')}>
            My Bookings
          </button>
          <div style={styles.avatar}>
            {user?.full_name?.charAt(0).toUpperCase()}
          </div>
          <button style={styles.logoutBtn} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {/* Hero */}
      <div style={styles.hero}>
        <p style={styles.heroGreeting}>
          Hey, {user?.full_name?.split(' ')[0]} 👋
        </p>
        <h1 style={styles.heroTitle}>Where are you parking today?</h1>
        <p style={styles.heroSub}>
          Select a category below to find and book your slot
        </p>
      </div>

      {/* Category Cards */}
      {loading ? (
        <p style={styles.loadingText}>Loading...</p>
      ) : (
        <div style={styles.grid}>
          {categories.map(cat => {
            const colors = categoryColors[cat.name] || { from: '#6366f1', to: '#8b5cf6' }
            return (
              <div
                key={cat.id}
                style={styles.card}
                onClick={() => navigate(`/locations/${cat.id}`)}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-6px)'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                }}
              >
                <div style={{
                  ...styles.cardIconBox,
                  background: `linear-gradient(135deg, ${colors.from}, ${colors.to})`
                }}>
                  <span style={styles.cardIcon}>
                    {categoryIcons[cat.name] || '🅿️'}
                  </span>
                </div>
                <h2 style={styles.cardTitle}>{cat.name}</h2>
                <p style={styles.cardDesc}>
                  {categoryDesc[cat.name] || cat.description}
                </p>
                <div style={styles.cardArrow}>
                  Explore → 
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Footer */}
      <p style={styles.footer}>
        QuickSlot © 2026 · Smart Parking System
      </p>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #0f0f1a 100%)',
    padding: '0 0 60px 0',
    position: 'relative',
    overflow: 'hidden',
  },
  glow1: {
    position: 'absolute',
    width: '500px',
    height: '500px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
    top: '-100px',
    right: '-100px',
    pointerEvents: 'none',
  },
  glow2: {
    position: 'absolute',
    width: '400px',
    height: '400px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)',
    bottom: '0px',
    left: '-100px',
    pointerEvents: 'none',
  },
  navbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 40px',
    background: 'rgba(255,255,255,0.03)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid rgba(255,255,255,0.07)',
    position: 'relative',
    zIndex: 10,
  },
  logoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  logoIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: '#fff',
    fontSize: '16px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#fff',
    letterSpacing: '-0.5px',
  },
  navRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  myBookingsBtn: {
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '10px',
    color: '#fff',
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: '#fff',
    fontSize: '15px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutBtn: {
    background: 'rgba(239,68,68,0.15)',
    border: '1px solid rgba(239,68,68,0.25)',
    borderRadius: '10px',
    color: '#fca5a5',
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  hero: {
    textAlign: 'center',
    padding: '70px 20px 40px',
    position: 'relative',
    zIndex: 1,
  },
  heroGreeting: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: '16px',
    marginBottom: '12px',
  },
  heroTitle: {
    color: '#fff',
    fontSize: '38px',
    fontWeight: '800',
    letterSpacing: '-1px',
    marginBottom: '12px',
  },
  heroSub: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: '15px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '24px',
    maxWidth: '960px',
    margin: '0 auto',
    padding: '0 24px',
    position: 'relative',
    zIndex: 1,
  },
  card: {
    background: 'rgba(255,255,255,0.05)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '20px',
    padding: '32px 28px',
    cursor: 'pointer',
    transition: 'transform 0.25s ease, border-color 0.25s ease',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  cardIconBox: {
    width: '60px',
    height: '60px',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIcon: {
    fontSize: '28px',
  },
  cardTitle: {
    color: '#fff',
    fontSize: '22px',
    fontWeight: '700',
  },
  cardDesc: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: '14px',
    lineHeight: '1.6',
  },
  cardArrow: {
    color: '#a78bfa',
    fontSize: '13px',
    fontWeight: '700',
    marginTop: '8px',
  },
  loadingText: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.4)',
    marginTop: '60px',
  },
  footer: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.2)',
    fontSize: '12px',
    marginTop: '60px',
    position: 'relative',
    zIndex: 1,
  },
}