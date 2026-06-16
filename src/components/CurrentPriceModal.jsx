import { useState } from 'react'
import { X, TrendingUp, TrendingDown } from 'lucide-react'
import { formatTaka } from '../lib/utils'

export default function CurrentPriceModal({ holdings, prices, onSave, onClose }) {
  const [localPrices, setLocalPrices] = useState({ ...prices })

  function handleSave() {
    onSave(localPrices)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal fade-up">
        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 800 }}>বর্তমান দাম আপডেট</h3>
            <p style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>DSE থেকে দেখে দাম দিন → Unrealized P&L দেখাবে</p>
          </div>
          <button className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          {Object.entries(holdings).map(([name, h]) => {
            const curPrice = Number(localPrices[name] || 0)
            const curValue = curPrice * h.qty
            const unrealized = curValue - h.cost
            const pct = h.cost > 0 ? ((unrealized / h.cost) * 100).toFixed(2) : '0'
            return (
              <div key={name} style={{ marginBottom: 14, padding: '14px', background: 'var(--bg3)', borderRadius: 10, border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 14 }}>{name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text2)' }}>{h.qty} শেয়ার · গড় কেনা: {formatTaka(h.avgPrice)}</div>
                  </div>
                  {curPrice > 0 && (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: unrealized >= 0 ? 'var(--green)' : 'var(--red)' }}>
                        {unrealized >= 0 ? '+' : ''}{formatTaka(unrealized)}
                      </div>
                      <div style={{ fontSize: 11, color: unrealized >= 0 ? 'var(--green)' : 'var(--red)' }}>
                        {unrealized >= 0 ? <TrendingUp size={10} style={{display:'inline'}} /> : <TrendingDown size={10} style={{display:'inline'}} />} {pct}%
                      </div>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <label style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 600, whiteSpace: 'nowrap' }}>বর্তমান দাম (৳)</label>
                  <input
                    className="form-input"
                    type="number"
                    placeholder={`গড়: ${h.avgPrice.toFixed(2)}`}
                    value={localPrices[name] || ''}
                    onChange={e => setLocalPrices(p => ({ ...p, [name]: e.target.value }))}
                    step="0.01"
                  />
                </div>
              </div>
            )
          })}
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>বাতিল</button>
          <button className="btn btn-primary" onClick={handleSave}>✅ সংরক্ষণ করুন</button>
        </div>
      </div>
    </div>
  )
}
