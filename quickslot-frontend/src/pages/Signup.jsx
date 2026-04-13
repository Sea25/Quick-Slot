import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function Signup() {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [plateNumber, setPlateNumber] = useState('')
  const [vehicleType, setVehicleType] = useState('car')
  const [brand, setBrand] = useState('')
  const [color, setColor] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSignup() {
    setError('')
    if (!fullName || !username || !email || !phone || !password || !confirmPassword) {
      setError('Please fill in all personal details')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (!plateNumber) {
      setError('Please enter your vehicle number plate')
      return
    }
    setLoading(true)

    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .single()

    if (existing) {
      setError('Username already taken. Try another.')
      setLoading(false)
      return
    }

    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({
        full_name: fullName,
        username,
        email,
        phone,
        password_hash: password,
        role: 'user',
      })
      .select()
      .single()

    if (userError) {
      setError('Error creating account: ' + userError.message)
      setLoading(false)
      return
    }

    const { error: vehicleError } = await supabase
      .from('vehicles')
      .insert({
        user_id: newUser.id,
        plate_number: plateNumber,
        vehicle_type: vehicleType,
        brand,
        color,
      })

    if (vehicleError) {
      setError('Account created but vehicle failed: ' + vehicleError.message)
      setLoading(false)
      return
    }

    localStorage.setItem('parking_user', JSON.stringify(newUser))
    setLoading(false)
    navigate('/dashboard')
  }

  const inputStyle = {
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '12px',
    padding: '13px 16px',
    fontSize: '14px',
    color: '#fff',
    outline: 'none',
    width: '100%',
  }

  const labelStyle = {
    color: 'rgba(255,255,255,0.6)',
    fontSize: '11px',
    fontWeight: '600',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
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
        <p style={styles.tagline}>Create your account</p>

        {/* Personal Info Section */}
        <div style={styles.sectionLabel}>
          <span style={styles.sectionDot} /> Personal Information
        </div>

        <div style={styles.grid2}>
          <div style={styles.fieldGroup}>
            <label style={labelStyle}>Full Name</label>
            <input style={inputStyle} type="text" placeholder="Ravi Kumar"
              value={fullName} onChange={e => setFullName(e.target.value)} />
          </div>
          <div style={styles.fieldGroup}>
            <label style={labelStyle}>Username</label>
            <input style={inputStyle} type="text" placeholder="ravi_kochi"
              value={username} onChange={e => setUsername(e.target.value)} />
          </div>
        </div>

        <div style={styles.grid2}>
          <div style={styles.fieldGroup}>
            <label style={labelStyle}>Email</label>
            <input style={inputStyle} type="email" placeholder="ravi@email.com"
              value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div style={styles.fieldGroup}>
            <label style={labelStyle}>Phone</label>
            <input style={inputStyle} type="tel" placeholder="9876543210"
              value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
        </div>

        <div style={styles.grid2}>
          <div style={styles.fieldGroup}>
            <label style={labelStyle}>Password</label>
            <input style={inputStyle} type="password" placeholder="Create password"
              value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <div style={styles.fieldGroup}>
            <label style={labelStyle}>Confirm Password</label>
            <input style={inputStyle} type="password" placeholder="Re-enter"
              value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
          </div>
        </div>

        {/* Vehicle Info Section */}
        <div style={styles.sectionLabel}>
          <span style={styles.sectionDot} /> Vehicle Information
        </div>

        <div style={styles.fieldGroup}>
          <label style={labelStyle}>Number Plate</label>
          <input style={inputStyle} type="text" placeholder="KL-07-AB-1234"
            value={plateNumber} onChange={e => setPlateNumber(e.target.value.toUpperCase())} />
        </div>

        <div style={styles.grid3}>
          <div style={styles.fieldGroup}>
            <label style={labelStyle}>Type</label>
            <select style={{ ...inputStyle, cursor: 'pointer' }}
              value={vehicleType} onChange={e => setVehicleType(e.target.value)}>
              <option value="car">Car</option>
              <option value="bike">Bike</option>
            </select>
          </div>
          <div style={styles.fieldGroup}>
            <label style={labelStyle}>Brand</label>
            <input style={inputStyle} type="text" placeholder="Maruti Swift"
              value={brand} onChange={e => setBrand(e.target.value)} />
          </div>
          <div style={styles.fieldGroup}>
            <label style={labelStyle}>Color</label>
            <input style={inputStyle} type="text" placeholder="White"
              value={color} onChange={e => setColor(e.target.value)} />
          </div>
        </div>

        {error && (
          <div style={styles.errorBox}>{error}</div>
        )}

        <button
          style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }}
          onClick={handleSignup}
          disabled={loading}
        >
          {loading ? 'Creating Account...' : 'Create Account →'}
        </button>

        <p style={styles.bottomText}>
          Already have an account?{' '}
          <Link to="/" style={styles.link}>Login</Link>
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
    padding: '40px 20px',
    position: 'relative',
    overflow: 'hidden',
  },
  glow1: {
    position: 'absolute',
    width: '500px',
    height: '500px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)',
    top: '-150px',
    left: '-150px',
    pointerEvents: 'none',
  },
  glow2: {
    position: 'absolute',
    width: '400px',
    height: '400px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)',
    bottom: '-100px',
    right: '-100px',
    pointerEvents: 'none',
  },
  card: {
    background: 'rgba(255,255,255,0.05)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '24px',
    padding: '40px 36px',
    width: '100%',
    maxWidth: '560px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
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
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: '#fff',
    fontSize: '18px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#fff',
    letterSpacing: '-0.5px',
  },
  tagline: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.4)',
    fontSize: '13px',
    marginTop: '-8px',
  },
  sectionLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#a78bfa',
    fontSize: '12px',
    fontWeight: '700',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    marginTop: '4px',
  },
  sectionDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: '#a78bfa',
    display: 'inline-block',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '7px',
  },
  grid2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  grid3: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '12px',
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
    fontSize: '15px',
    fontWeight: '700',
    cursor: 'pointer',
    marginTop: '4px',
  },
  bottomText: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.4)',
    fontSize: '13px',
  },
  link: {
    color: '#a78bfa',
    fontWeight: '600',
    textDecoration: 'none',
  },
}