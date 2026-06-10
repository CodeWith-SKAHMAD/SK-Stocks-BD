import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { calcPortfolio } from './portfolio'
import { formatTaka } from './utils'

export function generatePDFReport({ transactions, profile, dateRange, period }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210; const margin = 18

  // ── রঙ প্যালেট ──
  const dark   = [8, 12, 20]
  const accent = [0, 229, 180]
  const blue   = [59, 130, 246]
  const green  = [16, 185, 129]
  const red    = [239, 68, 68]
  const grey1  = [30, 45, 71]
  const grey2  = [120, 143, 187]
  const white  = [255, 255, 255]
  const light  = [240, 245, 255]

  // ── হেডার ব্যাকগ্রাউন্ড ──
  doc.setFillColor(...dark)
  doc.rect(0, 0, W, 52, 'F')

  // Accent bar
  doc.setFillColor(...accent)
  doc.rect(0, 0, W, 4, 'F')

  // Logo circle
  doc.setFillColor(...grey1)
  doc.circle(margin + 10, 28, 10, 'F')
  doc.setTextColor(...accent)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('BS', margin + 10, 32, { align: 'center' })

  // Title
  const name = profile?.full_name || 'Portfolio'
  doc.setTextColor(...white)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text(`${name}'s Portfolio Report`, margin + 24, 24)

  doc.setTextColor(...grey2)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  const periodLabel = period === 'custom'
    ? `${dateRange.from} — ${dateRange.to}`
    : period === 'weekly' ? 'সাপ্তাহিক রিপোর্ট'
    : period === 'monthly' ? 'মাসিক রিপোর্ট'
    : 'বার্ষিক রিপোর্ট'
  doc.text(`Period: ${periodLabel}`, margin + 24, 32)
  doc.text(`Generated: ${new Date().toLocaleDateString('en-BD', { day: 'numeric', month: 'long', year: 'numeric' })}`, margin + 24, 38)

  // Right: Date range badge
  doc.setFillColor(...grey1)
  doc.roundedRect(W - margin - 50, 16, 50, 22, 3, 3, 'F')
  doc.setTextColor(...accent)
  doc.setFontSize(8)
  doc.text('REPORT PERIOD', W - margin - 25, 24, { align: 'center' })
  doc.setTextColor(...white)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text(periodLabel.length > 16 ? periodLabel.substring(0, 16) + '...' : periodLabel, W - margin - 25, 32, { align: 'center' })

  let y = 62

  // ── Summary Cards ──
  const { totalRealizedPL, holdings } = calcPortfolio(transactions)
  const totalBought = transactions.filter(t => t.type === 'BUY').reduce((s, t) => s + Number(t.total_cost), 0)
  const totalSold = transactions.filter(t => t.type === 'SELL').reduce((s, t) => s + Number(t.total_cost), 0)
  const holdingList = Object.values(holdings)
  const totalHolding = holdingList.reduce((s, h) => s + h.cost, 0)

  const cards = [
    { label: 'মোট বিনিয়োগ', value: formatTaka(totalBought), color: blue, icon: '↑' },
    { label: 'মোট বিক্রয়', value: formatTaka(totalSold), color: green, icon: '↓' },
    { label: 'সক্রিয় হোল্ডিং', value: formatTaka(totalHolding), color: [245, 158, 11], icon: '◎' },
    { label: 'Realized P&L', value: (totalRealizedPL >= 0 ? '+' : '') + formatTaka(Math.abs(totalRealizedPL)), color: totalRealizedPL >= 0 ? green : red, icon: totalRealizedPL >= 0 ? '▲' : '▼' },
  ]

  const cardW = (W - margin * 2 - 12) / 4
  cards.forEach((card, i) => {
    const x = margin + i * (cardW + 4)
    doc.setFillColor(...light)
    doc.roundedRect(x, y, cardW, 28, 3, 3, 'F')
    doc.setFillColor(...card.color)
    doc.rect(x, y, 3, 28, 'F')
    doc.setTextColor(...grey2)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text(card.label, x + 6, y + 9)
    doc.setTextColor(...dark)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text(card.value, x + 6, y + 20, { maxWidth: cardW - 8 })
  })

  y += 36

  // ── Holdings Table ──
  if (holdingList.length > 0) {
    doc.setFillColor(...dark)
    doc.rect(margin, y, W - margin * 2, 8, 'F')
    doc.setTextColor(...accent)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('বর্তমান হোল্ডিং', margin + 4, y + 5.5)
    y += 10

    const holdingRows = Object.entries(holdings).map(([name, h]) => [
      name,
      h.qty.toString(),
      `৳${h.avgPrice.toFixed(2)}`,
      formatTaka(h.cost),
    ])

    autoTable(doc, {
      startY: y,
      head: [['স্টক', 'শেয়ার', 'গড় ক্রয়মূল্য', 'মোট বিনিয়োগ']],
      body: holdingRows,
      margin: { left: margin, right: margin },
      styles: { fontSize: 9, cellPadding: 4, textColor: dark },
      headStyles: { fillColor: grey1, textColor: white, fontStyle: 'bold', fontSize: 9 },
      alternateRowStyles: { fillColor: light },
      columnStyles: { 3: { fontStyle: 'bold' } },
    })
    y = doc.lastAutoTable.finalY + 8
  }

  // ── Transactions Table ──
  if (transactions.length > 0) {
    if (y > 220) { doc.addPage(); y = 20 }

    doc.setFillColor(...dark)
    doc.rect(margin, y, W - margin * 2, 8, 'F')
    doc.setTextColor(...accent)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('ট্রানজেকশন বিবরণ', margin + 4, y + 5.5)
    y += 10

    const txRows = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).map(t => [
      t.date,
      t.stock_name,
      t.exchange,
      t.type === 'BUY' ? 'কেনা' : 'বেচা',
      t.quantity.toString(),
      `৳${Number(t.price).toFixed(2)}`,
      formatTaka(t.total_cost),
    ])

    autoTable(doc, {
      startY: y,
      head: [['তারিখ', 'স্টক', 'Exchange', 'ধরন', 'শেয়ার', 'দাম', 'মোট']],
      body: txRows,
      margin: { left: margin, right: margin },
      styles: { fontSize: 8, cellPadding: 3, textColor: dark },
      headStyles: { fillColor: grey1, textColor: white, fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: light },
      columnStyles: {
        3: {
          fontStyle: 'bold',
          textColor: (data) => data.cell.raw === 'কেনা' ? green : red
        },
        6: { fontStyle: 'bold' }
      },
      didDrawCell: (data) => {
        if (data.section === 'body' && data.column.index === 3) {
          const isBuy = data.cell.raw === 'কেনা'
          doc.setTextColor(...(isBuy ? green : red))
        }
      }
    })
    y = doc.lastAutoTable.finalY + 8
  }

  // ── P&L Summary ──
  if (y > 230) { doc.addPage(); y = 20 }

  doc.setFillColor(...dark)
  doc.rect(margin, y, W - margin * 2, 8, 'F')
  doc.setTextColor(...accent)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('লাভ / ক্ষতি সারসংক্ষেপ', margin + 4, y + 5.5)
  y += 10

  const plColor = totalRealizedPL >= 0 ? green : red
  doc.setFillColor(...light)
  doc.roundedRect(margin, y, W - margin * 2, 32, 4, 4, 'F')
  doc.setFillColor(...plColor)
  doc.rect(margin, y, 4, 32, 'F')

  doc.setTextColor(...grey2)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('Realized Profit / Loss', margin + 10, y + 10)
  doc.setTextColor(...plColor)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text((totalRealizedPL >= 0 ? '+' : '') + formatTaka(Math.abs(totalRealizedPL)), margin + 10, y + 24)

  const pct = totalBought > 0 ? ((totalRealizedPL / totalBought) * 100).toFixed(2) : '0.00'
  doc.setFontSize(12)
  doc.setTextColor(...grey2)
  doc.text(`(${pct}%)`, W - margin - 10, y + 24, { align: 'right' })

  // ── Footer ──
  const pages = doc.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.setFillColor(...dark)
    doc.rect(0, 285, W, 12, 'F')
    doc.setFillColor(...accent)
    doc.rect(0, 285, W, 1, 'F')
    doc.setTextColor(...grey2)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text('BD Stock Tracker — Personal Portfolio Report', margin, 291)
    doc.text(`Page ${i} of ${pages}`, W - margin, 291, { align: 'right' })
  }

  // ── Save ──
  const filename = `${(profile?.full_name || 'Portfolio').replace(/\s+/g, '_')}_Report_${new Date().toISOString().split('T')[0]}.pdf`
  doc.save(filename)
}
