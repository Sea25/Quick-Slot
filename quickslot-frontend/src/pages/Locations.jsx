import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function Locations() {
  const { categoryId } = useParams()
  const navigate = useNavigate()
  const [allBuildings, setAllBuildings] = useState([])
  const [filtered, setFiltered] = useState([])
  const [categoryName, setCategoryName] = useState('')
  const [districts, setDistricts] = useState([])
  const [selectedDistrict, setSelectedDistrict] = useState('All')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    applyFilter()
  }, [selectedDistrict, search, allBuildings])

  async function fetchData() {
    const { data: cat } = await supabase
      .from('categories')
      .select('name')
      .eq('id', categoryId)
      .single()
    if (cat) setCategoryName(cat.name)

    const { data: buildings } = await supabase
      .from('buildings')
      .select('*')
      .eq('category_id', categoryId)
      .eq('is_active', true)

    const list = buildings || []
    setAllBuildings(list)
    setFiltered(list)

    // Get unique districts
    const unique = [...new Set(list.map(b => b.district).filter(Boolean))]
    setDistricts(unique.sort())
    setLoading(false)
  }

  function applyFilter() {
    let result = [...allBuildings]
    if (selectedDistrict !== 'All') {
      result = result.filter(b => b.district === selectedDistrict)
    }
    if (search.trim()) {
      result = result.filter(b =>
        b.name.toLowerCase().includes(search.toLowerCase()) ||
        b.city.toLowerCase().includes(search.toLowerCase())
      )
    }
    setFiltered(result)
  }

  const categoryIcons = {
    Mall: '🏬',
    Hospital: '🏥',
    Theatre: '🎬',
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
        <button style={styles.backBtn} onClick={() => navigate('/dashboard')}>
          ← Back
        </button>
      </div>

      {/* Header */}
      <div style={styles.hero}>
        <div style={styles.heroIcon}>
          {categoryIcons[categoryName] || '🅿️'}
        </div>
        <h1 style={styles.heroTitle}>{categoryName}s</h1>
        <p style={styles.heroSub}>Filter by district or search by name</p>
      </div>

      {/* Filters */}
      <div style={styles.filterBar}>
        {/* Search */}
        <input
          style={styles.searchInput}
          type="text"
          placeholder="🔍  Search by name or city..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        {/* District Pills */}
        <div style={styles.pillsRow}>
          {['All', ...districts].map(d => (
            <button
              key={d}
              style={{
                ...styles.pill,
                background: selectedDistrict === d
                  ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                  : 'rgba(255,255,255,0.06)',
                border: selectedDistrict === d
                  ? '1px solid transparent'
                  : '1px solid rgba(255,255,255,0.12)',
                color: selectedDistrict === d
                  ? '#fff'
                  : 'rgba(255,255,255,0.55)',
              }}
              onClick={() => setSelectedDistrict(d)}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count */}
      {!loading && (
        <p style={styles.resultCount}>
          {filtered.length} location{filtered.length !== 1 ? 's' : ''} found
          {selectedDistrict !== 'All' ? ` in ${selectedDistrict}` : ''}
        </p>
      )}

      {/* Buildings Grid */}
      {loading ? (
        <p style={styles.loadingText}>Loading locations...</p>
      ) : filtered.length === 0 ? (
        <div style={styles.emptyBox}>
          <p style={styles.emptyIcon}>🔍</p>
          <p style={styles.emptyText}>No locations found</p>
          <p style={styles.emptySub}>Try a different district or search term</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {filtered.map(building => (
            <div
              key={building.id}
              style={styles.card}
              onClick={() => navigate(`/slots/${building.id}`)}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-5px)'
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
              }}
            >
              <div style={styles.cardTop}>
                <div style={styles.buildingInitial}>
                  {building.name.charAt(0)}
                </div>
                <div style={styles.cardBadge}>Open</div>
              </div>

              <h2 style={styles.cardTitle}>{building.name}</h2>

              <div style={styles.cardInfoRow}>
                <span style={styles.cardInfoText}>📍 {building.address}</span>
              </div>
              <div style={styles.cardInfoRow}>
                <span style={styles.cardInfoText}>🏙️ {building.city}</span>
                <span style={styles.districtTag}>{building.district}</span>
              </div>

              <div style={styles.cardFooter}>
                <span style={styles.cardFooterText}>View Parking Slots →</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #0f0f1a 100%)',
    paddingBottom: '60px',
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
  backBtn: {
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '10px',
    color: '#fff',
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  hero: {
    textAlign: 'center',
    padding: '50px 20px 30px',
    position: 'relative',
    zIndex: 1,
  },
  heroIcon: {
    fontSize: '48px',
    marginBottom: '12px',
  },
  heroTitle: {
    color: '#fff',
    fontSize: '32px',
    fontWeight: '800',
    letterSpacing: '-1px',
    marginBottom: '8px',
  },
  heroSub: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: '14px',
  },
  filterBar: {
    maxWidth: '960px',
    margin: '0 auto 10px',
    padding: '0 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    position: 'relative',
    zIndex: 1,
  },
  searchInput: {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '14px',
    padding: '14px 18px',
    fontSize: '14px',
    color: '#fff',
    outline: 'none',
    width: '100%',
  },
  pillsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  pill: {
    padding: '8px 18px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  resultCount: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.3)',
    fontSize: '12px',
    marginBottom: '20px',
    position: 'relative',
    zIndex: 1,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px',
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
    padding: '28px 24px',
    cursor: 'pointer',
    transition: 'transform 0.25s ease, border-color 0.25s ease',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  cardTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '6px',
  },
  buildingInitial: {
    width: '48px',
    height: '48px',
    borderRadius: '14px',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: '#fff',
    fontSize: '22px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBadge: {
    background: 'rgba(34,197,94,0.15)',
    border: '1px solid rgba(34,197,94,0.3)',
    borderRadius: '20px',
    color: '#86efac',
    fontSize: '11px',
    fontWeight: '700',
    padding: '4px 12px',
  },
  cardTitle: {
    color: '#fff',
    fontSize: '20px',
    fontWeight: '700',
  },
  cardInfoRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
  },
  cardInfoText: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: '13px',
  },
  districtTag: {
    background: 'rgba(99,102,241,0.2)',
    border: '1px solid rgba(99,102,241,0.3)',
    borderRadius: '20px',
    color: '#a78bfa',
    fontSize: '11px',
    fontWeight: '600',
    padding: '3px 10px',
    whiteSpace: 'nowrap',
  },
  cardFooter: {
    marginTop: '10px',
    paddingTop: '14px',
    borderTop: '1px solid rgba(255,255,255,0.08)',
  },
  cardFooterText: {
    color: '#a78bfa',
    fontSize: '13px',
    fontWeight: '700',
  },
  loadingText: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.4)',
    marginTop: '60px',
    fontSize: '15px',
  },
  emptyBox: {
    textAlign: 'center',
    marginTop: '60px',
    position: 'relative',
    zIndex: 1,
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '8px',
  },
  emptySub: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: '14px',
  },
}