import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { formatTaka } from '../lib/utils'
import { calcPortfolio } from '../lib/portfolio'
import { Plus, Search, Edit2, Trash2, X, Check } from 'lucide-react'
import AddTransactionModal from '../components/AddTransactionModal'

export default function Portfolio() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [filter, setFilter] = useState('')
  const [exchangeFilter, setExchangeFilter] = useState('ALL')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [editId, setEditId] = useState(null)
  const [editData, setEditData] = useState({})

  useEffect(() => {
    fetchAll()
    const channel = supabase
      .channel("portfolio-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions" }, () => { fetchAll() })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  async function fetchAll() {
    const { data } = await supabase.from('transactions').select('*').order('date', { ascending: false })
    setTransactions(data || [])
    setLoading(false)
  }

  async function deleteTransaction(id) {
    if (!confirm('এই ট্রানজেকশন মুছে ফেলবেন? (সংযুক্ত লেডজার এন্ট্রিও মুছে যাবে)')) return
    const tx = transactions.find(t => t.id === id)
    await supabase.from('transactions').delete().eq('id', id)
    // সংযুক্ত ledger entry মুছি (একই stock, date, এবং amount দিয়ে match করে)
    if (tx) {
      const ledgerType = tx.type === 'BUY' ? 'STOCK_BUY' : 'STOCK_SELL'
      await supabase.from('ledger').delete()
        .eq('type', ledgerType)
        .eq('related_stock', tx.stock_name)
        .eq('date', tx.date)
        .eq('amount', tx.total_cost)
    }
    fetchAll()
  }

  async function saveEdit(id) {
    await supabase.from('transactions').update({
      stock_name: editData.stock_name,
      quantity: Number(editData.quantity),
      price: Number(editData.price),
      date: editData.date,
      type: editData.type,
      exchange: editData.exchange,
    }).eq('id', id)
    setEditId(null)
    fetchAll()
  }

  const filtered = transactions.filter(t => {
    const matchSearch = t.stock_name.toLowerCase().includes(filter.toLowerCase())
    const matchEx = exchangeFilter === 'ALL' || t.exchange === exchangeFilter
    const matchType = typeFilter === 'ALL' || t.type === typeFilter
    return matchSearch && matchEx && matchType
  })

  // Summary per stock
  const stockSummary = {}
  transactions.forEach(t => {
    if (!stockSummary[t.stock_name]) stockSummary[t.stock_name] = { bought: 0, sold: 0, buyQty: 0, sellQty: 0, exchange: t.exchange }
    if (t.type === 'BUY') { stockSummary[t.stock_name].bought += Number(t.total_cost); stockSummary[t.stock_name].buyQty += Number(t.quantity) }
    else { stockSummary[t.stock_name].sold += Number(t.total_cost); stockSummary[t.stock_name].sellQty += Number(t.quantity) }
  })

  const totalInvested = transactions.filter(t=>t.type==='BUY').reduce((s,t)=>s+Number(t.total_cost),0)
  const totalReturned = transactions.filter(t=>t.type==='SELL').reduce((s,t)=>s+Number(t.total_cost),0)
  const { totalRealizedPL: realizedPL } = calcPortfolio(transactions)

  if (loading) return <div className="loading"><div className="spinner" /><span>লোড হচ্ছে...</span></div>

  return (
    <div className="fade-up">
      <div className="section-header" style={{ marginBottom: 20 }}>
        <div>
          <div className="section-title" style={{ fontSize: 20 }}>📊 পোর্টফোলিও</div>
          <div className="section-sub">সমস্ত ট্রানজেকশন এবং হোল্ডিং</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={14} /> নতুন ট্রানজেকশন
        </button>
      </div>

      {/* Summary Cards */}
      <div className="stat-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card blue">
          <div className="stat-label">মোট বিনিয়োগ</div>
          <div className="stat-value">{formatTaka(totalInvested)}</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">মোট বিক্রয়</div>
          <div className="stat-value">{formatTaka(totalReturned)}</div>
        </div>
        <div className={`stat-card ${realizedPL >= 0 ? 'green' : 'red'}`}>
          <div className="stat-label">Realized P&L</div>
          <div className={`stat-value ${realizedPL >= 0 ? 'profit' : 'loss'}`}>
            {realizedPL >= 0 ? '+' : '-'}{formatTaka(Math.abs(realizedPL))}
          </div>
          <div className="stat-sub">{realizedPL > 0 ? '✅ লাভে' : realizedPL === 0 ? '➡️ নিরপেক্ষ' : '❌ ক্ষতিতে'}</div>
        </div>
        <div className="stat-card yellow">
          <div className="stat-label">মোট ট্রানজেকশন</div>
          <div className="stat-value">{transactions.length}টি</div>
        </div>
      </div>

      {/* Stock Holdings Summary */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="section-title" style={{ marginBottom: 14 }}>হোল্ডিং সারসংক্ষেপ</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>স্টক</th>
                <th>এক্সচেঞ্জ</th>
                <th>মোট কেনা (শেয়ার)</th>
                <th>মোট বেচা (শেয়ার)</th>
                <th>হাতে আছে</th>
                <th>মোট বিনিয়োগ</th>
                <th>মোট আয়</th>
                <th>লাভ/ক্ষতি</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(stockSummary).map(([name, s]) => {
                const heldQty = s.buyQty - s.sellQty
                const pl = s.sold - (s.sellQty > 0 ? (s.bought / s.buyQty) * s.sellQty : 0)
                return (
                  <tr key={name}>
                    <td style={{ fontWeight: 700 }}>{name}</td>
                    <td><span className={`badge badge-${s.exchange?.toLowerCase()}`}>{s.exchange}</span></td>
                    <td>{s.buyQty}</td>
                    <td>{s.sellQty}</td>
                    <td style={{ fontWeight: 600, color: heldQty > 0 ? 'var(--accent)' : 'var(--text2)' }}>{heldQty}</td>
                    <td>{formatTaka(s.bought)}</td>
                    <td>{formatTaka(s.sold)}</td>
                    <td className={pl >= 0 ? 'profit' : 'loss'} style={{ fontWeight: 700 }}>
                      {pl >= 0 ? '+' : ''}{formatTaka(pl)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="search-box" style={{ flex: 1, minWidth: 200, marginBottom: 0 }}>
          <Search size={14} />
          <input placeholder="স্টক নাম দিয়ে খুঁজুন..." value={filter} onChange={e => setFilter(e.target.value)} />
        </div>
        {['ALL', 'DSE', 'CSE'].map(ex => (
          <button key={ex} className={`period-tab ${exchangeFilter === ex ? 'active' : ''}`} onClick={() => setExchangeFilter(ex)}>{ex}</button>
        ))}
        {['ALL', 'BUY', 'SELL'].map(tp => (
          <button key={tp} className={`period-tab ${typeFilter === tp ? 'active' : ''}`} onClick={() => setTypeFilter(tp)}
            style={{ background: typeFilter === tp ? (tp === 'BUY' ? 'var(--green)' : tp === 'SELL' ? 'var(--red)' : '') : '' }}>
            {tp === 'ALL' ? 'সব' : tp === 'BUY' ? '📈 কেনা' : '📉 বেচা'}
          </button>
        ))}
      </div>

      {/* Full Transaction Table */}
      <div className="card">
        <div className="section-header">
          <div className="section-title">সব ট্রানজেকশন ({filtered.length}টি)</div>
        </div>
        {filtered.length === 0 ? (
          <div className="empty">
            <h3>কোনো ট্রানজেকশন পাওয়া যায়নি</h3>
            <p>নতুন ট্রানজেকশন যোগ করুন বা ফিল্টার পরিবর্তন করুন।</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>তারিখ</th>
                  <th>ধরন</th>
                  <th>স্টক</th>
                  <th>এক্স.</th>
                  <th>শেয়ার</th>
                  <th>দাম (৳)</th>
                  <th>মোট (৳)</th>
                  <th>কাজ</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => (
                  <tr key={t.id}>
                    {editId === t.id ? (
                      <>
                        <td><input className="form-input" style={{ padding: '4px 8px', fontSize: 12 }} type="date" value={editData.date} onChange={e => setEditData({ ...editData, date: e.target.value })} /></td>
                        <td>
                          <select className="form-select" style={{ padding: '4px 8px', fontSize: 12 }} value={editData.type} onChange={e => setEditData({ ...editData, type: e.target.value })}>
                            <option value="BUY">BUY</option>
                            <option value="SELL">SELL</option>
                          </select>
                        </td>
                        <td><input className="form-input" style={{ padding: '4px 8px', fontSize: 12 }} value={editData.stock_name} onChange={e => setEditData({ ...editData, stock_name: e.target.value })} /></td>
                        <td>
                          <select className="form-select" style={{ padding: '4px 8px', fontSize: 12 }} value={editData.exchange} onChange={e => setEditData({ ...editData, exchange: e.target.value })}>
                            <option value="DSE">DSE</option>
                            <option value="CSE">CSE</option>
                          </select>
                        </td>
                        <td><input className="form-input" style={{ padding: '4px 8px', fontSize: 12, width: 70 }} type="number" value={editData.quantity} onChange={e => setEditData({ ...editData, quantity: e.target.value })} /></td>
                        <td><input className="form-input" style={{ padding: '4px 8px', fontSize: 12, width: 90 }} type="number" value={editData.price} onChange={e => setEditData({ ...editData, price: e.target.value })} /></td>
                        <td style={{ fontWeight: 600 }}>{formatTaka(editData.quantity * editData.price)}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn btn-primary btn-sm" onClick={() => saveEdit(t.id)}><Check size={12} /></button>
                            <button className="btn btn-ghost btn-sm" onClick={() => setEditId(null)}><X size={12} /></button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td style={{ color: 'var(--text2)', fontSize: 13 }}>{t.date}</td>
                        <td><span className={`badge badge-${t.type?.toLowerCase()}`}>{t.type === 'BUY' ? '📈 কেনা' : '📉 বেচা'}</span></td>
                        <td style={{ fontWeight: 600 }}>{t.stock_name}</td>
                        <td><span className={`badge badge-${t.exchange?.toLowerCase()}`}>{t.exchange}</span></td>
                        <td>{Number(t.quantity).toLocaleString()}</td>
                        <td>{formatTaka(t.price)}</td>
                        <td style={{ fontWeight: 700 }}>{formatTaka(t.total_cost)}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn btn-ghost btn-sm" onClick={() => { setEditId(t.id); setEditData({ ...t }) }}><Edit2 size={12} /></button>
                            <button className="btn btn-danger btn-sm" onClick={() => deleteTransaction(t.id)}><Trash2 size={12} /></button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && <AddTransactionModal onClose={() => { setShowModal(false); fetchAll() }} />}
    </div>
  )
}
