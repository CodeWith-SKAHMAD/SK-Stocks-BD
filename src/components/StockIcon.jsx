import { useState } from 'react'
import { getStockFaviconUrl, getSectorEmoji } from '../lib/stockDomains'

export default function StockIcon({ code, sector, size = 28, domainOverride = null }) {
  const [failed, setFailed] = useState(false)
  const faviconUrl = domainOverride
    ? `https://www.google.com/s2/favicons?sz=64&domain=${domainOverride}`
    : getStockFaviconUrl(code)

  if (!faviconUrl || failed) {
    return (
      <div style={{
        width: size, height: size, borderRadius: size * 0.28,
        background: 'var(--glass)', border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.55, flexShrink: 0
      }}>
        {getSectorEmoji(sector)}
      </div>
    )
  }

  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.28,
      background: '#fff', border: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden', flexShrink: 0, padding: size * 0.12
    }}>
      <img
        src={faviconUrl}
        alt={code}
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        onError={() => setFailed(true)}
      />
    </div>
  )
}
