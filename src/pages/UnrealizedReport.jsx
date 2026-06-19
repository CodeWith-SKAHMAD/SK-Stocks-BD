import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { calcPortfolio } from '../lib/portfolio'
import { formatTaka } from '../lib/utils'
import { Download, TrendingUp, TrendingDown, RefreshCw, History } from 'lucide-react'
import CurrentPriceModal from '../components/CurrentPriceModal'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function UnrealizedReport() {
  const { profile } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [currentPrices, setCurrentPrices] = useState({})
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [showPriceModal, setShowPriceModal] = useState(false)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    fetchAll()
    const channel = supabase
      .channel('unrealized-report-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'current_prices' }, () => fetchPrices())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => fetchTransactions())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  async function fetchAll() {
    await fetchTransactions()
    await fetchPrices()
    await fetchHistory()
    setLoading(false)
  }

  async function fetchTransactions() {
    const { data } = await supabase.from('transactions').select('*').order('date', { ascending: true })
    setTransactions(data || [])
  }

  async function fetchPrices() {
    const { data } = await supabase.from('current_prices').select('stock_name, price, updated_at').order('updated_at', { ascending: false })
    if (data) {
      const map = {}
      data.forEach(p => { if (!map[p.stock_name]) map[p.stock_name] = p.price })
      setCurrentPrices(map)
    }
  }

  async function fetchHistory() {
    const { data } = await supabase.from('price_history').select('*').order('created_at', { ascending: false }).limit(50)
    setHistory(data || [])
  }

  function savePrices(prices) {
    setCurrentPrices(prices)
    // Log history
    logPriceHistory(prices)
  }

  async function logPriceHistory(prices) {
    const { totalRealizedPL, holdings } = calcPortfolio(transactions)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const rows = Object.entries(prices)
      .filter(([name, price]) => price && holdings[name])
      .map(([name, price]) => {
        const h = holdings[name]
        const curValue = Number(price) * h.qty
        const unrealized = curValue - h.cost
        return {
          user_id: user.id,
          stock_name: name,
          price: Number(price),
          qty_at_time: h.qty,
          avg_buy_price: h.avgPrice,
          unrealized_pl: unrealized
        }
      })
    if (rows.length > 0) {
      await supabase.from('price_history').insert(rows)
      fetchHistory()
    }
  }

  const { holdings } = calcPortfolio(transactions)
  const holdingEntries = Object.entries(holdings)

  const unrealizedData = holdingEntries.map(([name, h]) => {
    const curPrice = Number(currentPrices[name] || 0)
    const curValue = curPrice > 0 ? curPrice * h.qty : 0
    const unrealized = curValue > 0 ? curValue - h.cost : null
    const pct = unrealized !== null && h.cost > 0 ? (unrealized / h.cost * 100).toFixed(2) : null
    return { name, ...h, curPrice, curValue, unrealized, pct }
  })

  const totalUnrealized = unrealizedData.reduce((s, h) => s + (h.unrealized || 0), 0)
  const totalCost = holdingEntries.reduce((s, [, h]) => s + h.cost, 0)
  const totalCurValue = unrealizedData.reduce((s, h) => s + (h.curValue || 0), 0)
  const hasPrices = unrealizedData.some(h => h.curPrice > 0)
  const overallPct = totalCost > 0 ? ((totalUnrealized / totalCost) * 100).toFixed(2) : '0.00'

  function fmtEn(amount) {
    if (isNaN(amount) || amount === null) return 'BDT 0'
    const abs = Math.abs(amount)
    let formatted
    if (abs >= 10000000) formatted = (abs / 10000000).toFixed(2) + 'cr'
    else if (abs >= 100000) formatted = (abs / 100000).toFixed(2) + 'lac'
    else formatted = abs.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    return (amount < 0 ? '-BDT ' : 'BDT ') + formatted
  }

  function handleDownloadPDF() {
    setGenerating(true)
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const W = 210, M = 16
    const C = {
      dark: [8,12,20], dark2: [15,23,42], grey1: [30,45,71], grey2: [100,130,170],
      grey3: [180,200,230], accent: [255,122,69], blue: [99,102,241],
      green: [22,163,74], red: [226,58,78], white: [255,255,255],
      light: [245,248,255], light2: [235,242,255],
    }
    const name = profile?.full_name || 'Investor'
    const generatedDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

    doc.setFillColor(...C.dark)
    doc.rect(0, 0, W, 50, 'F')
    doc.setFillColor(...C.accent)
    doc.rect(0, 0, W, 3, 'F')
    doc.setFillColor(...C.grey1)
    doc.roundedRect(M, 12, 22, 22, 3, 3, 'F')
    doc.setTextColor(...C.accent)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('UPL', M + 11, 26, { align: 'center' })

    doc.setTextColor(...C.white)
    doc.setFontSize(16)
    doc.text(`${name}'s Unrealized P&L Report`, M + 28, 22)
    doc.setTextColor(...C.grey3)
    doc.setFontSize(8.5)
    doc.setFont('helvetica', 'normal')
    doc.text(`Generated: ${generatedDate}`, M + 28, 29)
    doc.text('Based on manually entered current market prices', M + 28, 35)

    let y = 58

    // Summary cards
    const cards = [
      { label: 'Total Invested', value: fmtEn(totalCost), color: C.blue },
      { label: 'Current Value', value: fmtEn(totalCurValue), color: C.accent },
      { label: 'Unrealized P&L', value: (totalUnrealized >= 0 ? '+' : '') + fmtEn(Math.abs(totalUnrealized)), color: totalUnrealized >= 0 ? C.green : C.red },
    ]
    const cardW = (W - M * 2 - 8) / 3
    cards.forEach((card, i) => {
      const x = M + i * (cardW + 4)
      doc.setFillColor(...C.light)
      doc.roundedRect(x, y, cardW, 28, 2, 2, 'F')
      doc.setFillColor(...card.color)
      doc.rect(x, y, cardW, 2.5, 'F')
      doc.setTextColor(...C.grey2)
      doc.setFontSize(7)
      doc.text(card.label, x + 6, y + 10)
      doc.setTextColor(...C.dark)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text(card.value, x + 6, y + 20)
    })
    y += 36

    doc.setFillColor(...C.dark2)
    doc.roundedRect(M, y, W - M * 2, 9, 2, 2, 'F')
    doc.setFillColor(...C.accent)
    doc.rect(M, y, 3, 9, 'F')
    doc.setTextColor(...C.white)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('HOLDINGS — UNREALIZED P&L DETAIL', M + 7, y + 6)
    y += 11

    autoTable(doc, {
      startY: y,
      head: [['Stock', 'Shares', 'Avg Buy', 'Current Price', 'Current Value', 'Unrealized P&L', '%']],
      body: unrealizedData.map(h => [
        h.name, h.qty.toString(), `BDT ${h.avgPrice.toFixed(2)}`,
        h.curPrice > 0 ? `BDT ${h.curPrice.toFixed(2)}` : 'N/A',
        h.curValue > 0 ? fmtEn(h.curValue) : 'N/A',
        h.unrealized !== null ? (h.unrealized >= 0 ? '+' : '') + fmtEn(h.unrealized) : 'N/A',
        h.pct !== null ? `${h.pct}%` : 'N/A'
      ]),
      margin: { left: M, right: M },
      styles: { fontSize: 8, cellPadding: 3.5, textColor: C.dark },
      headStyles: { fillColor: C.grey1, textColor: C.white, fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: C.light2 },
      columnStyles: { 5: { fontStyle: 'bold' } },
    })
    y = doc.lastAutoTable.finalY + 10

    if (y > 230) { doc.addPage(); y = 20 }
    const plClr = totalUnrealized >= 0 ? C.green : C.red
    doc.setFillColor(...C.light)
    doc.roundedRect(M, y, W - M * 2, 30, 3, 3, 'F')
    doc.setFillColor(...plClr)
    doc.rect(M, y, 4, 30, 'F')
    doc.setTextColor(...C.grey2)
    doc.setFontSize(8)
    doc.text('Total Unrealized Profit / Loss', M + 9, y + 10)
    doc.setTextColor(...plClr)
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text((totalUnrealized >= 0 ? '+' : '-') + fmtEn(Math.abs(totalUnrealized)), M + 9, y + 24)
    doc.setFontSize(11)
    doc.setTextColor(...C.grey2)
    doc.text(`Return: ${overallPct}%`, W - M - 4, y + 24, { align: 'right' })

    const pages = doc.getNumberOfPages()
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i)
      doc.setFillColor(...C.dark)
      doc.rect(0, 287, W, 10, 'F')
      doc.setTextColor(...C.grey2)
      doc.setFontSize(7)
      doc.text('BD Stock Tracker — Unrealized P&L Report', M, 293)
      doc.text(`Page ${i} of ${pages}`, W - M, 293, { align: 'right' })
    }

    doc.save(`${name.replace(/\s+/g, '_')}_Unrealized_PL_${new Date().toISOString().split('T')[0]}.pdf`)
    setGenerating(false)
  }

  if (loading) return <div className="loading"><div className="spinner" /></div>

  return (
    <div className="fade-up">
      <div className="section-header" style={{ marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px' }}>📊 Unrealized P&L Report</h2>
          <p style={{ color: 'var(--text2)', fontSize: 13.5, marginTop: 3 }}>বর্তমান বাজার দাম অনুযায়ী লাভ/ক্ষতির বিস্তারিত</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" onClick={() => setShowPriceModal(true)}>
            <RefreshCw size={14} /> দাম আপডেট
          </button>
          <button className="btn btn-primary" onClick={handleDownloadPDF} disabled={generating || !hasPrices}>
            <Download size={14} /> {generating ? 'তৈরি হচ্ছে...' : 'PDF ডাউনলোড'}
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="stat-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card blue">
          <div className="stat-label">মোট বিনিয়োগ</div>
          <div className="stat-value">{formatTaka(totalCost)}</div>
        </div>
        <div className="stat-card yellow">
          <div className="stat-label">বর্তমান মূল্য</div>
          <div className="stat-value">{hasPrices ? formatTaka(totalCurValue) : '—'}</div>
        </div>
        <div className={`stat-card ${totalUnrealized >= 0 ? 'green' : 'red'}`}>
          <div className="stat-label">Unrealized P&L</div>
          <div className={`stat-value ${totalUnrealized >= 0 ? 'profit' : 'loss'}`}>
            {hasPrices ? `${totalUnrealized >= 0 ? '+' : ''}${formatTaka(totalUnrealized)}` : '—'}
          </div>
          <div className="stat-sub">{hasPrices ? `${overallPct}%` : 'দাম দিন'}</div>
        </div>
      </div>

      {/* Detail table */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="section-title" style={{ marginBottom: 14 }}>হোল্ডিং বিস্তারিত</div>
        {unrealizedData.length === 0 ? (
          <div className="empty"><p>কোনো হোল্ডিং নেই</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>স্টক</th><th>শেয়ার</th><th>গড় দাম</th><th>বর্তমান দাম</th><th>বর্তমান মূল্য</th><th>লাভ/ক্ষতি</th><th>%</th></tr></thead>
              <tbody>
                {unrealizedData.map(h => (
                  <tr key={h.name}>
                    <td style={{ fontWeight: 700 }}>{h.name}</td>
                    <td style={{ color: 'var(--accent)', fontWeight: 600 }}>{h.qty}</td>
                    <td>{formatTaka(h.avgPrice)}</td>
                    <td>{h.curPrice > 0 ? formatTaka(h.curPrice) : <span style={{color:'var(--text3)'}}>—</span>}</td>
                    <td>{h.curValue > 0 ? formatTaka(h.curValue) : '—'}</td>
                    <td style={{ fontWeight: 700, color: h.unrealized !== null ? (h.unrealized >= 0 ? 'var(--green)' : 'var(--red)') : 'var(--text3)' }}>
                      {h.unrealized !== null ? `${h.unrealized >= 0 ? '+' : ''}${formatTaka(h.unrealized)}` : '—'}
                    </td>
                    <td style={{ fontWeight: 600, color: h.pct !== null ? (Number(h.pct) >= 0 ? 'var(--green)' : 'var(--red)') : 'var(--text3)' }}>
                      {h.pct !== null ? `${h.pct}%` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Price update history */}
      <div className="card">
        <div className="section-header">
          <div className="section-title"><History size={14} style={{display:'inline', marginRight: 6}} />দাম আপডেট ইতিহাস</div>
          <span style={{ fontSize: 11, color: 'var(--text3)' }}>সর্বশেষ {history.length}টি</span>
        </div>
        {history.length === 0 ? (
          <div className="empty"><p>এখনো কোনো দাম আপডেট নেই</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>তারিখ</th><th>স্টক</th><th>দাম</th><th>লাভ/ক্ষতি (তখন)</th></tr></thead>
              <tbody>
                {history.slice(0, 20).map(h => (
                  <tr key={h.id}>
                    <td style={{ color: 'var(--text2)', fontSize: 12 }}>
                      {new Date(h.created_at).toLocaleString('bn-BD', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ fontWeight: 600 }}>{h.stock_name}</td>
                    <td>{formatTaka(h.price)}</td>
                    <td style={{ fontWeight: 600, color: h.unrealized_pl >= 0 ? 'var(--green)' : 'var(--red)' }}>
                      {h.unrealized_pl >= 0 ? '+' : ''}{formatTaka(h.unrealized_pl)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
