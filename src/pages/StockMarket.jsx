import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { DSE_STOCKS, CSE_STOCKS } from '../lib/utils'
import { Star, StarOff, Search, ExternalLink, Plus, Trash2, FolderOpen, Bell, BellOff, X } from 'lucide-react'

export default function StockMarket() {
  const [exchange, setExchange] = useState('DSE')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(DSE_STOCKS[0])
  const [watchlists, setWatchlists] = useState([])
  const [activeWL, setActiveWL] = useState(null)
  const [view, setView] = useState('all')
  const [showNewWL, setShowNewWL] = useState(false)
  const [newWLName, setNewWLName] = useState('')
  const [alerts, setAlerts] = useState([]) // [{code, price, type:'above'|'below'}]
  const [showAlertForm, setShowAlertForm] = useState(false)
  const [alertPrice, setAlertPrice] = useState('')
  const [alertType, setAlertType] = useState('above')
  const [activeAlerts, setActiveAlerts] = useState([])
  const [popups, setPopups] = useState([])
  const chartRef = useRef(null)
  const chartKey = useRef(0)

  const stocks = exchange === 'DSE' ? DSE_STOCKS : CSE_STOCKS
  const filtered = stocks.filter(s =>
    s.code.toLowerCase().includes(search.toLowerCase()) ||
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.sector.toLowerCase().includes(search.toLowerCase())
  )
  const activeWLStocks = activeWL ? (watchlists.find(w => w.id === activeWL)?.stocks || []) : []
  const displayList = view === 'watchlist' ? filtered.filter(s => activeWLStocks.includes(s.code)) : filtered

  useEffect(() => { fetchWatchlists() }, [])

  useEffect(() => {
    // Load alerts from localStorage
    const saved = localStorage.getItem('bd_stock_alerts')
    if (saved) setActiveAlerts(JSON.parse(saved))
  }, [])

  useEffect(() => {
    if (selected) {
      chartKey.current += 1
      loadChart()
    }
  }, [selected])

  async function fetchWatchlists() {
    const { data } = await supabase.from('watchlist').select('*').order('created_at')
    if (!data) return
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
    if (!activeWL) { alert('আগে একটি watchlist বেছে নিন'); return }
    const wl = watchlists.find(w => w.id === activeWL)
    if (wl?.stocks.includes(code)) {
      await supabase.from('watchlist').delete().eq('stock_name', code).eq('note', activeWL)
    } else {
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

  function addAlert() {
    if (!alertPrice || !selected) return
    const newAlert = {
      id: Date.now(),
      code: selected.code,
      name: selected.name,
      price: Number(alertPrice),
      type: alertType,
      createdAt: new Date().toISOString()
    }
    const updated = [...activeAlerts, newAlert]
    setActiveAlerts(updated)
    localStorage.setItem('bd_stock_alerts', JSON.stringify(updated))
    setAlertPrice(''); setShowAlertForm(false)
    // Show confirmation popup
    showPopup(`✅ ${selected.code} এর জন্য ৳${alertPrice} Alert সেট হয়েছে!`, 'success')
  }

  function deleteAlert(id) {
    const updated = activeAlerts.filter(a => a.id !== id)
    setActiveAlerts(updated)
    localStorage.setItem('bd_stock_alerts', JSON.stringify(updated))
  }

  function showPopup(msg, type = 'info') {
    const id = Date.now()
    setPopups(prev => [...prev, { id, msg, type }])
    setTimeout(() => setPopups(prev => prev.filter(p => p.id !== id)), 4000)
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
      PUBALIBANK: 'DSE:PUBALIBANK', UCBL: 'DSE:UCBL',
      NCCBANK: 'DSE:NCCBANK', BANKASIA: 'DSE:BANKASIA',
      MERCANBANK: 'DSE:MERCANBANK', DHAKABANK: 'DSE:DHAKABANK',
      OLYMPICIND: 'DSE:OLYMPICIND', MARICO: 'DSE:MARICO',
      HEIDELBERG: 'DSE:HEIDELBERG', MICEMENT: 'DSE:MICEMENT',
      GPHISPAT: 'DSE:GPHISPAT', BSRMLTD: 'DSE:BSRMLTD',
      IBNSINA: 'DSE:IBNSINA', BEACONPHAR: 'DSE:BEACONPHAR',
    }

    const symbol = symbolMap[selected?.code] || `DSE:${selected?.code}`
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light'

    const widgetContainer = document.createElement('div')
    widgetContainer.className = 'tradingview-widget-container'
    widgetContainer.style.cssText = 'height:100%;width:100%;'

    const widgetDiv = document.createElement('div')
    widgetDiv.className = 'tradingview-widget-container__widget'
    widgetDiv.style.cssText = 'height:calc(100% - 32px);width:100%;'

    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'
    script.async = true
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol,
      interval: 'D',
      timezone: 'Asia/Dhaka',
      theme: isDark ? 'dark' : 'light',
      style: '1',
      locale: 'en',
      backgroundColor: isDark ? 'rgba(13,19,33,1)' : 'rgba(255,255,255,1)',
      gridColor: isDark ? 'rgba(30,45,71,1)' : 'rgba(221,229,245,1)',
      enable_publishing: false,
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: true,
      hide_volume: false,
      support_host: 'https://www.tradingview.com'
    })

    widgetContainer.appendChild(widgetDiv)
    widgetContainer.appendChild(script)
    chartRef.current.appendChild(widgetContainer)
  }

  const selectedAlerts = activeAlerts.filter(a => a.code === selected?.code)

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 14, height: 'calc(100vh - 76px)' }}>

      {/* Alert Popups */}
      <div style={{ position: 'fixed', top: 80, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {popups.map(p => (
          <div key={p.id} style={{
            background: p.type === 'success' ? 'var(--green)' : p.type === 'alert' ? 'var(--yellow)' : 'var(--accent2)',
            color: '#fff', padding: '12px 18px', borderRadius: 10, fontSize: 13.5,
            fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            animation: 'fadeUp 0.3s ease', display: 'flex', alignItems: 'center', gap: 8, maxWidth: 300
          }}>
            {p.msg}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 14, flex: 1, minHeight: 0 }}>
        {/* Left Panel */}
        <div style={{ width: 270, display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0, overflowY: 'auto' }}>
          <div className="tabs" style={{ marginBottom: 0 }}>
            <button className={`tab ${exchange === 'DSE' ? 'active' : ''}`} onClick={() => setExchange('DSE')}>DSE</button>
            <button className={`tab ${exchange === 'CSE' ? 'active' : ''}`} onClick={() => setExchange('CSE')}>CSE</button>
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            <button className={`period-tab ${view === 'all' ? 'active' : ''}`} onClick={() => setView('all')} style={{ flex: 1, textAlign: 'center' }}>সব</button>
            <button className={`period-tab ${view === 'watchlist' ? 'active' : ''}`} onClick={() => setView('watchlist')} style={{ flex: 1, textAlign: 'center' }}>⭐ Watchlist</button>
          </div>

          {view === 'watchlist' && (
            <div className="card" style={{ padding: 10 }}>
              <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>আমার Watchlist</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 130, overflowY: 'auto' }}>
                {watchlists.length === 0 && <div style={{ fontSize: 12, color: 'var(--text3)', padding: '4px 0' }}>কোনো watchlist নেই</div>}
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

          <div className="search-box" style={{ marginBottom: 0 }}>
            <Search size={13} />
            <input placeholder="স্টক বা সেক্টর খুঁজুন..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 5 }}>
            {displayList.length === 0 ? (
              <div className="empty" style={{ padding: 20 }}><p style={{ fontSize: 12 }}>কোনো স্টক পাওয়া যায়নি।</p></div>
            ) : displayList.map(s => (
              <div key={s.code} className="stock-row"
                style={{ borderColor: selected?.code === s.code ? 'var(--accent)' : '', background: selected?.code === s.code ? 'var(--card2)' : '' }}
                onClick={() => setSelected(s)}>
                <div style={{ flex: 1 }}>
                  <div className="stock-name">{s.code}</div>
                  <div className="stock-code">{s.name} · {s.sector}</div>
                </div>
                {view === 'watchlist' && (
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 3, color: isInActiveWL(s.code) ? 'var(--yellow)' : 'var(--text3)' }}
                    onClick={e => { e.stopPropagation(); addToWatchlist(s.code) }}>
                    {isInActiveWL(s.code) ? <Star size={12} fill="currentColor" /> : <StarOff size={12} />}
                  </button>
                )}
                {view === 'all' && (
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 3, color: isInActiveWL(s.code) ? 'var(--yellow)' : 'var(--text3)' }}
                    onClick={e => { e.stopPropagation(); addToWatchlist(s.code) }}>
                    {isInActiveWL(s.code) ? <Star size={12} fill="currentColor" /> : <StarOff size={12} />}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Chart + Alert */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
          {/* Stock Header */}
          {selected && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.4px' }}>{selected.code}</h3>
                <p style={{ color: 'var(--text2)', fontSize: 12.5 }}>{selected.name} · {selected.sector}</p>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {selectedAlerts.length > 0 && (
                  <span style={{ fontSize: 11.5, color: 'var(--yellow)', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', padding: '3px 8px', borderRadius: 20, fontWeight: 600 }}>
                    🔔 {selectedAlerts.length}টি Alert
                  </span>
                )}
                <button className="btn btn-ghost btn-sm" onClick={() => setShowAlertForm(!showAlertForm)}>
                  <Bell size={12} /> Price Alert
                </button>
                <a href={`https://www.dsebd.org/displayCompany.php?name=${selected.code}`} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">
                  <ExternalLink size={11} /> DSE
                </a>
              </div>
            </div>
          )}

          {/* Alert Form */}
          {showAlertForm && (
            <div className="card" style={{ padding: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: 'var(--text)' }}>🔔 {selected?.code} এর জন্য Price Alert</div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 140 }}>
                  <label className="form-label">Alert ধরন</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className={`btn btn-sm ${alertType === 'above' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setAlertType('above')}>📈 উপরে গেলে</button>
                    <button className={`btn btn-sm ${alertType === 'below' ? 'btn-sell' : 'btn-ghost'}`} style={alertType === 'below' ? { background: 'var(--red)', color: '#fff' } : {}} onClick={() => setAlertType('below')}>📉 নিচে গেলে</button>
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 120 }}>
                  <label className="form-label">দাম (৳)</label>
                  <input className="form-input" type="number" placeholder="যেমন: 380" value={alertPrice} onChange={e => setAlertPrice(e.target.value)} />
                </div>
                <button className="btn btn-primary" onClick={addAlert} disabled={!alertPrice}>
                  <Bell size={13} /> Alert যোগ করুন
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowAlertForm(false)}><X size={14} /></button>
              </div>

              {/* Active Alerts for this stock */}
              {selectedAlerts.length > 0 && (
                <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                  <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>সক্রিয় Alert</div>
                  {selectedAlerts.map(a => (
                    <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: 'var(--bg3)', borderRadius: 6, marginBottom: 5 }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>
                        {a.type === 'above' ? '📈' : '📉'} ৳{a.price} {a.type === 'above' ? 'এর উপরে' : 'এর নিচে'}
                      </span>
                      <button onClick={() => deleteAlert(a.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)' }}><X size={13} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* All Alerts Summary */}
          {activeAlerts.length > 0 && !showAlertForm && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {activeAlerts.slice(0, 4).map(a => (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 20, fontSize: 12, fontWeight: 600, color: 'var(--yellow)' }}>
                  🔔 {a.code} {a.type === 'above' ? '↑' : '↓'} ৳{a.price}
                  <button onClick={() => deleteAlert(a.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 0, lineHeight: 1 }}><X size={10} /></button>
                </div>
              ))}
              {activeAlerts.length > 4 && <span style={{ fontSize: 12, color: 'var(--text3)', padding: '4px 0' }}>+{activeAlerts.length - 4} আরো</span>}
            </div>
          )}

          {/* TradingView Chart */}
          <div style={{ flex: 1, minHeight: 380, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
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
