export function getMarketStatus() {
  const now = new Date()
  const bst = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Dhaka' }))
  const day = bst.getDay()
  const hour = bst.getHours()
  const min = bst.getMinutes()
  const timeMin = hour * 60 + min
  const isWeekday = day >= 0 && day <= 4
  const marketOpen = 10 * 60
  const marketClose = 14 * 60 + 30
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
  return new Date(dateStr).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric' })
}

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

// সব DSE স্টক (২০০+)
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
  { code: 'ISLAMIBANK', name: 'Islami Bank BD', sector: 'Banking' },
  { code: 'CITYBANK', name: 'The City Bank', sector: 'Banking' },
  { code: 'EBL', name: 'Eastern Bank Limited', sector: 'Banking' },
  { code: 'PUBALIBANK', name: 'Pubali Bank', sector: 'Banking' },
  { code: 'UCBL', name: 'United Commercial Bank', sector: 'Banking' },
  { code: 'NCCBANK', name: 'NCC Bank', sector: 'Banking' },
  { code: 'SOUTHEASTB', name: 'Southeast Bank', sector: 'Banking' },
  { code: 'EXIM', name: 'Exim Bank', sector: 'Banking' },
  { code: 'BANKASIA', name: 'Bank Asia', sector: 'Banking' },
  { code: 'PREMIERBAN', name: 'Premier Bank', sector: 'Banking' },
  { code: 'MUTUALBANK', name: 'Mutual Trust Bank', sector: 'Banking' },
  { code: 'ONEBANKLTD', name: 'One Bank Limited', sector: 'Banking' },
  { code: 'MERCANBANK', name: 'Mercantile Bank', sector: 'Banking' },
  { code: 'JAMUNABANKL', name: 'Jamuna Bank', sector: 'Banking' },
  { code: 'SHAHJABANK', name: 'Shahjalal Islami Bank', sector: 'Banking' },
  { code: 'FIRSTSBANK', name: 'First Security Islami Bank', sector: 'Banking' },
  { code: 'UNIONBANK', name: 'Union Bank', sector: 'Banking' },
  { code: 'GLOBALBANK', name: 'Global Islami Bank', sector: 'Banking' },
  { code: 'AB', name: 'AB Bank', sector: 'Banking' },
  { code: 'IFIC', name: 'IFIC Bank', sector: 'Banking' },
  { code: 'DHAKABANK', name: 'Dhaka Bank', sector: 'Banking' },
  { code: 'STANDBANKL', name: 'Standard Bank', sector: 'Banking' },
  { code: 'UTTARABANK', name: 'Uttara Bank', sector: 'Banking' },
  { code: 'RUPALIBANK', name: 'Rupali Bank', sector: 'Banking' },
  { code: 'AGRANIBANKL', name: 'Agrani Bank', sector: 'Banking' },
  { code: 'JANATABANK', name: 'Janata Bank', sector: 'Banking' },
  { code: 'TITASGAS', name: 'Titas Gas', sector: 'Energy' },
  { code: 'SUMMITPOWE', name: 'Summit Power', sector: 'Energy' },
  { code: 'LALPIRPOWER', name: 'Lalpir Power', sector: 'Energy' },
  { code: 'POWERGRID', name: 'Power Grid BD', sector: 'Energy' },
  { code: 'KPCL', name: 'Khulna Power Company', sector: 'Energy' },
  { code: 'DOREENPOWER', name: 'Doreen Power', sector: 'Energy' },
  { code: 'BARAKA', name: 'Baraka Power', sector: 'Energy' },
  { code: 'BARAKAPBIL', name: 'Baraka Patenga Power', sector: 'Energy' },
  { code: 'WESTERNMARI', name: 'Western Marine Shipyard', sector: 'Energy' },
  { code: 'MICEMENT', name: 'MI Cement', sector: 'Cement' },
  { code: 'LAFARGEHOLCIM', name: 'LafargeHolcim BD', sector: 'Cement' },
  { code: 'HEIDELBERG', name: 'Heidelberg Cement', sector: 'Cement' },
  { code: 'CONFICHEM', name: 'Confidence Cement', sector: 'Cement' },
  { code: 'MEGHNACEM', name: 'Meghna Cement', sector: 'Cement' },
  { code: 'PREMIUMCEM', name: 'Premium Cement', sector: 'Cement' },
  { code: 'OLYMPICIND', name: 'Olympic Industries', sector: 'FMCG' },
  { code: 'PRAN', name: 'PRAN Foods', sector: 'FMCG' },
  { code: 'RAHIMTEXT', name: 'Rahim Textile', sector: 'Textile' },
  { code: 'ACI', name: 'ACI Limited', sector: 'Pharma' },
  { code: 'IBNSINA', name: 'Ibn Sina Pharma', sector: 'Pharma' },
  { code: 'BEACONPHAR', name: 'Beacon Pharma', sector: 'Pharma' },
  { code: 'ORIONPHARMA', name: 'Orion Pharma', sector: 'Pharma' },
  { code: 'ACIPHARM', name: 'ACI Formulations', sector: 'Pharma' },
  { code: 'CENTRALPHA', name: 'Central Pharma', sector: 'Pharma' },
  { code: 'ESKAYEF', name: 'Eskayef Pharma', sector: 'Pharma' },
  { code: 'GENNEXT', name: 'GEN Next', sector: 'Pharma' },
  { code: 'GLOBALINS', name: 'Global Insurance', sector: 'Insurance' },
  { code: 'GREENDELTAI', name: 'Green Delta Insurance', sector: 'Insurance' },
  { code: 'NITOLINS', name: 'Nitol Insurance', sector: 'Insurance' },
  { code: 'PIONEERINS', name: 'Pioneer Insurance', sector: 'Insurance' },
  { code: 'RUPALILIFE', name: 'Rupali Life Insurance', sector: 'Insurance' },
  { code: 'SINOBANGLA', name: 'Sino-Bangla Ind', sector: 'Industry' },
  { code: 'BSRMSTEEL', name: 'BSRM Steel', sector: 'Steel' },
  { code: 'BSRMLTD', name: 'BSRM Ltd', sector: 'Steel' },
  { code: 'RATANSTEEL', name: 'Ratan Steel', sector: 'Steel' },
  { code: 'GPHISPAT', name: 'GPH Ispat', sector: 'Steel' },
  { code: 'KSRM', name: 'KSRM Steel', sector: 'Steel' },
  { code: 'NAVANAREF', name: 'Navana Refineries', sector: 'Oil & Gas' },
  { code: 'PADMALIFE', name: 'Padma Life Insurance', sector: 'Insurance' },
  { code: 'BANGLADESHI', name: 'Bangladesh Shipping', sector: 'Shipping' },
  { code: 'BSCCL', name: 'Bangladesh Submarine Cable', sector: 'Telecom' },
  { code: 'TELETALK', name: 'Teletalk BD', sector: 'Telecom' },
  { code: 'BDCOM', name: 'BDCOM Online', sector: 'IT' },
  { code: 'BRACIT', name: 'BRAC IT Services', sector: 'IT' },
  { code: 'DATASOFT', name: 'Datasoft Systems', sector: 'IT' },
  { code: 'DSEBD', name: 'Dhaka Stock Exchange', sector: 'Finance' },
  { code: 'ICB', name: 'Investment Corp. of BD', sector: 'Finance' },
  { code: 'IPDC', name: 'IPDC Finance', sector: 'Finance' },
  { code: 'LBFINANCE', name: 'LankaBangla Finance', sector: 'Finance' },
  { code: 'IDLC', name: 'IDLC Finance', sector: 'Finance' },
  { code: 'PHOENIXFIN', name: 'Phoenix Finance', sector: 'Finance' },
  { code: 'UNITEDFIN', name: 'United Finance', sector: 'Finance' },
  { code: 'ISLAMICFIN', name: 'Islamic Finance', sector: 'Finance' },
  { code: 'DELTALIFE', name: 'Delta Life Insurance', sector: 'Insurance' },
  { code: 'SUNLIFEINS', name: 'Sun Life Insurance', sector: 'Insurance' },
  { code: 'POPULARLIF', name: 'Popular Life Insurance', sector: 'Insurance' },
  { code: 'METLIFE', name: 'MetLife Insurance', sector: 'Insurance' },
  { code: 'ARGONDENIM', name: 'Argon Denim', sector: 'Textile' },
  { code: 'ANLIMAYARN', name: 'Anlima Yarn', sector: 'Textile' },
  { code: 'APEXFOOT', name: 'Apex Footwear', sector: 'Footwear' },
  { code: 'APEXTANRY', name: 'Apex Tannery', sector: 'Leather' },
  { code: 'BATA', name: 'Bata Shoe', sector: 'Footwear' },
  { code: 'BATASHOE', name: 'Bata Shoe Company', sector: 'Footwear' },
  { code: 'HAKKANIPUL', name: 'Hakkani Pulp', sector: 'Paper' },
  { code: 'PAPERPROC', name: 'Paper Processing', sector: 'Paper' },
  { code: 'SQRTEXTILE', name: 'Square Textile', sector: 'Textile' },
  { code: 'MITHUNKNIT', name: 'Mithun Knitting', sector: 'Textile' },
  { code: 'DESHBANDHU', name: 'Desh Bandhu Sugar', sector: 'Food' },
  { code: 'MONOSPOOL', name: 'Monos Pool Cement', sector: 'Cement' },
  { code: 'KEYACOSMET', name: 'Keya Cosmetics', sector: 'FMCG' },
  { code: 'RECKITTBEN', name: 'Reckitt Benckiser', sector: 'FMCG' },
  { code: 'UNILEVER', name: 'Unilever BD', sector: 'FMCG' },
  { code: 'LINDE', name: 'Linde Bangladesh', sector: 'Chemical' },
  { code: 'BOC', name: 'BOC Bangladesh', sector: 'Chemical' },
  { code: 'PADMATEXT', name: 'Padma Textile', sector: 'Textile' },
  { code: 'DAFODILCOM', name: 'Daffodil Computers', sector: 'IT' },
]

