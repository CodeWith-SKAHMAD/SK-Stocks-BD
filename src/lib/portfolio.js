// সঠিক Realized P&L হিসাব — FIFO method
export function calcPortfolio(transactions) {
  // প্রতিটা স্টকের জন্য buy queue রাখি
  const buyQueues = {} // { stockName: [{qty, price}] }
  let totalRealizedPL = 0

  // তারিখ অনুযায়ী sort করি
  const sorted = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date))

  sorted.forEach(t => {
    const name = t.stock_name
    if (!buyQueues[name]) buyQueues[name] = []

    if (t.type === 'BUY') {
      buyQueues[name].push({ qty: Number(t.quantity), price: Number(t.price) })
    } else {
      // SELL — FIFO দিয়ে cost বের করি
      let remainSell = Number(t.quantity)
      let totalBuyCost = 0

      while (remainSell > 0 && buyQueues[name].length > 0) {
        const firstBuy = buyQueues[name][0]
        if (firstBuy.qty <= remainSell) {
          totalBuyCost += firstBuy.qty * firstBuy.price
          remainSell -= firstBuy.qty
          buyQueues[name].shift()
        } else {
          totalBuyCost += remainSell * firstBuy.price
          firstBuy.qty -= remainSell
          remainSell = 0
        }
      }

      const sellRevenue = Number(t.quantity) * Number(t.price)
      totalRealizedPL += sellRevenue - totalBuyCost
    }
  })

  // বর্তমান holdings
  const holdings = {}
  Object.entries(buyQueues).forEach(([name, queue]) => {
    const totalQty = queue.reduce((s, b) => s + b.qty, 0)
    const totalCost = queue.reduce((s, b) => s + b.qty * b.price, 0)
    if (totalQty > 0) {
      holdings[name] = { qty: totalQty, cost: totalCost, avgPrice: totalCost / totalQty }
    }
  })

  return { totalRealizedPL, holdings }
}
