import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { DSE_STOCKS, CSE_STOCKS } from '../lib/utils'
import { Star, StarOff, Search, ExternalLink, Plus, Trash2, FolderOpen } from 'lucide-react'

export default function StockMarket() {
  const [exchange, setExchange] = useState('DSE')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(DSE_STOCKS[0])
  const [watchlists, setWatchlists] = useState([]) // [{id, name, stocks:[]}]
  const [activeWL, setActiveWL] = useState(null)
  const [view, setView] = useState('all')
  const [showNewWL, setShowNewWL] = useState(false)
  const [newWLName, setNewWLName] = useState('')
  const chartRef = useRef(null)

  const stocks = exchange === 'DSE' ? DSE_STOCKS : CSE_STOCKS
  const filtered = stocks.filter(s =>
    s.code.toLowerCase().includes(search.toLowerCase()) ||
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.sector.toLowerCase().includes(search.toLowerCase())
  )

  // Watchlist এ থাকা স্টক ফিল্টার
  const activeWLStocks = activeWL ? watchlists.find(w => w.id === activeWL)?.stocks || [] : []
  const displayList = view === 'watchlist' ? filtered.filter(s => activeWLStocks.includes(s.code)) : filtered

  useEffect(() => { fetchWatchlists() }, [])
  useEffect(() => { loadChart() }, [selected])

  async function fetchWatchlists() {
    const { data } = await supabase.from('watchlist').select('*').order('created_at')
    if (!data) return
    // গ্রুপ করি name দিয়ে
    const map = {}
    data.forEach(w => {
      if (!map[w.exchange]) map[w.exchange] = { id: w.exchange, name: w.exchange, stocks: [] }
      // stock_name কে watchlist name হিসেবে use করবো এখন
    })
    // Simple: watchlist গুলো আলাদাভাবে রাখি
    const wlMap = {}
    data.forEach(w => {
      const wlName = w.note || 'Default'
      if (!wlMap[wlName]) wlMap[wlName] = { id: wlName, name: wlName, stocks: [] }
      wlMap[wlName].stocks.push(w.stock_name)
    })
    const wls = Object.values(wlMap)
    setWatchlists(wls)
    if (wls.length > 0 && !activeWL) setActiveWL(wls[0].id)
  }

  async function addToWatchlist(code) {
    if (!activeWL) { alert('আগে একটি watchlist বেছে নিন বা তৈরি করুন'); return }
    const wl = watchlists.find(w => w.id === activeWL)
    if (wl?.stocks.includes(code)) {
      // Remove
      await supabase.from('watchlist').delete().eq('stock_name', code).eq('note', activeWL)
    } else {
      // Add
      await supabase.from('watchlist').insert({ stock_name: code, exchange, note: activeWL })
    }
    fetchWatchlists()
  }

  async function createWatchlist() {
    if (!newWLName.trim()) return
    setWatchlists(prev => [...prev, { id: newWLName, name: newWLName, stocks: [] }])
    setActiveWL(newWLName)
    setNewWLName(''); setShowNewWL(false)
  }

  async function deleteWatchlist(wlId) {
    await supabase.from('watchlist').delete().eq('note', wlId)
    setWatchlists(prev => prev.filter(w => w.id !== wlId))
    if (activeWL === wlId) setActiveWL(watchlists[0]?.id || null)
    fetchWatchlists()
  }

  function isInActiveWL(code) {
    return watchlists.find(w => w.id === activeWL)?.stocks.includes(code) || false
  }

  function loadChart() {
    if (!chartRef.current) return
    chartRef.current.innerHTML = ''
    const symbolMap = {
      GRAMEENPHONE: 'DSE:GP', SQURPHARMA: 'DSE:SQURPHARMA',
      BERGERPBL: 'DSE:BERGERPBL', BATBC: 'DSE:BATBC',
      BRACBANK: 'DSE:BRACBANK', DUTCHBANGL: 'DSE:DUTCHBANGL',
      BXPHARMA: 'DSE:BXPHARMA', RENATA: 'DSE:RENATA',
      ACI: 'DSE:ACI', ISLAMIBANK: 'DSE:ISLAMIBANK',
      EBL: 'DSE:EBL', CITYBANK: 'DSE:CITYBANK',
      BSRMSTEEL: 'DSE:BSRMSTEEL', SUMMITPOWE: 'DSE:SUMMITPOWE',
      TITASGAS: 'DSE:TITASGAS', IDLC: 'DSE:IDLC',
      LBFINANCE: 'DSE:LBFINANCE', APEXFOOT: 'DSE:APEXFOOT',
    }
    const symbol = symbolMap[selected?.code] || `DSE:${selected?.code}`
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light'

    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'
    script.async = true
    script.innerHTML = JSON.stringify({
      autosize: true, symbol, interval: 'D',
      timezone: 'Asia/Dhaka',
      theme: isDark ? 'dark' : 'light',
      style: '1', locale: 'en',
      enable_publishing: false, hide_top_toolbar: false,
      hide_legend: false, save_image: false,
    })

    const container = document.createElement('div')
    container.className = 'tradingview-widget-container'
    container.style.height = '100%'; container.style.width = '100%'
    const widgetDiv = document.createElement('div')
    widgetDiv.style.height = '100%'; widgetDiv.style.width = '100%'
    container.appendChild(widgetDiv)
    container.appendChild(script)
    chartRef.current.appendChild(container)
  }

  return (
    <div className="fade-up" style={{ height: 'calc(100vh - 76px)', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 14, flex: 1, minHeight: 0 }}>
        {/* Left Panel */}
        <div style={{ width: 270, display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0 }}>
          {/* Exchange */}
          <div className="tabs" style={{ marginBottom: 0 }}>
            <button className={`tab ${exchange === 'DSE' ? 'active' : ''}`} onClick={() => setExchange('DSE')}>DSE</button>
            <button className={`tab ${exchange === 'CSE' ? 'active' : ''}`} onClick={() => setExchange('CSE')}>CSE</button>
          </div>

          {/* View Toggle */}
          <div style={{ display: 'flex', gap: 6 }}>
            <button className={`period-tab ${view === 'all' ? 'active' : ''}`} onClick={() => setView('all')} style={{ flex: 1, textAlign: 'center' }}>সব</button>
            <button className={`period-tab ${view === 'watchlist' ? 'active' : ''}`} onClick={() => setView('watchlist')} style={{ flex: 1, textAlign: 'center' }}>⭐ Watchlist</button>
          </div>

          {/* Watchlist Manager */}
          {view === 'watchlist' && (
            <div className="card" style={{ padding: 10 }}>
              <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>আমার Watchlist</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 120, overflowY: 'auto' }}>
                {watchlists.map(wl => (
                  <div key={wl.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 8px', borderRadius: 6, background: activeWL === wl.id ? 'rgba(0,229,180,0.1)' : 'var(--bg3)', border: `1px solid ${activeWL === wl.id ? 'rgba(0,229,180,0.25)' : 'var(--border)'}`, cursor: 'pointer' }} onClick={() => setActiveWL(wl.id)}>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: activeWL === wl.id ? 'var(--accent)' : 'var(--text2)' }}>
                      <FolderOpen size={11} style={{ display: 'inline', marginRight: 4 }} />{wl.name} ({wl.stocks.length})
                    </span>
                    <button onClick={e => { e.stopPropagation(); deleteWatchlist(wl.id) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 2 }}><Trash2 size={10} /></button>
                  </div>
                ))}
              </div>
              {showNewWL ? (
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  <input className="form-input" style={{ padding: '5px 8px', fontSize: 12 }} placeholder="নাম দিন..." value={newWLName} onChange={e => setNewWLName(e.target.value)} onKeyDown={e => e.key === 'Enter' && createWatchlist()} autoFocus />
                  <button className="btn btn-primary btn-sm" onClick={createWatchlist}>✓</button>
                </div>
              ) : (
                <button className="btn btn-ghost btn-sm btn-full" style={{ marginTop: 8, fontSize: 11.5 }} onClick={() => setShowNewWL(true)}>
                  <Plus size={11} /> নতুন Watchlist
                </button>
              )}
            </div>
          )}

          {/* Search */}
          <div className="search-box" style={{ marginBottom: 0 }}>
            <Search size={13} />
            <input placeholder="স্টক বা সেক্টর খুঁজুন..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          {/* Stock List */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 5 }}>
            {displayList.length === 0 ? (
              <div className="empty" style={{ padding: 20 }}>
                <p style={{ fontSize: 12 }}>{view === 'watchlist' ? 'এই Watchlist-এ কোনো স্টক নেই।' : 'কোনো স্টক পাওয়া যায়নি।'}</p>
              </div>
            ) : displayList.map(s => (
              <div key={s.code} className="stock-row" style={{ borderColor: selected?.code === s.code ? 'var(--accent)' : '', background: selected?.code === s.code ? 'var(--card2)' : '' }} onClick={() => setSelected(s)}>
                <div>
                  <div className="stock-name">{s.code}</div>
                  <div className="stock-code">{s.name} · {s.sector}</div>
                </div>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: isInActiveWL(s.code) ? 'var(--yellow)' : 'var(--text3)', flexShrink: 0 }} onClick={e => { e.stopPropagation(); addToWatchlist(s.code) }}>
                  {isInActiveWL(s.code) ? <Star size={13} fill="currentColor" /> : <StarOff size={13} />}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Chart */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
          {selected && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.4px' }}>{selected.code}</h3>
                <p style={{ color: 'var(--text2)', fontSize: 12.5 }}>{selected.name} · {selected.sector}</p>
              </div>
              <a href={`https://www.dsebd.org/displayCompany.php?name=${selected.code}`} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">
                <ExternalLink size={11} /> DSE তে দেখুন
              </a>
            </div>
          )}
          <div className="card tv-chart" style={{ flex: 1, padding: 0, overflow: 'hidden', minHeight: 400 }}>
            <div ref={chartRef} style={{ width: '100%', height: '100%' }} />
          </div>
          <div style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'center' }}>
            চার্ট TradingView দ্বারা পরিচালিত • রিয়েল-টাইম DSE ডেটা নাও থাকতে পারে
          </div>
        </div>
      </div>
    </div>
  )
}
