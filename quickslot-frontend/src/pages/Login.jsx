import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function Login() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setError('')
    if (!username || !password) {
      setError('Please enter both username and password')
      return
    }
    setLoading(true)
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('password_hash', password)
      .single()
    setLoading(false)
    if (error || !data) {
      setError('Invalid username or password')
      return
    }
    localStorage.setItem('parking_user', JSON.stringify(data))
    if (data.role === 'staff') navigate('/staff')
    else navigate('/dashboard')
  }

  return (
    <div style={styles.page}>
      <div style={styles.glow1} />
      <div style={styles.glow2} />

      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logoRow}>
          <div style={styles.logoIcon}>P</div>
          <span style={styles.logoText}>QuickSlot</span>
        </div>
        <p style={styles.tagline}>Smart parking, made simple</p>
        <p style={styles.formHeading}>Welcome back</p>

        {/* Fields */}
        <div style={styles.fieldGroup}>
          <label style={styles.label}>Username</label>
          <input
            style={styles.input}
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={e => setUsername(e.target.value)}
          />
        </div>

        <div style={styles.fieldGroup}>
          <label style={styles.label}>Password</label>
          <input
            style={styles.input}
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}

        <button
          style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }}
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? 'Signing in...' : 'Login →'}
        </button>

        <p style={styles.bottomText}>
          Don't have an account?{' '}
          <Link to="/signup" style={styles.link}>Create one</Link>
        </p>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #0f0f1a 100%)',
    padding: '20px',
    position: 'relative',
    overflow: 'hidden',
  },
  glow1: {
    position: 'absolute',
    width: '400px',
    height: '400px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)',
    top: '-100px',
    left: '-100px',
    pointerEvents: 'none',
  },
  glow2: {
    position: 'absolute',
    width: '350px',
    height: '350px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)',
    bottom: '-80px',
    right: '-80px',
    pointerEvents: 'none',
  },
  card: {
    background: 'rgba(255,255,255,0.05)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '24px',
    padding: '44px 40px',
    width: '100%',
    maxWidth: '420px',
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
    position: 'relative',
    zIndex: 1,
  },
  logoRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
  },
  logoIcon: {
    width: '42px',
    height: '42px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: '#fff',
    fontSize: '20px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: '26px',
    fontWeight: '700',
    color: '#fff',
    letterSpacing: '-0.5px',
  },
  tagline: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.4)',
    fontSize: '13px',
    marginTop: '-10px',
  },
  formHeading: {
    color: '#fff',
    fontSize: '18px',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: '4px',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: '12px',
    fontWeight: '600',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
  },
  input: {
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '12px',
    padding: '13px 16px',
    fontSize: '15px',
    color: '#fff',
    outline: 'none',
    transition: 'border 0.2s',
  },
  errorBox: {
    background: 'rgba(239,68,68,0.15)',
    border: '1px solid rgba(239,68,68,0.3)',
    borderRadius: '10px',
    padding: '10px 14px',
    color: '#fca5a5',
    fontSize: '13px',
  },
  btn: {
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    padding: '14px',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    marginTop: '4px',
    letterSpacing: '0.3px',
  },
  bottomText: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.45)',
    fontSize: '13px',
  },
  link: {
    color: '#a78bfa',
    fontWeight: '600',
    textDecoration: 'none',
  },
}