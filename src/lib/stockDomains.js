// বড় কোম্পানিগুলোর অফিশিয়াল ওয়েবসাইট ডোমেইন — favicon টানার জন্য
// নিশ্চিত হওয়া ডোমেইন শুধু এখানে রাখা হয়েছে, না থাকলে sector emoji fallback দেখাবে
export const STOCK_DOMAINS = {
  GRAMEENPHONE: 'grameenphone.com',
  ROBI: 'robi.com.bd',
  SQURPHARMA: 'squarepharma.com.bd',
  BRACBANK: 'bracbank.com',
  BATBC: 'batbangladesh.com',
  MARICO: 'marico.com',
  BXPHARMA: 'beximcopharma.com',
  RENATA: 'renata-ltd.com',
  DUTCHBANGL: 'dutchbanglabank.com',
  ISLAMIBANK: 'islamibankbd.com',
  CITYBANK: 'thecitybank.com',
  EBL: 'ebl.com.bd',
  PUBALIBANK: 'pubalibangla.com',
  UCBL: 'ucb.com.bd',
  NCCBANK: 'nccbank.com.bd',
  SOUTHEASTB: 'southeastbank.com.bd',
  EXIM: 'eximbankbd.com',
  BANKASIA: 'bankasia-bd.com',
  PREMIERBAN: 'premierbankltd.com',
  MUTUALBANK: 'mutualtrustbank.com',
  JAMUNABANKL: 'jamunabankbd.com',
  SHAHJABANK: 'sjiblbd.com',
  IFIC: 'ificbankbd.com',
  DHAKABANK: 'dhakabankltd.com',
  UTTARABANK: 'uttarabank-bd.com',
  AGRANIBANKL: 'agranibank.org',
  JANATABANK: 'jb.com.bd',
  RUPALIBANK: 'rupalibank.org',
  TITASGAS: 'titasgas.org.bd',
  SUMMITPOWE: 'summitpower.org',
  POWERGRID: 'pgcb.org.bd',
  OLYMPICIND: 'olympicbd.com',
  PRAN: 'pranfoods.net',
  ACI: 'aci-bd.com',
  IBNSINA: 'ibnsina.com.bd',
  ORIONPHARMA: 'orionpharmabd.com',
  ESKAYEF: 'eskayef.com',
  UNILEVER: 'unilever.com.bd',
  RECKITTBEN: 'reckitt.com',
  LINDE: 'linde-bd.com',
  IDLC: 'idlc.com',
  LBFINANCE: 'lankabangla.com',
  BSCCL: 'bsccl.gov.bd',
  TELETALK: 'teletalk.com.bd',
  DSEBD: 'dsebd.org',
  BATA: 'batabd.com',
  BATASHOE: 'batabd.com',
}

// Google-এর পাবলিক favicon service (কোনো API key লাগে না)
export function getStockFaviconUrl(code) {
  const domain = STOCK_DOMAINS[code]
  if (!domain) return null
  return `https://www.google.com/s2/favicons?sz=64&domain=${domain}`
}

// সেক্টর অনুযায়ী fallback emoji
export function getSectorEmoji(sector) {
  const s = (sector || '').toLowerCase()
  if (s.includes('bank')) return '🏦'
  if (s.includes('pharma')) return '💊'
  if (s.includes('telecom')) return '📡'
  if (s.includes('insurance')) return '🛡️'
  if (s.includes('energy') || s.includes('power') || s.includes('oil') || s.includes('gas')) return '⚡'
  if (s.includes('cement')) return '🏗️'
  if (s.includes('steel')) return '🔩'
  if (s.includes('textile')) return '🧵'
  if (s.includes('food') || s.includes('fmcg')) return '🛒'
  if (s.includes('it')) return '💻'
  if (s.includes('finance')) return '💰'
  if (s.includes('footwear') || s.includes('leather')) return '👞'
  if (s.includes('paper')) return '📄'
  if (s.includes('chemical')) return '⚗️'
  if (s.includes('shipping')) return '🚢'
  if (s.includes('manufacturing') || s.includes('industry')) return '🏭'
  return '📊'
}
