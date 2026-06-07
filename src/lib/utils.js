// BD Stock Market Hours: Sun-Thu 10:00 AM - 2:30 PM (BST = UTC+6)
export function getMarketStatus() {
  const now = new Date()
  const bst = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Dhaka' }))
  const day = bst.getDay() // 0=Sun, 1=Mon, ..., 4=Thu, 5=Fri, 6=Sat
  const hour = bst.getHours()
  const min = bst.getMinutes()
  const timeMin = hour * 60 + min

  const isWeekday = day >= 0 && day <= 4 // Sun=0 to Thu=4
  const marketOpen = 10 * 60      // 10:00 AM
  const marketClose = 14 * 60 + 30 // 2:30 PM

  const isOpen = isWeekday && timeMin >= marketOpen && timeMin < marketClose

  let nextOpen = ''
  if (!isOpen) {
    if (day === 5 || day === 6) nextOpen = 'রবিবার সকাল ১০:০০ টায়'
    else if (timeMin >= marketClose) nextOpen = 'আগামীকাল সকাল ১০:০০ টায়'
    else nextOpen = 'আজ সকাল ১০:০০ টায়'
  }

  return { isOpen, nextOpen }
}

export function formatTaka(amount) {
  if (isNaN(amount) || amount === null) return '৳০'
  const abs = Math.abs(amount)
  let formatted
  if (abs >= 10000000) formatted = (abs / 10000000).toFixed(2) + ' কোটি'
  else if (abs >= 100000) formatted = (abs / 100000).toFixed(2) + ' লাখ'
  else formatted = abs.toLocaleString('en-BD')
  return (amount < 0 ? '-৳' : '৳') + formatted
}

export function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('bn-BD', {
    day: 'numeric', month: 'short', year: 'numeric'
  })
}

// Popular DSE Stocks
export const DSE_STOCKS = [
  { code: 'GRAMEENPHONE', name: 'Grameenphone Ltd', sector: 'Telecom' },
  { code: 'SQURPHARMA', name: 'Square Pharmaceuticals', sector: 'Pharma' },
  { code: 'BERGERPBL', name: 'Berger Paints BD', sector: 'Manufacturing' },
  { code: 'BATBC', name: 'British American Tobacco', sector: 'FMCG' },
  { code: 'MARICO', name: 'Marico Bangladesh', sector: 'FMCG' },
  { code: 'BXPHARMA', name: 'Beximco Pharma', sector: 'Pharma' },
  { code: 'RENATA', name: 'Renata Limited', sector: 'Pharma' },
  { code: 'DUTCHBANGL', name: 'Dutch-Bangla Bank', sector: 'Banking' },
  { code: 'BRACBANK', name: 'BRAC Bank Limited', sector: 'Banking' },
  { code: 'ISLAMI', name: 'Islami Bank BD', sector: 'Banking' },
  { code: 'CITYBANK', name: 'The City Bank', sector: 'Banking' },
  { code: 'EBLBL', name: 'Eastern Bank Limited', sector: 'Banking' },
  { code: 'PUBALIBANK', name: 'Pubali Bank', sector: 'Banking' },
  { code: 'UCBL', name: 'United Commercial Bank', sector: 'Banking' },
  { code: 'NCCBANK', name: 'NCC Bank', sector: 'Banking' },
  { code: 'TITASGAS', name: 'Titas Gas', sector: 'Energy' },
  { code: 'SUMMITPOWE', name: 'Summit Power', sector: 'Energy' },
  { code: 'LALPIRPOWER', name: 'Lalpir Power', sector: 'Energy' },
  { code: 'POWERGRID', name: 'Power Grid BD', sector: 'Energy' },
  { code: 'MICEMENT', name: 'MI Cement', sector: 'Cement' },
  { code: 'LAFARGEHOLCIM', name: 'LafargeHolcim BD', sector: 'Cement' },
  { code: 'HEIDELBERG', name: 'Heidelberg Cement', sector: 'Cement' },
  { code: 'SINOBANGLA', name: 'Sino-Bangla Ind', sector: 'Industry' },
  { code: 'OLYMPICIND', name: 'Olympic Industries', sector: 'FMCG' },
  { code: 'PRAN', name: 'PRAN Foods', sector: 'FMCG' },
  { code: 'ACI', name: 'ACI Limited', sector: 'Pharma' },
  { code: 'IBNSINA', name: 'Ibn Sina Pharma', sector: 'Pharma' },
  { code: 'BEACONPHAR', name: 'Beacon Pharma', sector: 'Pharma' },
  { code: 'ORIONPHARMA', name: 'Orion Pharma', sector: 'Pharma' },
  { code: 'GLOBALINS', name: 'Global Insurance', sector: 'Insurance' },
]

export const CSE_STOCKS = [
  { code: 'GP', name: 'Grameenphone (CSE)', sector: 'Telecom' },
  { code: 'SQURPHARMA', name: 'Square Pharma (CSE)', sector: 'Pharma' },
  { code: 'BATBC', name: 'BAT Bangladesh (CSE)', sector: 'FMCG' },
  { code: 'BRACBANK', name: 'BRAC Bank (CSE)', sector: 'Banking' },
  { code: 'DUTCHBANGL', name: 'Dutch-Bangla Bank (CSE)', sector: 'Banking' },
  { code: 'BXPHARMA', name: 'Beximco Pharma (CSE)', sector: 'Pharma' },
]

// Fibonacci levels calculator
export function calculateFibLevels(high, low) {
  const diff = high - low
  return {
    fib0: low,
    fib236: +(low + diff * 0.236).toFixed(2),
    fib382: +(low + diff * 0.382).toFixed(2),
    fib500: +(low + diff * 0.500).toFixed(2),
    fib618: +(low + diff * 0.618).toFixed(2),
    fib786: +(low + diff * 0.786).toFixed(2),
    fib100: high,
  }
}
