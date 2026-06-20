import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './hooks/useAuth'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import Portfolio from './pages/Portfolio'
import StockMarket from './pages/StockMarket'
import Calculator from './pages/Calculator'
import Signals from './pages/Signals'
import ProfilePage from './pages/Profile'
import Report from './pages/Report'
import Notes from './pages/Notes'
import UnrealizedReport from './pages/UnrealizedReport'
import Ledger from './pages/Ledger'
import AddTransactionModal from './components/AddTransactionModal'
import {
  LayoutDashboard, BarChart2, TrendingUp, Calculator as CalcIcon,
  Zap, FileText, StickyNote, Wallet, Sun, Moon, Menu, X, Plus, LogOut, User
} from 'lucide-react'
import { supabase } from './lib/supabase'

const NAV = [
  { id: 'dashboard', label: 'ড্যাশবোর্ড', icon: LayoutDashboard },
  { id: 'ledger', label: 'লেডজার', icon: Wallet },
  { id: 'portfolio', label: 'পোর্টফোলিও', icon: BarChart2 },
  { id: 'market', label: 'স্টক মার্কেট', icon: TrendingUp },
  { id: 'calculator', label: 'ক্যালকুলেটর', icon: CalcIcon },
  { id: 'signals', label: 'সিগন্যাল', icon: Zap },
  { id: 'report', label: 'রিপোর্ট', icon: FileText },
  { id: 'notes', label: 'নোট', icon: StickyNote },
  { id: 'unrealized-report', label: 'Unrealized P&L', icon: TrendingUp },
]

// Mobile bottom bar — সবচেয়ে দরকারি ৫টা (৪টা + More)
const MOBILE_NAV = [
  { id: 'dashboard', label: 'হোম', icon: LayoutDashboard },
  { id: 'ledger', label: 'লেডজার', icon: Wallet },
  { id: 'portfolio', label: 'পোর্টফোলিও', icon: BarChart2 },
  { id: 'market', label: 'মার্কেট', icon: TrendingUp },
  { id: 'more', label: 'আরও', icon: Menu },
]

// "More" শীটে বাকি সব ট্যাব
const MORE_NAV = [
  { id: 'calculator', label: 'ক্যালকুলেটর', icon: CalcIcon },
  { id: 'signals', label: 'সিগন্যাল', icon: Zap },
  { id: 'report', label: 'রিপোর্ট', icon: FileText },
  { id: 'notes', label: 'নোট', icon: StickyNote },
  { id: 'unrealized-report', label: 'Unrealized', icon: TrendingUp },
]

function AppInner() {
  const { user, profile, loading } = useAuth()
  const [page, setPage] = useState('dashboard')
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  function toggleTheme() {
    setTheme(t => t === 'dark' ? 'light' : 'dark')
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📈</div>
          <div className="spinner" style={{ margin: '0 auto' }} />
          <p style={{ marginTop: 12, color: 'var(--text2)', fontSize: 14 }}>লোড হচ্ছে...</p>
        </div>
      </div>
    )
  }

  if (!user) return <AuthPage />

  const initials = (profile?.full_name || user.email || '?').charAt(0).toUpperCase()

  const PAGE_TITLES = {
    dashboard: '🏠 ড্যাশবোর্ড',
    ledger: '📒 লেডজার',
    portfolio: '📊 পোর্টফোলিও',
    market: '📈 স্টক মার্কেট',
    calculator: '🧮 ক্যালকুলেটর',
    signals: '⚡ সিগন্যাল',
    report: '📄 রিপোর্ট',
    notes: '📝 নোট',
    'unrealized-report': '📊 Unrealized P&L',
    profile: '👤 প্রোফাইল',
  }

  function renderPage() {
    switch (page) {
      case 'dashboard': return <Dashboard onNavigate={setPage} />
      case 'ledger': return <Ledger />
      case 'portfolio': return <Portfolio />
      case 'market': return <StockMarket />
      case 'calculator': return <Calculator />
      case 'signals': return <Signals />
      case 'report': return <Report />
      case 'notes': return <Notes />
      case 'unrealized-report': return <UnrealizedReport />
      case 'profile': return <ProfilePage />
      default: return <Dashboard onNavigate={setPage} />
    }
  }

  return (
    <div className="app-layout">
      {/* Sidebar Overlay (mobile) */}
      <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/SK-Stocks-BD/logo-icon.png" alt="BD Stock" style={{ width: 34, height: 34, borderRadius: 8, flexShrink: 0 }} />
          <div>
            <h1 style={{ marginBottom: 0 }}>BD Stock</h1>
            <span>বিনিয়োগ ট্র্যাকার</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV.map(item => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                className={`nav-item ${page === item.id ? 'active' : ''}`}
                onClick={() => { setPage(item.id); setSidebarOpen(false) }}
              >
                <Icon size={18} />
                {item.label}
              </button>
            )
          })}

          <div style={{ marginTop: 8, padding: '8px 0', borderTop: '1px solid var(--border)' }}>
            <button
              className="btn btn-primary btn-full btn-sm"
              onClick={() => { setShowAddModal(true); setSidebarOpen(false) }}
              style={{ justifyContent: 'center' }}
            >
              <Plus size={14} /> ট্রানজেকশন যোগ
            </button>
          </div>
        </nav>

        <div className="sidebar-bottom">
          <button
            className={`nav-item ${page === 'profile' ? 'active' : ''}`}
            onClick={() => { setPage('profile'); setSidebarOpen(false) }}
          >
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), var(--accent2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff', overflow: 'hidden', flexShrink: 0 }}>
              {profile?.avatar_url ? <img src={profile.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile?.full_name || 'প্রোফাইল'}</div>
              <div style={{ fontSize: 10, color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
            </div>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-left">
            <span className="topbar-title">{PAGE_TITLES[page]}</span>
          </div>
          <div className="topbar-right">
            <button className="icon-btn" onClick={toggleTheme} title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}>
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button
              className="avatar-btn"
              onClick={() => setPage('profile')}
              title="প্রোফাইল"
            >
              {profile?.avatar_url ? <img src={profile.avatar_url} alt="avatar" /> : initials}
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="page-content">
          {renderPage()}
        </div>
      </main>

      {showAddModal && <AddTransactionModal onClose={() => setShowAddModal(false)} />}

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-bottom-nav">
        {MOBILE_NAV.map(item => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              className={`mobile-nav-item ${page === item.id ? 'active' : ''}`}
              onClick={() => item.id === 'more' ? setShowMoreMenu(true) : setPage(item.id)}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Mobile "More" Menu */}
      {showMoreMenu && (
        <div className="sidebar-overlay open" onClick={() => setShowMoreMenu(false)} style={{ zIndex: 200 }}>
          <div className="mobile-more-sheet" onClick={e => e.stopPropagation()}>
            <div className="mobile-more-handle" />
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, paddingLeft: 4 }}>আরও</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {MORE_NAV.map(item => {
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    className={`nav-item ${page === item.id ? 'active' : ''}`}
                    style={{ flexDirection: 'column', alignItems: 'flex-start', height: 64, justifyContent: 'center', gap: 6 }}
                    onClick={() => { setPage(item.id); setShowMoreMenu(false) }}
                  >
                    <Icon size={18} />
                    {item.label}
                  </button>
                )
              })}
              <button
                className="nav-item"
                style={{ flexDirection: 'column', alignItems: 'flex-start', height: 64, justifyContent: 'center', gap: 6 }}
                onClick={() => { setPage('profile'); setShowMoreMenu(false) }}
              >
                <User size={18} /> প্রোফাইল
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}
