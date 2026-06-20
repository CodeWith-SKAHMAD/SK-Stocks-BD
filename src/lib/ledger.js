// Ledger ব্যালেন্স হিসাব
export function calcLedgerBalance(ledgerEntries) {
  let balance = 0
  ledgerEntries.forEach(entry => {
    if (entry.type === 'CASH_IN' || entry.type === 'STOCK_SELL') {
      balance += Number(entry.amount)
    } else if (entry.type === 'CASH_OUT' || entry.type === 'STOCK_BUY') {
      balance -= Number(entry.amount)
    }
  })
  return balance
}

export function getLedgerSummary(ledgerEntries) {
  const totalCashIn = ledgerEntries.filter(e => e.type === 'CASH_IN').reduce((s, e) => s + Number(e.amount), 0)
  const totalCashOut = ledgerEntries.filter(e => e.type === 'CASH_OUT').reduce((s, e) => s + Number(e.amount), 0)
  const totalStockBuy = ledgerEntries.filter(e => e.type === 'STOCK_BUY').reduce((s, e) => s + Number(e.amount), 0)
  const totalStockSell = ledgerEntries.filter(e => e.type === 'STOCK_SELL').reduce((s, e) => s + Number(e.amount), 0)
  const balance = totalCashIn + totalStockSell - totalCashOut - totalStockBuy
  return { totalCashIn, totalCashOut, totalStockBuy, totalStockSell, balance }
}
