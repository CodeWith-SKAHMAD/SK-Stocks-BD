import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { getMarketStatus, formatTaka } from '../lib/utils'
import { calcPortfolio } from '../lib/portfolio'
import { TrendingUp, TrendingDown, DollarSign, BarChart2, Clock, Plus, RefreshCw } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import AddTransactionModal from '../components/AddTransactionModal'
import CurrentPriceModal from '../components/CurrentPriceModal'

const COLORS = ['#00e5b4', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#fb923c']

function FearGreedMeter({ value }) {
  const clamp = Math.min(100, Math.max(0, value))
  const angle = -90 + (clamp / 100) * 180
  let label, color
  if (clamp <= 20)      { label = 'Extreme Fear'; color = '#ef4444' }
  else if (clamp <= 40) { label = 'Fear';          color = '#fb923c' }
  else if (clamp <= 60) { label = 'Neutral';       color = '#f59e0b' }
  else if (clamp <= 80) { label = 'Greed';         color = '#00e5b4' }
  else                  { label = 'Extreme Greed'; color = '#10b981' }

  const toRad = d => (d * Math.PI) / 180
  const r = 76, cx = 100, cy = 100
  const segs = [
    { s: -90, e: -54, c: '#ef4444' },
    { s: -54, e: -18, c: '#fb923c' },
    { s: -18, e:  18, c: '#f59e0b' },
    { s:  18, e:  54, c: '#00e5b4' },
    { s:  54, e:  90, c: '#10b981' },
  ]

  return (
    <div style={{ textAlign: 'center' }}>
      <svg viewBox="0 0 200 112" style={{ width: '100%', maxWidth: 200, display: 'block', margin: '0 auto' }}>
        {segs.map((seg, i) => {
          const x1 = cx + r * Math.cos(toRad(seg.s)), y1 = cy + r * Math.sin(toRad(seg.s))
          const x2 = cx + r * Math.cos(toRad(seg.e)), y2 = cy + r * Math.sin(toRad(seg.e))
          return <path key={i} d={`M${cx} ${cy} L${x1} ${y1} A${r} ${r} 0 0 1 ${x2} ${y2}Z`} fill={seg.c} opacity="0.9" />
        })}
        <circle cx={cx} cy={cy} r="50" fill="var(--card)" />
        <line x1={cx} y1={cy}
          x2={cx + 60 * Math.cos(toRad(angle))} y2={cy + 60 * Math.sin(toRad(angle))}
          stroke="var(--text)" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="5" fill="var(--text)" />
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="18" fontWeight="800" fill={color}>{clamp}</text>
        <text x={cx} y={cy + 8} textAnchor="middle" fontSize="8" fill="var(--text2)">{label}</text>
      </svg>
      <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>Portfolio Sentiment</div>
    </div>
  )
}

export default function Dashboard({ onNavigate }) {
  const { profile } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showPriceModal, setShowPriceModal] = useState(false)
  const [period, setPeriod] = useState('weekly')
  const [currentPrices, setCurrentPrices] = useState(() => {
    try { return JSON.parse(localStorage.getItem('bd_current_prices') || '{}') } catch { return {} }
  })
  const market = getMarketStatus()

  useEffect(() => {
    fetchTransactions()
    const channel = supabase
      .channel('dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => fetchTransactions())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  async function fetchTransactions() {
    const { data } = await supabase.from('transactions').select('*').order('date', { ascending: true })
    setTransactions(data || [])
    setLoading(false)
  }

  function savePrices(prices) {
    setCurrentPrices(prices)
    localStorage.setItem('bd_current_prices', JSON.stringify(prices))
  }

  const { totalRealizedPL, holdings } = calcPortfolio(transactions)
  const holdingList = Object.values(holdings)
  const holdingEntries = Object.entries(holdings)
  const totalInvested = holdingList.reduce((s, h) => s + h.cost, 0)
  const totalBought = transactions.filter(t => t.type === 'BUY').reduce((s, t) => s + Number(t.total_cost), 0)

  // Unrealized P&L হিসাব
  const unrealizedData = holdingEntries.map(([name, h]) => {
    const curPrice = Number(currentPrices[name] || 0)
    const curValue = curPrice > 0 ? curPrice * h.qty : 0
    const unrealized = curValue > 0 ? curValue - h.cost : null
    const pct = unrealized !== null && h.cost > 0 ? (unrealized / h.cost * 100).toFixed(2) : null
    return { name, ...h, curPrice, curValue, unrealized, pct }
  })
  const totalUnrealized = unrealizedData.reduce((s, h) => s + (h.unrealized || 0), 0)
  const hasPrices = unrealizedData.some(h => h.curPrice > 0)

  function getPeriodPL() {
    const now = new Date(); const cutoff = new Date()
    if (period === 'weekly') cutoff.setDate(now.getDate() - 7)
    else cutoff.setMonth(now.getMonth() - 1)
    const { totalRealizedPL: pl } = calcPortfolio(transactions.filter(t => new Date(t.date) >= cutoff))
    return pl
  }

  function getChartData() {
    const map = {}
    transactions.forEach(t => {
      const month = t.date.substring(0, 7)
      if (!map[month]) map[month] = { month, buy: 0, sell: 0 }
      if (t.type === 'BUY') map[month].buy += Number(t.total_cost)
      else map[month].sell += Number(t.total_cost)
    })
    return Object.values(map).slice(-6)
  }

  // Fear & Greed: realized + unrealized মিলিয়ে
  function calcFearGreed() {
    if (totalBought === 0) return 50
    const totalPL = totalRealizedPL + totalUnrealized
    const ratio = (totalPL / totalBought) * 100
    return Math.min(100, Math.max(0, Math.round(50 + ratio * 3)))
  }

  const periodPL = getPeriodPL()
  const chartData = getChartData()
  const firstName = profile?.full_name?.split(' ')[0] || 'বিনিয়োগকারী'

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) return (
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontSize: 13 }}>
        <p style={{ color: 'var(--text2)', marginBottom: 4 }}>{label}</p>
        {payload.map((p, i) => <p key={i} style={{ color: p.color, fontWeight: 600 }}>{p.name}: {formatTaka(p.value)}</p>)}
      </div>
    )
    return null
  }

  if (loading) return <div className="loading"><div className="spinner" /><span>লোড হচ্ছে...</span></div>

  return (
    <div className="fade-up">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px' }}>{firstName}'s Portfolio</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5, flexWrap: 'wrap' }}>
            <div className={`market-badge ${market.isOpen ? 'market-open' : 'market-closed'}`}>
              <div className={`dot ${market.isOpen ? 'dot-green' : 'dot-red'}`} />
              DSE {market.isOpen ? 'বাজার খোলা' : 'বাজার বন্ধ'}
            </div>
            {!market.isOpen && market.nextOpen && (
              <span style={{ fontSize: 12, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={12} /> {market.nextOpen} খুলবে
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {holdingList.length > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={() => setShowPriceModal(true)}>
              <RefreshCw size={13} /> দাম আপডেট
            </button>
          )}
          <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
            <Plus size={14} /> ট্রানজেকশন যোগ
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stat-grid">
        <div className="stat-card blue">
          <div className="stat-label">মোট বিনিয়োগ</div>
          <div className="stat-value">{formatTaka(totalBought)}</div>
          <div className="stat-sub"><BarChart2 size={12} /> {transactions.filter(t => t.type === 'BUY').length}টি কেনা</div>
        </div>
        <div className="stat-card yellow">
          <div className="stat-label">সক্রিয় হোল্ডিং</div>
          <div className="stat-value">{formatTaka(totalInvested)}</div>
          <div className="stat-sub">{holdingList.length}টি স্টক হাতে</div>
        </div>
        <div className={`stat-card ${periodPL >= 0 ? 'green' : 'red'}`}>
          <div className="stat-label">
            <div style={{ display: 'flex', gap: 5, marginBottom: 4 }}>
              <button className={`period-tab ${period === 'weekly' ? 'active' : ''}`} onClick={() => setPeriod('weekly')} style={{ padding: '2px 8px', fontSize: 10 }}>সাপ্তাহিক</button>
              <button className={`period-tab ${period === 'monthly' ? 'active' : ''}`} onClick={() => setPeriod('monthly')} style={{ padding: '2px 8px', fontSize: 10 }}>মাসিক</button>
            </div>
          </div>
          <div className={`stat-value ${periodPL >= 0 ? 'profit' : 'loss'}`}>{formatTaka(Math.abs(periodPL))}</div>
          <div className="stat-sub">{periodPL >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}{periodPL >= 0 ? '✅ লাভ' : '❌ ক্ষতি'}</div>
        </div>
        <div className={`stat-card ${totalRealizedPL >= 0 ? 'green' : 'red'}`}>
          <div className="stat-label">Realized P&L</div>
          <div className={`stat-value ${totalRealizedPL >= 0 ? 'profit' : 'loss'}`}>
            {totalRealizedPL >= 0 ? '+' : '-'}{formatTaka(Math.abs(totalRealizedPL))}
          </div>
          <div className="stat-sub">{totalRealizedPL >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}বিক্রয় থেকে</div>
        </div>
      </div>

      {/* Unrealized P&L Section */}
      {holdingList.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <div className="section-title">📊 Unrealized P&L</div>
              <div className="section-sub">বর্তমান বাজার দাম অনুযায়ী লাভ/ক্ষতি</div>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              {hasPrices && (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: 'var(--text2)' }}>মোট Unrealized</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: totalUnrealized >= 0 ? 'var(--green)' : 'var(--red)' }}>
                    {totalUnrealized >= 0 ? '+' : ''}{formatTaka(totalUnrealized)}
                  </div>
                </div>
              )}
              <button className="btn btn-ghost btn-sm" onClick={() => setShowPriceModal(true)}>
                <RefreshCw size={12} /> দাম দিন
              </button>
            </div>
          </div>

          {!hasPrices ? (
            <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text3)', fontSize: 13 }}>
              💡 "দাম দিন" বাটন চাপুন → DSE থেকে বর্তমান দাম দিন → Unrealized P&L দেখাবে
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>স্টক</th>
                    <th>শেয়ার</th>
                    <th>গড় কেনা</th>
                    <th>বর্তমান দাম</th>
                    <th>বর্তমান মূল্য</th>
                    <th>লাভ/ক্ষতি</th>
                    <th>%</th>
                  </tr>
                </thead>
                <tbody>
                  {unrealizedData.map(h => (
                    <tr key={h.name}>
                      <td style={{ fontWeight: 700 }}>{h.name}</td>
                      <td style={{ color: 'var(--accent)', fontWeight: 600 }}>{h.qty}</td>
                      <td>{formatTaka(h.avgPrice)}</td>
                      <td style={{ fontWeight: 600 }}>
                        {h.curPrice > 0 ? formatTaka(h.curPrice) : <span style={{ color: 'var(--text3)', fontSize: 12 }}>দাম দিন</span>}
                      </td>
                      <td>{h.curValue > 0 ? formatTaka(h.curValue) : '—'}</td>
                      <td style={{ fontWeight: 700, color: h.unrealized !== null ? (h.unrealized >= 0 ? 'var(--green)' : 'var(--red)') : 'var(--text3)' }}>
                        {h.unrealized !== null ? `${h.unrealized >= 0 ? '+' : ''}${formatTaka(h.unrealized)}` : '—'}
                      </td>
                      <td style={{ fontWeight: 600, color: h.pct !== null ? (Number(h.pct) >= 0 ? 'var(--green)' : 'var(--red)') : 'var(--text3)' }}>
                        {h.pct !== null ? `${Number(h.pct) >= 0 ? '+' : ''}${h.pct}%` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Charts */}
      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="section-header">
            <div><div className="section-title">মাসিক পারফরম্যান্স</div><div className="section-sub">গত ৬ মাস</div></div>
          </div>
          {chartData.length > 0 ? (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="month" tick={{ fill: 'var(--text3)', fontSize: 11 }} />
                  <YAxis tick={{ fill: 'var(--text3)', fontSize: 11 }} tickFormatter={v => '৳' + (v/1000).toFixed(0) + 'k'} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="buy" stroke="var(--accent2)" strokeWidth={2} dot={false} name="কেনা" />
                  <Line type="monotone" dataKey="sell" stroke="var(--green)" strokeWidth={2} dot={false} name="বেচা" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : <div className="empty" style={{ height: 200 }}><p>ট্রানজেকশন যোগ করুন</p></div>}
        </div>

        <div className="card">
          <div className="section-header">
            <div><div className="section-title">পোর্টফোলিও মিটার</div><div className="section-sub">Fear & Greed Index</div></div>
          </div>
          <FearGreedMeter value={calcFearGreed()} />
          {holdingList.length > 0 && (
            <div style={{ height: 140, marginTop: 6 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={holdingEntries.map(([name, h], i) => ({ name, value: h.cost, color: COLORS[i % COLORS.length] }))}
                    cx="50%" cy="50%" innerRadius={32} outerRadius={60}
                    dataKey="value" paddingAngle={3}
                  >
                    {holdingEntries.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={v => formatTaka(v)} />
                  <Legend formatter={v => <span style={{ fontSize: 10 }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Holdings Table */}
      {holdingList.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="section-title" style={{ marginBottom: 14 }}>📦 বর্তমান হোল্ডিং</div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>স্টক</th><th>শেয়ার</th><th>গড় ক্রয়মূল্য</th><th>মোট বিনিয়োগ</th></tr></thead>
              <tbody>
                {holdingEntries.map(([name, h]) => (
                  <tr key={name}>
                    <td style={{ fontWeight: 700 }}>{name}</td>
                    <td style={{ color: 'var(--accent)', fontWeight: 600 }}>{h.qty}</td>
                    <td>{formatTaka(h.avgPrice)}</td>
                    <td style={{ fontWeight: 600 }}>{formatTaka(h.cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="card">
        <div className="section-header">
          <div className="section-title">সাম্প্রতিক ট্রানজেকশন</div>
          <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('portfolio')}>সব দেখুন →</button>
        </div>
        {transactions.length === 0 ? (
          <div className="empty"><DollarSign size={36} /><h3>কোনো ট্রানজেকশন নেই</h3><p>"ট্রানজেকশন যোগ করুন" চাপুন</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>তারিখ</th><th>স্টক</th><th>ধরন</th><th>শেয়ার</th><th>দাম</th><th>মোট</th></tr></thead>
              <tbody>
                {transactions.slice(-8).reverse().map(t => (
                  <tr key={t.id}>
                    <td style={{ color: 'var(--text2)', fontSize: 13 }}>{t.date}</td>
                    <td><div style={{ fontWeight: 600 }}>{t.stock_name}</div><span className={`badge badge-${t.exchange?.toLowerCase()}`}>{t.exchange}</span></td>
                    <td><span className={`badge badge-${t.type?.toLowerCase()}`}>{t.type === 'BUY' ? '📈 কেনা' : '📉 বেচা'}</span></td>
                    <td>{t.quantity}</td>
                    <td>{formatTaka(t.price)}</td>
                    <td style={{ fontWeight: 600 }}>{formatTaka(t.total_cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && <AddTransactionModal onClose={() => { setShowModal(false); fetchTransactions() }} />}
      {showPriceModal && (
        <CurrentPriceModal
          holdings={holdings}
          prices={currentPrices}
          onSave={savePrices}
          onClose={() => setShowPriceModal(false)}
        />
      )}
    </div>
  )
}
