import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { DSE_STOCKS, CSE_STOCKS } from '../lib/utils'
import { Star, StarOff, Search, ExternalLink } from 'lucide-react'

export default function StockMarket() {
  const [exchange, setExchange] = useState('DSE')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(DSE_STOCKS[0])
  const [watchlist, setWatchlist] = useState([])
  const [view, setView] = useState('all') // 'all' or 'watchlist'
  const chartRef = useRef(null)
  const widgetRef = useRef(null)

  const stocks = exchange === 'DSE' ? DSE_STOCKS : CSE_STOCKS
  const filtered = stocks.filter(s =>
    s.code.toLowerCase().includes(search.toLowerCase()) ||
    s.name.toLowerCase().includes(search.toLowerCase())
  )
  const displayList = view === 'watchlist' ? filtered.filter(s => watchlist.includes(s.code)) : filtered

  useEffect(() => { fetchWatchlist() }, [])

  useEffect(() => {
    loadChart()
  }, [selected, exchange])

  async function fetchWatchlist() {
    const { data } = await supabase.from('watchlist').select('stock_name')
    setWatchlist((data || []).map(w => w.stock_name))
  }

  async function toggleWatchlist(code) {
    if (watchlist.includes(code)) {
      await supabase.from('watchlist').delete().eq('stock_name', code)
      setWatchlist(prev => prev.filter(w => w !== code))
    } else {
      await supabase.from('watchlist').insert({ stock_name: code, exchange })
      setWatchlist(prev => [...prev, code])
    }
  }

  function loadChart() {
    if (!chartRef.current) return
    chartRef.current.innerHTML = ''

    // TradingView symbol format
    const symbolMap = {
      GRAMEENPHONE: 'DSE:GP',
      SQURPHARMA: 'DSE:SQURPHARMA',
      BERGERPBL: 'DSE:BERGERPBL',
      BATBC: 'DSE:BATBC',
      BRACBANK: 'DSE:BRACBANK',
      DUTCHBANGL: 'DSE:DUTCHBANGL',
      BXPHARMA: 'DSE:BXPHARMA',
      RENATA: 'DSE:RENATA',
    }
    const symbol = symbolMap[selected.code] || `DSE:${selected.code}`

    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'
    script.async = true
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol,
      interval: 'D',
      timezone: 'Asia/Dhaka',
      theme: document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark',
      style: '1',
      locale: 'en',
      toolbar_bg: '#0a0e1a',
      enable_publishing: false,
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: false,
      container_id: 'tv_chart_container',
    })

    const container = document.createElement('div')
    container.className = 'tradingview-widget-container'
    container.style.height = '100%'
    container.style.width = '100%'

    const widgetDiv = document.createElement('div')
    widgetDiv.id = 'tv_chart_container'
    widgetDiv.style.height = '100%'
    widgetDiv.style.width = '100%'

    container.appendChild(widgetDiv)
    container.appendChild(script)
    chartRef.current.appendChild(container)
  }

  return (
    <div className="fade-up" style={{ height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 16, flex: 1, minHeight: 0 }}>
        {/* Left: Stock List */}
        <div style={{ width: 280, display: 'flex', flexDirection: 'column', gap: 12, flexShrink: 0 }}>
          {/* Exchange tabs */}
          <div className="tabs" style={{ marginBottom: 0 }}>
            <button className={`tab ${exchange === 'DSE' ? 'active' : ''}`} onClick={() => setExchange('DSE')}>DSE</button>
            <button className={`tab ${exchange === 'CSE' ? 'active' : ''}`} onClick={() => setExchange('CSE')}>CSE</button>
          </div>

          {/* View toggle */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className={`period-tab ${view === 'all' ? 'active' : ''}`} onClick={() => setView('all')} style={{ flex: 1, textAlign: 'center' }}>সব</button>
            <button className={`period-tab ${view === 'watchlist' ? 'active' : ''}`} onClick={() => setView('watchlist')} style={{ flex: 1, textAlign: 'center' }}>⭐ Watchlist</button>
          </div>

          {/* Search */}
          <div className="search-box" style={{ marginBottom: 0 }}>
            <Search size={14} />
            <input placeholder="স্টক খুঁজুন..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          {/* Stock list */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {displayList.length === 0 ? (
              <div className="empty" style={{ padding: 24 }}>
                <p>{view === 'watchlist' ? 'Watchlist খালি। স্টকে ⭐ চাপুন।' : 'কোনো স্টক পাওয়া যায়নি।'}</p>
              </div>
            ) : displayList.map(s => (
              <div
                key={s.code}
                className="stock-row"
                style={{ borderColor: selected?.code === s.code ? 'var(--accent)' : '', background: selected?.code === s.code ? 'var(--card2)' : '' }}
                onClick={() => setSelected(s)}
              >
                <div>
                  <div className="stock-name">{s.code}</div>
                  <div className="stock-code">{s.name} · {s.sector}</div>
                </div>
                <button
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: watchlist.includes(s.code) ? 'var(--yellow)' : 'var(--text3)' }}
                  onClick={e => { e.stopPropagation(); toggleWatchlist(s.code) }}
                >
                  {watchlist.includes(s.code) ? <Star size={14} fill="currentColor" /> : <StarOff size={14} />}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Chart */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
          {selected && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800 }}>{selected.code}</h3>
                <p style={{ color: 'var(--text2)', fontSize: 13 }}>{selected.name} · {selected.sector}</p>
              </div>
              <a
                href={`https://www.dsebd.org/displayCompany.php?name=${selected.code}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-ghost btn-sm"
              >
                <ExternalLink size={12} /> DSE তে দেখুন
              </a>
            </div>
          )}
          <div className="card tv-chart" style={{ flex: 1, padding: 0, overflow: 'hidden' }}>
            <div ref={chartRef} style={{ width: '100%', height: '100%', minHeight: 400 }} />
          </div>
          <div style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'center' }}>
            চার্ট TradingView দ্বারা পরিচালিত • রিয়েল-টাইম DSE ডেটা নাও থাকতে পারে
          </div>
        </div>
      </div>
    </div>
  )
}