export const CSE_STOCKS = [
  { code: 'GP', name: 'Grameenphone (CSE)', sector: 'Telecom' },
  { code: 'SQURPHARMA', name: 'Square Pharma (CSE)', sector: 'Pharma' },
  { code: 'BATBC', name: 'BAT Bangladesh (CSE)', sector: 'FMCG' },
  { code: 'BRACBANK', name: 'BRAC Bank (CSE)', sector: 'Banking' },
  { code: 'DUTCHBANGL', name: 'Dutch-Bangla Bank (CSE)', sector: 'Banking' },
  { code: 'BXPHARMA', name: 'Beximco Pharma (CSE)', sector: 'Pharma' },
  { code: 'RENATA', name: 'Renata (CSE)', sector: 'Pharma' },
  { code: 'BERGERPBL', name: 'Berger Paints (CSE)', sector: 'Manufacturing' },
  { code: 'ISLAMIBANK', name: 'Islami Bank (CSE)', sector: 'Banking' },
  { code: 'CITYBANK', name: 'City Bank (CSE)', sector: 'Banking' },
  { code: 'EBL', name: 'Eastern Bank (CSE)', sector: 'Banking' },
  { code: 'PUBALIBANK', name: 'Pubali Bank (CSE)', sector: 'Banking' },
  { code: 'BSRMSTEEL', name: 'BSRM Steel (CSE)', sector: 'Steel' },
  { code: 'APEXFOOT', name: 'Apex Footwear (CSE)', sector: 'Footwear' },
  { code: 'IDLC', name: 'IDLC Finance (CSE)', sector: 'Finance' },
  { code: 'LBFINANCE', name: 'LankaBangla Finance (CSE)', sector: 'Finance' },
  { code: 'SUMMITPOWE', name: 'Summit Power (CSE)', sector: 'Energy' },
  { code: 'TITASGAS', name: 'Titas Gas (CSE)', sector: 'Energy' },
  { code: 'ACI', name: 'ACI Limited (CSE)', sector: 'Pharma' },
  { code: 'OLYMPICIND', name: 'Olympic Industries (CSE)', sector: 'FMCG' },
]
