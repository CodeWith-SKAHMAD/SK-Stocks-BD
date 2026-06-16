import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { calcPortfolio } from './portfolio'

function fmt(amount) {
  if (isNaN(amount) || amount === null) return 'BDT 0'
  const abs = Math.abs(amount)
  let formatted
  if (abs >= 10000000) formatted = (abs / 10000000).toFixed(2) + 'cr'
  else if (abs >= 100000) formatted = (abs / 100000).toFixed(2) + 'lac'
  else formatted = abs.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return (amount < 0 ? '-BDT ' : 'BDT ') + formatted
}

export function generatePDFReport({ transactions, profile, dateRange, period }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210
  const M = 16

  // Colors
  const C = {
    dark:    [8,   12,  20],
    dark2:   [15,  23,  42],
    grey1:   [30,  45,  71],
    grey2:   [100, 130, 170],
    grey3:   [180, 200, 230],
    accent:  [0,   200, 160],
    blue:    [59,  130, 246],
    green:   [16,  185, 129],
    red:     [239, 68,  68],
    yellow:  [245, 158, 11],
    white:   [255, 255, 255],
    light:   [245, 248, 255],
    light2:  [235, 242, 255],
  }

  const { totalRealizedPL, holdings } = calcPortfolio(transactions)
  const holdingList = Object.entries(holdings)
  const totalBought  = transactions.filter(t => t.type === 'BUY').reduce((s,t)  => s + Number(t.total_cost), 0)
  const totalSold    = transactions.filter(t => t.type === 'SELL').reduce((s,t) => s + Number(t.total_cost), 0)
  const totalHolding = holdingList.reduce((s,[,h]) => s + h.cost, 0)
  const plPct        = totalBought > 0 ? ((totalRealizedPL / totalBought) * 100).toFixed(2) : '0.00'
  const name         = profile?.full_name || 'Investor'

  const periodLabel = period === 'weekly' ? 'Weekly Report'
    : period === 'monthly' ? 'Monthly Report'
    : period === 'yearly'  ? 'Yearly Report'
    : period === 'all'     ? 'All-Time Report'
    : `${dateRange?.from || ''} to ${dateRange?.to || ''}`

  const generatedDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric'
  })

  // ════════════════════════════════
  // HEADER BACKGROUND
  // ════════════════════════════════
  doc.setFillColor(...C.dark)
  doc.rect(0, 0, W, 58, 'F')

  // Top accent line
  doc.setFillColor(...C.accent)
  doc.rect(0, 0, W, 3, 'F')

  // Left accent bar
  doc.setFillColor(...C.accent)
  doc.rect(M, 12, 3, 36, 'F')

  // Logo box
  doc.setFillColor(...C.grey1)
  doc.roundedRect(M + 8, 13, 22, 22, 3, 3, 'F')
  doc.setTextColor(...C.accent)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text('BD', M + 19, 27, { align: 'center' })

  // Name & title
  doc.setTextColor(...C.white)
  doc.setFontSize(17)
  doc.setFont('helvetica', 'bold')
  doc.text(`${name}'s Portfolio Report`, M + 34, 22)

  doc.setTextColor(...C.grey3)
  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'normal')
  doc.text(`Period: ${periodLabel}`, M + 34, 29)
  doc.text(`Generated: ${generatedDate}`, M + 34, 35)
  doc.text(`BD Stock Tracker — Personal Investment Report`, M + 34, 41)

  // Right badge
  doc.setFillColor(...C.grey1)
  doc.roundedRect(W - M - 44, 13, 44, 22, 3, 3, 'F')
  doc.setTextColor(...C.accent)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.text('REPORT PERIOD', W - M - 22, 20, { align: 'center' })
  doc.setTextColor(...C.white)
  doc.setFontSize(8)
  doc.text(periodLabel.length > 18 ? periodLabel.slice(0,17) + '…' : periodLabel, W - M - 22, 28, { align: 'center' })
  doc.text(generatedDate, W - M - 22, 34, { align: 'center' })

  let y = 66

  // ════════════════════════════════
  // SUMMARY CARDS (4 cards)
  // ════════════════════════════════
  const cardW = (W - M * 2 - 9) / 4
  const cards = [
    { label: 'Total Invested',  value: fmt(totalBought),  sub: `${transactions.filter(t=>t.type==='BUY').length} buys`,   color: C.blue,   icon: 'BUY'  },
    { label: 'Total Sold',      value: fmt(totalSold),    sub: `${transactions.filter(t=>t.type==='SELL').length} sells`,  color: C.green,  icon: 'SELL' },
    { label: 'Active Holdings', value: fmt(totalHolding), sub: `${holdingList.length} stocks`,                            color: C.yellow, icon: 'HOL'  },
    { label: 'Realized P&L',    value: (totalRealizedPL >= 0 ? '+' : '') + fmt(Math.abs(totalRealizedPL)), sub: `${plPct}%`, color: totalRealizedPL >= 0 ? C.green : C.red, icon: 'PNL' },
  ]

  cards.forEach((card, i) => {
    const x = M + i * (cardW + 3)
    // Card bg
    doc.setFillColor(...C.light)
    doc.roundedRect(x, y, cardW, 30, 2, 2, 'F')
    // Top color bar
    doc.setFillColor(...card.color)
    doc.rect(x, y, cardW, 2.5, 'F')
    // Left accent
    doc.setFillColor(...card.color)
    doc.rect(x, y + 2.5, 2.5, 27.5, 'F')
    // Label
    doc.setTextColor(...C.grey2)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text(card.label, x + 6, y + 10)
    // Value
    doc.setTextColor(...C.dark)
    doc.setFontSize(9.5)
    doc.setFont('helvetica', 'bold')
    doc.text(card.value, x + 6, y + 19, { maxWidth: cardW - 8 })
    // Sub
    doc.setTextColor(...card.color)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text(card.sub, x + 6, y + 26)
  })

  y += 38

  // ════════════════════════════════
  // HOLDINGS TABLE
  // ════════════════════════════════
  if (holdingList.length > 0) {
    // Section header
    doc.setFillColor(...C.dark2)
    doc.roundedRect(M, y, W - M * 2, 9, 2, 2, 'F')
    doc.setFillColor(...C.accent)
    doc.rect(M, y, 3, 9, 'F')
    doc.setTextColor(...C.white)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('CURRENT HOLDINGS', M + 7, y + 6)
    doc.setTextColor(...C.grey2)
    doc.setFontSize(7)
    doc.text(`${holdingList.length} active position(s)`, W - M - 2, y + 6, { align: 'right' })
    y += 11

    autoTable(doc, {
      startY: y,
      head: [['Stock', 'Shares', 'Avg Buy Price', 'Total Invested']],
      body: holdingList.map(([name, h]) => [
        name,
        h.qty.toString(),
        `BDT ${h.avgPrice.toFixed(2)}`,
        fmt(h.cost),
      ]),
      margin: { left: M, right: M },
      styles: { fontSize: 9, cellPadding: 4, textColor: C.dark, font: 'helvetica' },
      headStyles: { fillColor: C.grey1, textColor: C.white, fontStyle: 'bold', fontSize: 8.5 },
      alternateRowStyles: { fillColor: C.light2 },
      columnStyles: {
        0: { fontStyle: 'bold' },
        1: { halign: 'center', textColor: C.blue },
        2: { halign: 'right' },
        3: { halign: 'right', fontStyle: 'bold' },
      },
    })
    y = doc.lastAutoTable.finalY + 10
  }

  // ════════════════════════════════
  // TRANSACTIONS TABLE
  // ════════════════════════════════
  if (transactions.length > 0) {
    if (y > 210) { doc.addPage(); y = 20 }

    doc.setFillColor(...C.dark2)
    doc.roundedRect(M, y, W - M * 2, 9, 2, 2, 'F')
    doc.setFillColor(...C.blue)
    doc.rect(M, y, 3, 9, 'F')
    doc.setTextColor(...C.white)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('TRANSACTION HISTORY', M + 7, y + 6)
    doc.setTextColor(...C.grey2)
    doc.setFontSize(7)
    doc.text(`${transactions.length} transaction(s)`, W - M - 2, y + 6, { align: 'right' })
    y += 11

    const sorted = [...transactions].sort((a,b) => new Date(b.date) - new Date(a.date))

    autoTable(doc, {
      startY: y,
      head: [['Date', 'Stock', 'Exchange', 'Type', 'Shares', 'Price', 'Total']],
      body: sorted.map(t => [
        t.date,
        t.stock_name,
        t.exchange,
        t.type,
        t.quantity.toString(),
        `BDT ${Number(t.price).toFixed(2)}`,
        fmt(t.total_cost),
      ]),
      margin: { left: M, right: M },
      styles: { fontSize: 8, cellPadding: 3.5, textColor: C.dark },
      headStyles: { fillColor: C.grey1, textColor: C.white, fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: C.light2 },
      columnStyles: {
        0: { cellWidth: 24 },
        1: { fontStyle: 'bold', cellWidth: 28 },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 14, halign: 'center' },
        4: { cellWidth: 16, halign: 'center' },
        5: { halign: 'right' },
        6: { halign: 'right', fontStyle: 'bold' },
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 3) {
          data.cell.styles.textColor = data.cell.raw === 'BUY' ? C.green : C.red
          data.cell.styles.fontStyle = 'bold'
        }
      }
    })
    y = doc.lastAutoTable.finalY + 10
  }

  // ════════════════════════════════
  // P&L SUMMARY BOX
  // ════════════════════════════════
  if (y > 240) { doc.addPage(); y = 20 }

  doc.setFillColor(...C.dark2)
  doc.roundedRect(M, y, W - M * 2, 9, 2, 2, 'F')
  const plAccent = totalRealizedPL >= 0 ? C.green : C.red
  doc.setFillColor(...plAccent)
  doc.rect(M, y, 3, 9, 'F')
  doc.setTextColor(...C.white)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('PROFIT & LOSS SUMMARY', M + 7, y + 6)
  y += 11

  const plClr = totalRealizedPL >= 0 ? C.green : C.red
  doc.setFillColor(...C.light)
  doc.roundedRect(M, y, W - M * 2, 36, 3, 3, 'F')
  doc.setFillColor(...plClr)
  doc.rect(M, y, 4, 36, 'F')

  doc.setTextColor(...C.grey2)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('Realized Profit / Loss (FIFO Method)', M + 9, y + 10)

  doc.setTextColor(...plClr)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  const plText = (totalRealizedPL >= 0 ? '+' : '-') + fmt(Math.abs(totalRealizedPL))
  doc.text(plText, M + 9, y + 26)

  doc.setFontSize(11)
  doc.setTextColor(...C.grey2)
  doc.text(`Return: ${plPct}%`, W - M - 4, y + 26, { align: 'right' })

  // Stats row
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')
  const stats = [
    `Total Invested: ${fmt(totalBought)}`,
    `Total Sold: ${fmt(totalSold)}`,
    `Holdings: ${fmt(totalHolding)}`,
    `Transactions: ${transactions.length}`,
  ]
  stats.forEach((s, i) => {
    doc.setTextColor(...C.grey2)
    doc.text(s, M + 9 + i * 45, y + 33)
  })

  // ════════════════════════════════
  // FOOTER (all pages)
  // ════════════════════════════════
  const pages = doc.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.setFillColor(...C.dark)
    doc.rect(0, 287, W, 10, 'F')
    doc.setFillColor(...C.accent)
    doc.rect(0, 287, W, 0.8, 'F')
    doc.setTextColor(...C.grey2)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text('BD Stock Tracker — Personal Portfolio Report | Confidential', M, 293)
    doc.text(`Page ${i} of ${pages}`, W - M, 293, { align: 'right' })
  }

  const filename = `${name.replace(/\s+/g, '_')}_Portfolio_Report_${new Date().toISOString().split('T')[0]}.pdf`
  doc.save(filename)
}
