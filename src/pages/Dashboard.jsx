import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { getMarketStatus, formatTaka } from '../lib/utils'
import { TrendingUp, TrendingDown, DollarSign, BarChart2, Clock, Plus } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import AddTransactionModal from '../components/AddTransactionModal'

const COLORS = ['#00d4aa', '#0099ff', '#ffd166', '#ff4d6a', '#a78bfa', '#fb923c']

export default function Dashboard({ onNavigate }) {
  const { profile } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [period, setPeriod] = useState('weekly')
  const market = getMarketStatus()

  useEffect(() => { fetchTransactions() }, [])

  async function fetchTransactions() {
    const { data } = await supabase.from('transactions').select('*').order('date', { ascending: true })
    setTransactions(data || [])
    setLoading(false)
  }

  // Portfolio calculations
  const portfolioMap = {}
  transactions.forEach(t => {
    if (!portfolioMap[t.stock_name]) portfolioMap[t.stock_name] = { qty: 0, cost: 0, name: t.stock_name, exchange: t.exchange }
    if (t.type === 'BUY') {
      portfolioMap[t.stock_name].qty += Number(t.quantity)
      portfolioMap[t.stock_name].cost += Number(t.total_cost)
    } else {
      portfolioMap[t.stock_name].qty -= Number(t.quantity)
      portfolioMap[t.stock_name].cost -= Number(t.total_cost)
    }
  })

  const holdings = Object.values(portfolioMap).filter(h => h.qty > 0)
  const totalInvested = holdings.reduce((s, h) => s + h.cost, 0)
  const totalSold = transactions.filter(t => t.type === 'SELL').reduce((s, t) => s + Number(t.total_cost), 0)
  const totalBought = transactions.filter(t => t.type === 'BUY').reduce((s, t) => s + Number(t.total_cost), 0)
  const realizedPL = totalSold - transactions.filter(t => t.type === 'SELL').reduce((s, t) => {
    const h = portfolioMap[t.stock_name]
    const avgBuy = h ? h.cost / (h.qty || 1) : t.price
    return s + Number(t.quantity) * avgBuy
  }, 0)

  // Weekly/Monthly P&L from chart data
  function getPeriodPL() {
    const now = new Date()
    const cutoff = new Date()
    if (period === 'weekly') cutoff.setDate(now.getDate() - 7)
    else cutoff.setMonth(now.getMonth() - 1)

    const buys = transactions.filter(t => t.type === 'BUY' && new Date(t.date) >= cutoff)
      .reduce((s, t) => s + Number(t.total_cost), 0)
    const sells = transactions.filter(t => t.type === 'SELL' && new Date(t.date) >= cutoff)
      .reduce((s, t) => s + Number(t.total_cost), 0)
    return sells - buys
  }

  // Chart data — monthly summary
  function getChartData() {
    const map = {}
    transactions.forEach(t => {
      const month = t.date.substring(0, 7)
      if (!map[month]) map[month] = { month, buy: 0, sell: 0 }
      if (t.type === 'BUY') map[month].buy += Number(t.total_cost)
      else map[month].sell += Number(t.total_cost)
    })
    return Object.values(map).slice(-6).map(m => ({
      ...m,
      pl: m.sell - m.buy
    }))
  }

  // Pie chart — stock allocation
  const pieData = holdings.map((h, i) => ({
    name: h.name, value: h.cost, color: COLORS[i % COLORS.length]
  }))

  const periodPL = getPeriodPL()
  const chartData = getChartData()

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
      return (
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontSize: 13 }}>
          <p style={{ color: 'var(--text2)', marginBottom: 4 }}>{label}</p>
          {payload.map((p, i) => (
            <p key={i} style={{ color: p.color, fontWeight: 600 }}>{p.name}: {formatTaka(p.value)}</p>
          ))}
        </div>
      )
    }
    return null
  }

  if (loading) return <div className="loading"><div className="spinner" /><span>লোড হচ্ছে...</span></div>

  return (
    <div className="fade-up">
      {/* Market Status Banner */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>
            নমস্কার, {profile?.full_name?.split(' ')[0] || 'বিনিয়োগকারী'} 👋
          </h2>
          <p style={{ color: 'var(--text2)', fontSize: 14 }}>আপনার পোর্টফোলিও সারসংক্ষেপ</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className={`market-badge ${market.isOpen ? 'market-open' : 'market-closed'}`}>
            <div className={`dot ${market.isOpen ? 'dot-green' : 'dot-red'}`} />
            DSE {market.isOpen ? 'বাজার খোলা' : 'বাজার বন্ধ'}
          </div>
          {!market.isOpen && market.nextOpen && (
            <span style={{ fontSize: 12, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={12} /> {market.nextOpen} খুলবে
            </span>
          )}
          <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
            <Plus size={14} /> ট্রানজেকশন যোগ করুন
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
          <div className="stat-label">মোট হোল্ডিং</div>
          <div className="stat-value">{formatTaka(totalInvested)}</div>
          <div className="stat-sub">{holdings.length}টি স্টক ধরে আছেন</div>
        </div>
        <div className={`stat-card ${periodPL >= 0 ? 'green' : 'red'}`}>
          <div className="stat-label">
            <div className="period-tabs" style={{ marginBottom: 0 }}>
              <button className={`period-tab ${period === 'weekly' ? 'active' : ''}`} onClick={() => setPeriod('weekly')} style={{ padding: '2px 10px', fontSize: 11 }}>সাপ্তাহিক</button>
              <button className={`period-tab ${period === 'monthly' ? 'active' : ''}`} onClick={() => setPeriod('monthly')} style={{ padding: '2px 10px', fontSize: 11 }}>মাসিক</button>
            </div>
          </div>
          <div className={`stat-value ${periodPL >= 0 ? 'profit' : 'loss'}`}>{formatTaka(Math.abs(periodPL))}</div>
          <div className="stat-sub">
            {periodPL >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {periodPL >= 0 ? 'লাভে আছেন' : 'ক্ষতিতে আছেন'}
          </div>
        </div>
        <div className={`stat-card ${realizedPL >= 0 ? 'green' : 'red'}`}>
          <div className="stat-label">মোট লাভ/ক্ষতি (Realized)</div>
          <div className={`stat-value ${realizedPL >= 0 ? 'profit' : 'loss'}`}>{formatTaka(Math.abs(realizedPL))}</div>
          <div className="stat-sub">
            {realizedPL >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            বিক্রয় থেকে
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="section-header">
            <div>
              <div className="section-title">মাসিক পারফরম্যান্স</div>
              <div className="section-sub">গত ৬ মাস</div>
            </div>
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
          ) : (
            <div className="empty" style={{ height: 200 }}>
              <p>কোনো ডেটা নেই। ট্রানজেকশন যোগ করুন।</p>
            </div>
          )}
        </div>

        <div className="card">
          <div className="section-header">
            <div>
              <div className="section-title">স্টক বরাদ্দ</div>
              <div className="section-sub">কোন স্টকে কত টাকা</div>
            </div>
          </div>
          {pieData.length > 0 ? (
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" paddingAngle={3}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v) => formatTaka(v)} />
                  <Legend formatter={(v) => <span style={{ fontSize: 12 }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty" style={{ height: 200 }}>
              <p>কোনো হোল্ডিং নেই।</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card">
        <div className="section-header">
          <div className="section-title">সাম্প্রতিক ট্রানজেকশন</div>
          <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('portfolio')}>সব দেখুন →</button>
        </div>
        {transactions.length === 0 ? (
          <div className="empty">
            <DollarSign size={40} />
            <h3>এখনো কোনো ট্রানজেকশন নেই</h3>
            <p>উপরে "ট্রানজেকশন যোগ করুন" বাটন চাপুন</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>তারিখ</th>
                  <th>স্টক</th>
                  <th>ধরন</th>
                  <th>পরিমাণ</th>
                  <th>দাম</th>
                  <th>মোট</th>
                </tr>
              </thead>
              <tbody>
                {transactions.slice(-8).reverse().map(t => (
                  <tr key={t.id}>
                    <td style={{ color: 'var(--text2)', fontSize: 13 }}>{t.date}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{t.stock_name}</div>
                      <span className={`badge badge-${t.exchange?.toLowerCase()}`}>{t.exchange}</span>
                    </td>
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
    </div>
  )
}
