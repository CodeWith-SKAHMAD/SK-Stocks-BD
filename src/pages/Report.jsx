import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { calcPortfolio } from '../lib/portfolio'
import { formatTaka } from '../lib/utils'
import { generatePDFReport } from '../lib/generateReport'
import { Download, FileText, Calendar, TrendingUp, TrendingDown, BarChart2 } from 'lucide-react'

export default function Report() {
  const { profile } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [allTx, setAllTx] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [period, setPeriod] = useState('monthly')
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 1)
    return d.toISOString().split('T')[0]
  })
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    const { data } = await supabase.from('transactions').select('*').order('date', { ascending: true })
    setAllTx(data || [])
    setLoading(false)
  }

  useEffect(() => {
    filterTransactions()
  }, [period, dateFrom, dateTo, allTx])

  function filterTransactions() {
    const now = new Date()
    let from = new Date()

    if (period === 'weekly') from.setDate(now.getDate() - 7)
    else if (period === 'monthly') from.setMonth(now.getMonth() - 1)
    else if (period === 'yearly') from.setFullYear(now.getFullYear() - 1)
    else {
      from = new Date(dateFrom)
      const to = new Date(dateTo)
      setTransactions(allTx.filter(t => {
        const d = new Date(t.date)
        return d >= from && d <= to
      }))
      return
    }
    setTransactions(allTx.filter(t => new Date(t.date) >= from))
  }

  const { totalRealizedPL, holdings } = calcPortfolio(transactions)
  const holdingList = Object.values(holdings)
  const totalBought = transactions.filter(t => t.type === 'BUY').reduce((s, t) => s + Number(t.total_cost), 0)
  const totalSold = transactions.filter(t => t.type === 'SELL').reduce((s, t) => s + Number(t.total_cost), 0)
  const totalHolding = holdingList.reduce((s, h) => s + h.cost, 0)
  const plPct = totalBought > 0 ? ((totalRealizedPL / totalBought) * 100).toFixed(2) : '0.00'

  async function handleDownload() {
    setGenerating(true)
    try {
      generatePDFReport({
        transactions,
        profile,
        period,
        dateRange: { from: dateFrom, to: dateTo }
      })
    } catch (e) {
      console.error(e)
    }
    setTimeout(() => setGenerating(false), 1500)
  }

  if (loading) return <div className="loading"><div className="spinner" /></div>

  return (
    <div className="fade-up">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px' }}>📄 পোর্টফোলিও রিপোর্ট</h2>
          <p style={{ color: 'var(--text2)', fontSize: 13.5, marginTop: 3 }}>PDF হিসেবে ডাউনলোড করুন</p>
        </div>
        <button className="btn btn-primary" onClick={handleDownload} disabled={generating || transactions.length === 0}>
          <Download size={15} />
          {generating ? 'তৈরি হচ্ছে...' : 'PDF ডাউনলোড'}
        </button>
      </div>

      {/* Period Selector */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="section-title" style={{ marginBottom: 14 }}>📅 সময়কাল বেছে নিন</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {[
            { id: 'weekly', label: '৭ দিন' },
            { id: 'monthly', label: '১ মাস' },
            { id: 'yearly', label: '১ বছর' },
            { id: 'custom', label: '📆 নিজে বেছে নিন' },
            { id: 'all', label: 'সব সময়' },
          ].map(p => (
            <button key={p.id} className={`period-tab ${period === p.id ? 'active' : ''}`}
              onClick={() => setPeriod(p.id)}>
              {p.label}
            </button>
          ))}
        </div>

        {period === 'custom' && (
          <div className="form-row">
            <div className="form-group">
              <label className="form-label"><Calendar size={11} style={{ display: 'inline', marginRight: 4 }} />শুরুর তারিখ</label>
              <input className="form-input" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label"><Calendar size={11} style={{ display: 'inline', marginRight: 4 }} />শেষের তারিখ</label>
              <input className="form-input" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
          </div>
        )}

        {period === 'all' && (
          <div style={{ fontSize: 13, color: 'var(--text2)', padding: '8px 12px', background: 'var(--bg3)', borderRadius: 8 }}>
            📊 সব {allTx.length}টি ট্রানজেকশন দেখানো হচ্ছে
          </div>
        )}
      </div>

      {/* Preview Cards */}
      <div className="stat-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card blue">
          <div className="stat-label">মোট বিনিয়োগ</div>
          <div className="stat-value">{formatTaka(totalBought)}</div>
          <div className="stat-sub"><BarChart2 size={12} /> {transactions.filter(t => t.type === 'BUY').length}টি কেনা</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">মোট বিক্রয়</div>
          <div className="stat-value">{formatTaka(totalSold)}</div>
          <div className="stat-sub">{transactions.filter(t => t.type === 'SELL').length}টি বেচা</div>
        </div>
        <div className="stat-card yellow">
          <div className="stat-label">হোল্ডিং মূল্য</div>
          <div className="stat-value">{formatTaka(totalHolding)}</div>
          <div className="stat-sub">{holdingList.length}টি স্টক</div>
        </div>
        <div className={`stat-card ${totalRealizedPL >= 0 ? 'green' : 'red'}`}>
          <div className="stat-label">Realized P&L</div>
          <div className={`stat-value ${totalRealizedPL >= 0 ? 'profit' : 'loss'}`}>
            {totalRealizedPL >= 0 ? '+' : ''}{formatTaka(Math.abs(totalRealizedPL))}
          </div>
          <div className="stat-sub">
            {totalRealizedPL >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {plPct}%
          </div>
        </div>
      </div>

      {/* Holdings Preview */}
      {holdingList.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="section-header">
            <div className="section-title">📦 হোল্ডিং</div>
            <span style={{ fontSize: 12, color: 'var(--text3)' }}>{holdingList.length}টি স্টক</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>স্টক</th><th>শেয়ার</th><th>গড় দাম</th><th>মোট বিনিয়োগ</th></tr></thead>
              <tbody>
                {Object.entries(holdings).map(([name, h]) => (
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

      {/* Transactions Preview */}
      <div className="card">
        <div className="section-header">
          <div className="section-title">🔄 ট্রানজেকশন ({transactions.length}টি)</div>
          <span style={{ fontSize: 12, color: 'var(--text3)' }}>PDF-এ সব থাকবে</span>
        </div>
        {transactions.length === 0 ? (
          <div className="empty">
            <FileText size={36} />
            <h3>এই সময়কালে কোনো ট্রানজেকশন নেই</h3>
            <p>অন্য সময়কাল বেছে নিন</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>তারিখ</th><th>স্টক</th><th>ধরন</th><th>শেয়ার</th><th>দাম</th><th>মোট</th></tr></thead>
              <tbody>
                {[...transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10).map(t => (
                  <tr key={t.id}>
                    <td style={{ color: 'var(--text2)', fontSize: 13 }}>{t.date}</td>
                    <td style={{ fontWeight: 600 }}>{t.stock_name}</td>
                    <td><span className={`badge badge-${t.type?.toLowerCase()}`}>{t.type === 'BUY' ? '📈 কেনা' : '📉 বেচা'}</span></td>
                    <td>{t.quantity}</td>
                    <td>{formatTaka(t.price)}</td>
                    <td style={{ fontWeight: 600 }}>{formatTaka(t.total_cost)}</td>
                  </tr>
                ))}
                {transactions.length > 10 && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text3)', fontSize: 12, padding: 10 }}>আরো {transactions.length - 10}টি — PDF-এ সব দেখাবে</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Download CTA */}
      {transactions.length > 0 && (
        <div style={{ marginTop: 20, padding: '20px 24px', background: 'linear-gradient(135deg, rgba(0,229,180,0.08), rgba(59,130,246,0.08))', border: '1px solid var(--border)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>📄 {profile?.full_name || 'Portfolio'}'s Portfolio Report</div>
            <div style={{ color: 'var(--text2)', fontSize: 13, marginTop: 3 }}>{transactions.length}টি ট্রানজেকশন · {holdingList.length}টি হোল্ডিং · সুন্দর PDF ফরম্যাটে</div>
          </div>
          <button className="btn btn-primary" onClick={handleDownload} disabled={generating}>
            <Download size={15} />
            {generating ? 'তৈরি হচ্ছে...' : 'PDF ডাউনলোড করুন'}
          </button>
        </div>
      )}
    </div>
  )
}
