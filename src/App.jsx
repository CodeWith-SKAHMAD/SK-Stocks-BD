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
  Zap, FileText, StickyNote, Wallet, Sun, Moon, Menu, X, Plus, LogOut
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

function AppInner() {
  const { user, profile, loading } = useAuth()
  const [page, setPage] = useState('dashboard')
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark')
  const [sidebarOpen, setSidebarOpen] = useState(false)
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
        <div className="sidebar-logo">
          <h1>📈 BD Stock</h1>
          <span>বিনিয়োগ ট্র্যাকার</span>
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
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}>
              <Menu size={18} />
            </button>
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
