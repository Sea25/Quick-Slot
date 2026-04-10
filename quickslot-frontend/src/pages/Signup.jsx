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
      setError('Invalid username or password. Please try again.')
      return
    }

    localStorage.setItem('parking_user', JSON.stringify(data))

    if (data.role === 'staff') {
      navigate('/staff')
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        {/* Logo */}
        <div style={styles.logoBox}>
          <span style={styles.logoIcon}>🅿️</span>
          <h1 style={styles.logoText}>QuickSlot</h1>
        </div>

        <p style={styles.subtitle}>Smart Parking Made Simple</p>
        <p style={styles.formTitle}>Sign in to your account</p>

        {/* Username */}
        <div style={styles.inputGroup}>
          <label style={styles.label}>Username</label>
          <input
            style={styles.input}
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={e => setUsername(e.target.value)}
          />
        </div>

        {/* Password */}
        <div style={styles.inputGroup}>
          <label style={styles.label}>Password</label>
          <input
            style={styles.input}
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </div>

        {/* Error */}
        {error && (
          <div style={styles.errorBox}>
            ⚠️ {error}
          </div>
        )}

        {/* Login Button */}
        <button
          style={{
            ...styles.button,
            opacity: loading ? 0.7 : 1,
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? 'Signing in...' : 'Login'}
        </button>

        {/* Divider */}
        <div style={styles.divider}>
          <div style={styles.dividerLine} />
          <span style={styles.dividerText}>or</span>
          <div style={styles.dividerLine} />
        </div>

        {/* Signup Link */}
        <p style={styles.bottomText}>
          Don't have an account?{' '}
          <Link to="/signup" style={styles.link}>
            Create Account
          </Link>
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
    backgroundColor: '#eef2ff',
    padding: '20px',
  },
  card: {
    backgroundColor: '#ffffff',
    padding: '40px 36px',
    borderRadius: '20px',
    boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
    width: '100%',
    maxWidth: '420px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  logoBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
  },
  logoIcon: {
    fontSize: '36px',
  },
  logoText: {
    fontSize: '30px',
    fontWeight: '800',
    color: '#4f46e5',
  },
  subtitle: {
    textAlign: 'center',
    color: '#888',
    fontSize: '14px',
    marginTop: '-10px',
  },
  formTitle: {
    textAlign: 'center',
    fontWeight: '600',
    fontSize: '17px',
    color: '#1a1a2e',
    marginTop: '6px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#444',
  },
  input: {
    padding: '12px 14px',
    borderRadius: '10px',
    border: '1.5px solid #ddd',
    fontSize: '15px',
    outline: 'none',
    transition: 'border 0.2s',
    backgroundColor: '#fafafa',
  },
  errorBox: {
    backgroundColor: '#fff0f0',
    border: '1px solid #ffcccc',
    borderRadius: '8px',
    padding: '10px 14px',
    color: '#cc0000',
    fontSize: '13px',
  },
  button: {
    padding: '13px',
    backgroundColor: '#4f46e5',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: '700',
    marginTop: '4px',
    transition: 'background 0.2s',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    color: '#aaa',
    fontSize: '13px',
  },
  bottomText: {
    textAlign: 'center',
    fontSize: '14px',
    color: '#555',
  },
  link: {
    color: '#4f46e5',
    fontWeight: '700',
    textDecoration: 'none',
  },
}