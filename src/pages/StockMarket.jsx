import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { DSE_STOCKS, CSE_STOCKS } from '../lib/utils'
import { Star, StarOff, Search, ExternalLink, Plus, Trash2, FolderOpen, Bell, X, Edit2 } from 'lucide-react'

export default function StockMarket() {
  const [exchange, setExchange] = useState('DSE')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(DSE_STOCKS[0])
  const [customStocks, setCustomStocks] = useState([])
  const [watchlists, setWatchlists] = useState([])
  const [watchlistStocks, setWatchlistStocks] = useState([])
  const [activeWL, setActiveWL] = useState(null)
  const [view, setView] = useState('all')
  const [showNewWL, setShowNewWL] = useState(false)
  const [newWLName, setNewWLName] = useState('')
  const [showAlertForm, setShowAlertForm] = useState(false)
  const [alertPrice, setAlertPrice] = useState('')
  const [alertType, setAlertType] = useState('above')
  const [activeAlerts, setActiveAlerts] = useState([])
  const [popups, setPopups] = useState([])
  const [showAddStockModal, setShowAddStockModal] = useState(false)
  const [editingStock, setEditingStock] = useState(null)
  const [newStockCode, setNewStockCode] = useState('')
  const [newStockName, setNewStockName] = useState('')
  const [newStockSector, setNewStockSector] = useState('')
  const chartRef = useRef(null)

  const builtinStocks = exchange === 'DSE' ? DSE_STOCKS : CSE_STOCKS
  const customForExchange = customStocks.filter(s => s.exchange === exchange)
  const allStocks = [...builtinStocks, ...customForExchange]

  const filtered = allStocks.filter(s =>
    s.code.toLowerCase().includes(search.toLowerCase()) ||
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.sector || '').toLowerCase().includes(search.toLowerCase())
  )

  const activeWLStockCodes = activeWL ? watchlistStocks.filter(w => w.watchlist_id === activeWL).map(w => w.stock_name) : []
  const displayList = view === 'watchlist' ? filtered.filter(s => activeWLStockCodes.includes(s.code)) : filtered

  useEffect(() => {
    fetchWatchlists()
    fetchCustomStocks()
    const saved = localStorage.getItem('bd_stock_alerts')
    if (saved) setActiveAlerts(JSON.parse(saved))

    const channel = supabase
      .channel('stockmarket-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'watchlists' }, () => fetchWatchlists())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'watchlist' }, () => fetchWatchlists())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'custom_stocks' }, () => fetchCustomStocks())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  useEffect(() => { if (selected) loadChart() }, [selected])

  async function fetchWatchlists() {
    const { data: wls } = await supabase.from('watchlists').select('*').order('created_at')
    const { data: stocks } = await supabase.from('watchlist').select('*')
    setWatchlists(wls || [])
    setWatchlistStocks((stocks || []).filter(s => s.watchlist_id).map(s => ({ watchlist_id: s.watchlist_id, stock_name: s.stock_name })))
    if (wls && wls.length > 0 && !activeWL) setActiveWL(wls[0].id)
  }

  async function fetchCustomStocks() {
    const { data } = await supabase.from('custom_stocks').select('*').order('created_at')
    setCustomStocks(data || [])
  }

  async function createWatchlist() {
    if (!newWLName.trim()) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data, error } = await supabase.from('watchlists').insert({ user_id: user.id, name: newWLName.trim() }).select().single()
    if (!error && data) {
      setActiveWL(data.id)
      setNewWLName(''); setShowNewWL(false)
      fetchWatchlists()
    }
  }

  async function deleteWatchlist(wlId) {
    if (!confirm('এই Watchlist মুছে ফেলবেন?')) return
    await supabase.from('watchlists').delete().eq('id', wlId)
    if (activeWL === wlId) setActiveWL(null)
    fetchWatchlists()
  }

  async function toggleInWatchlist(code) {
    if (!activeWL) { showPopup('আগে একটি Watchlist তৈরি করুন বা বেছে নিন', 'alert'); return }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const isIn = activeWLStockCodes.includes(code)
    if (isIn) {
      await supabase.from('watchlist').delete().eq('watchlist_id', activeWL).eq('stock_name', code)
    } else {
      await supabase.from('watchlist').insert({ user_id: user.id, stock_name: code, exchange, watchlist_id: activeWL })
    }
    fetchWatchlists()
  }

  function isInActiveWL(code) {
    return activeWLStockCodes.includes(code)
  }

  function openAddStock() {
    setEditingStock(null)
    setNewStockCode(''); setNewStockName(''); setNewStockSector('')
    setShowAddStockModal(true)
  }

  function openEditStock(stock) {
    setEditingStock(stock)
    setNewStockCode(stock.code); setNewStockName(stock.name); setNewStockSector(stock.sector || '')
    setShowAddStockModal(true)
  }

  async function saveCustomStock() {
    if (!newStockCode.trim() || !newStockName.trim()) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (editingStock) {
      await supabase.from('custom_stocks').update({
        code: newStockCode.trim().toUpperCase(), name: newStockName.trim(), sector: newStockSector.trim() || 'অন্যান্য'
      }).eq('id', editingStock.id)
      showPopup('✅ স্টক আপডেট হয়েছে', 'success')
    } else {
      const { error } = await supabase.from('custom_stocks').insert({
        user_id: user.id, code: newStockCode.trim().toUpperCase(), name: newStockName.trim(),
        sector: newStockSector.trim() || 'অন্যান্য', exchange
      })
      if (error) { showPopup('⚠️ এই কোড আগে থেকেই আছে', 'alert'); return }
      showPopup('✅ নতুন স্টক যোগ হয়েছে', 'success')
    }
    setShowAddStockModal(false)
    fetchCustomStocks()
  }

  async function deleteCustomStock(id) {
    if (!confirm('এই স্টক মুছে ফেলবেন?')) return
    await supabase.from('custom_stocks').delete().eq('id', id)
    fetchCustomStocks()
  }

  function addAlert() {
    if (!alertPrice || !selected) return
    const newAlert = {
      id: Date.now(), code: selected.code, name: selected.name,
      price: Number(alertPrice), type: alertType, createdAt: new Date().toISOString()
    }
    const updated = [...activeAlerts, newAlert]
    setActiveAlerts(updated)
    localStorage.setItem('bd_stock_alerts', JSON.stringify(updated))
    setAlertPrice(''); setShowAlertForm(false)
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
      GRAMEENPHONE: 'DSE:GRAMEENPHONE', SQURPHARMA: 'DSE:SQURPHARMA', BERGERPBL: 'DSE:BERGERPBL',
      BATBC: 'DSE:BATBC', BRACBANK: 'DSE:BRACBANK', DUTCHBANGL: 'DSE:DUTCHBANGL',
      BXPHARMA: 'DSE:BXPHARMA', RENATA: 'DSE:RENATA', ACI: 'DSE:ACI', ISLAMIBANK: 'DSE:ISLAMIBANK',
      EBL: 'DSE:EBL', CITYBANK: 'DSE:CITYBANK', BSRMSTEEL: 'DSE:BSRMSTEEL', SUMMITPOWE: 'DSE:SUMMITPOWE',
      TITASGAS: 'DSE:TITASGAS', IDLC: 'DSE:IDLC', LBFINANCE: 'DSE:LBFINANCE', APEXFOOT: 'DSE:APEXFOOT',
      PUBALIBANK: 'DSE:PUBALIBANK', UCBL: 'DSE:UCBL', NCCBANK: 'DSE:NCCBANK', BANKASIA: 'DSE:BANKASIA',
      MERCANBANK: 'DSE:MERCANBANK', DHAKABANK: 'DSE:DHAKABANK', OLYMPICIND: 'DSE:OLYMPICIND',
      MARICO: 'DSE:MARICO', HEIDELBERG: 'DSE:HEIDELBERG', MICEMENT: 'DSE:MICEMENT',
      GPHISPAT: 'DSE:GPHISPAT', BSRMLTD: 'DSE:BSRMLTD', IBNSINA: 'DSE:IBNSINA', BEACONPHAR: 'DSE:BEACONPHAR',
      SOUTHEASTB: 'DSE:SOUTHEASTB', EXIM: 'DSE:EXIM', PREMIERBAN: 'DSE:PREMIERBAN', MUTUALBANK: 'DSE:MUTUALBANK',
      ONEBANKLTD: 'DSE:ONEBANKLTD', JAMUNABANKL: 'DSE:JAMUNABANKL', SHAHJABANK: 'DSE:SHAHJABANK',
      FIRSTSBANK: 'DSE:FIRSTSBANK', UNIONBANK: 'DSE:UNIONBANK', GLOBALBANK: 'DSE:GLOBALBANK',
      AB: 'DSE:AB', IFIC: 'DSE:IFIC', STANDBANKL: 'DSE:STANDBANKL', UTTARABANK: 'DSE:UTTARABANK',
    }
    const symbol = symbolMap[selected?.code] || `DSE:${selected?.code}`
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark'

    const widgetContainer = document.createElement('div')
    widgetContainer.className = 'tradingview-widget-container'
    widgetContainer.style.cssText = 'height:100%;width:100%;'
    const widgetDiv = document.createElement('div')
    widgetDiv.style.cssText = 'height:calc(100% - 32px);width:100%;'
    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'
    script.async = true
    script.innerHTML = JSON.stringify({
      autosize: true, symbol, interval: 'D', timezone: 'Asia/Dhaka',
      theme: isDark ? 'dark' : 'light', style: '1', locale: 'en',
      enable_publishing: false, hide_top_toolbar: false, hide_legend: false, save_image: true,
      support_host: 'https://www.tradingview.com'
    })
    widgetContainer.appendChild(widgetDiv)
    widgetContainer.appendChild(script)
    chartRef.current.appendChild(widgetContainer)
  }

  const selectedAlerts = activeAlerts.filter(a => a.code === selected?.code)
  const isCustomStock = customStocks.some(s => s.code === selected?.code)

  return (
    <div className="fade-up stock-market-page">

      <div style={{ position: 'fixed', top: 80, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {popups.map(p => (
          <div key={p.id} style={{
            background: p.type === 'success' ? 'var(--green)' : p.type === 'alert' ? 'var(--yellow)' : 'var(--accent2)',
            color: '#fff', padding: '12px 18px', borderRadius: 10, fontSize: 13.5,
            fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            animation: 'fadeUp 0.3s ease', display: 'flex', alignItems: 'center', gap: 8, maxWidth: 300
          }}>{p.msg}</div>
        ))}
      </div>

      <div className="stock-market-layout">
        <div className="stock-market-sidebar">
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
                {watchlists.map(wl => {
                  const count = watchlistStocks.filter(w => w.watchlist_id === wl.id).length
                  return (
                    <div key={wl.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 8px', borderRadius: 6, background: activeWL === wl.id ? 'var(--glow-g)' : 'var(--glass)', border: `1px solid ${activeWL === wl.id ? 'var(--accent)' : 'var(--border)'}`, cursor: 'pointer' }} onClick={() => setActiveWL(wl.id)}>
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: activeWL === wl.id ? 'var(--accent)' : 'var(--text2)' }}>
                        <FolderOpen size={11} style={{ display: 'inline', marginRight: 4 }} />{wl.name} ({count})
                      </span>
                      <button onClick={e => { e.stopPropagation(); deleteWatchlist(wl.id) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 2 }}><Trash2 size={10} /></button>
                    </div>
                  )
                })}
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

          <button className="btn btn-ghost btn-sm btn-full" onClick={openAddStock}>
            <Plus size={12} /> নতুন স্টক যোগ করুন
          </button>

          <div className="stock-list-scroll">
            {displayList.length === 0 ? (
              <div className="empty" style={{ padding: 20 }}><p style={{ fontSize: 12 }}>কোনো স্টক পাওয়া যায়নি।</p></div>
            ) : displayList.map(s => {
              const isCustom = customStocks.some(c => c.id === s.id)
              return (
                <div key={s.code + (s.id || '')} className="stock-row" style={{ borderColor: selected?.code === s.code ? 'var(--accent)' : '', background: selected?.code === s.code ? 'var(--glass2)' : '' }} onClick={() => setSelected(s)}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="stock-name">{s.code} {isCustom && <span style={{ fontSize: 9, color: 'var(--accent2)', fontWeight: 600 }}>(কাস্টম)</span>}</div>
                    <div className="stock-code">{s.name} · {s.sector}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                    {isCustom && (
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text3)' }} onClick={e => { e.stopPropagation(); openEditStock(s) }}>
                        <Edit2 size={12} />
                      </button>
                    )}
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: isInActiveWL(s.code) ? 'var(--yellow)' : 'var(--text3)' }} onClick={e => { e.stopPropagation(); toggleInWatchlist(s.code) }}>
                      {isInActiveWL(s.code) ? <Star size={13} fill="currentColor" /> : <StarOff size={13} />}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="stock-market-chart-area">
          {selected && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.4px' }}>{selected.code}</h3>
                <p style={{ color: 'var(--text2)', fontSize: 12.5 }}>{selected.name} · {selected.sector}</p>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                {selectedAlerts.length > 0 && (
                  <span style={{ fontSize: 11.5, color: 'var(--yellow)', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', padding: '3px 8px', borderRadius: 20, fontWeight: 600 }}>
                    🔔 {selectedAlerts.length}টি Alert
                  </span>
                )}
                <button className="btn btn-ghost btn-sm" onClick={() => setShowAlertForm(!showAlertForm)}>
                  <Bell size={12} /> Price Alert
                </button>
                {isCustomStock && (
                  <button className="btn btn-ghost btn-sm" onClick={() => openEditStock(selected)}>
                    <Edit2 size={11} /> সম্পাদনা
                  </button>
                )}
                <a href={`https://www.dsebd.org/displayCompany.php?name=${selected.code}`} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">
                  <ExternalLink size={11} /> DSE
                </a>
              </div>
            </div>
          )}

          {showAlertForm && (
            <div className="card" style={{ padding: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>🔔 {selected?.code} এর জন্য Price Alert</div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 140 }}>
                  <label className="form-label">Alert ধরন</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className={`btn btn-sm ${alertType === 'above' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setAlertType('above')}>📈 উপরে</button>
                    <button className={`btn btn-sm ${alertType === 'below' ? '' : 'btn-ghost'}`} style={alertType === 'below' ? { background: 'var(--red)', color: '#fff' } : {}} onClick={() => setAlertType('below')}>📉 নিচে</button>
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 120 }}>
                  <label className="form-label">দাম (৳)</label>
                  <input className="form-input" type="number" placeholder="380" value={alertPrice} onChange={e => setAlertPrice(e.target.value)} />
                </div>
                <button className="btn btn-primary" onClick={addAlert} disabled={!alertPrice}><Bell size={13} /> যোগ করুন</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowAlertForm(false)}><X size={14} /></button>
              </div>
              {selectedAlerts.length > 0 && (
                <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                  {selectedAlerts.map(a => (
                    <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: 'var(--glass)', borderRadius: 6, marginBottom: 5 }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{a.type === 'above' ? '📈' : '📉'} ৳{a.price} {a.type === 'above' ? 'এর উপরে' : 'এর নিচে'}</span>
                      <button onClick={() => deleteAlert(a.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)' }}><X size={13} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="stock-chart-box">
            <div ref={chartRef} style={{ width: '100%', height: '100%' }} />
          </div>

          <div style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'center' }}>
            চার্ট TradingView দ্বারা পরিচালিত • রিয়েল-টাইম DSE ডেটা নাও থাকতে পারে
          </div>
        </div>
      </div>

      {showAddStockModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowAddStockModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3 style={{ fontSize: 17, fontWeight: 800 }}>{editingStock ? '✏️ স্টক সম্পাদনা' : '➕ নতুন স্টক যোগ করুন'}</h3>
              <button className="icon-btn" onClick={() => setShowAddStockModal(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">এক্সচেঞ্জ</label>
                <div style={{ padding: '8px 12px', background: 'var(--glass)', borderRadius: 8, fontWeight: 700, fontSize: 13 }}>{exchange}</div>
              </div>
              <div className="form-group">
                <label className="form-label">স্টক কোড</label>
                <input className="form-input" placeholder="যেমন: NEWSTOCK" value={newStockCode} onChange={e => setNewStockCode(e.target.value.toUpperCase())} disabled={!!editingStock} />
              </div>
              <div className="form-group">
                <label className="form-label">কোম্পানির নাম</label>
                <input className="form-input" placeholder="যেমন: New Company Ltd" value={newStockName} onChange={e => setNewStockName(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">সেক্টর</label>
                <input className="form-input" placeholder="যেমন: Banking, Pharma..." value={newStockSector} onChange={e => setNewStockSector(e.target.value)} />
              </div>
              {editingStock && (
                <button className="btn btn-danger btn-sm btn-full" onClick={() => { deleteCustomStock(editingStock.id); setShowAddStockModal(false) }}>
                  <Trash2 size={12} /> এই স্টক মুছে ফেলুন
                </button>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowAddStockModal(false)}>বাতিল</button>
              <button className="btn btn-primary" onClick={saveCustomStock}>✅ সংরক্ষণ করুন</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
