import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { DSE_STOCKS, CSE_STOCKS } from '../lib/utils'
import { X, Info } from 'lucide-react'

export default function AddTransactionModal({ onClose, prefill }) {
  const [type, setType] = useState(prefill?.type || 'BUY')
  const [exchange, setExchange] = useState(prefill?.exchange || 'DSE')
  const [stockName, setStockName] = useState(prefill?.stock_name || '')
  const [quantity, setQuantity] = useState(prefill?.quantity || '')
  const [price, setPrice] = useState(prefill?.price || '')
  const [date, setDate] = useState(prefill?.date || new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [holdings, setHoldings] = useState({}) // {stockName: availableQty}

  const stocks = exchange === 'DSE' ? DSE_STOCKS : CSE_STOCKS
  const filtered = stocks.filter(s =>
    s.code.toLowerCase().includes(stockName.toLowerCase()) ||
    s.name.toLowerCase().includes(stockName.toLowerCase())
  ).slice(0, 6)

  const totalCost = quantity && price ? (Number(quantity) * Number(price)) : 0
  const availableQty = holdings[stockName] || 0

  useEffect(() => { fetchHoldings() }, [])

  async function fetchHoldings() {
    const { data } = await supabase.from('transactions').select('stock_name, quantity, type')
    if (!data) return
    const map = {}
    data.forEach(t => {
      if (!map[t.stock_name]) map[t.stock_name] = 0
      if (t.type === 'BUY') map[t.stock_name] += Number(t.quantity)
      else map[t.stock_name] -= Number(t.quantity)
    })
    setHoldings(map)
  }

  async function handleSubmit() {
    if (!stockName || !quantity || !price || !date) { setError('সব তথ্য পূরণ করুন'); return }
    if (type === 'SELL' && Number(quantity) > availableQty) {
      setError(`আপনার কাছে মাত্র ${availableQty}টি ${stockName} শেয়ার আছে!`)
      return
    }
    setLoading(true); setError('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('লগইন করুন'); setLoading(false); return }
    const { error: err } = await supabase.from('transactions').insert({
      user_id: user.id, type, exchange,
      stock_name: stockName,
      quantity: Number(quantity),
      price: Number(price),
      date
    })
    if (err) setError(err.message)
    else onClose()
    setLoading(false)
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal fade-up">
        <div className="modal-header">
          <h3 style={{ fontSize: 17, fontWeight: 800 }}>ট্রানজেকশন যোগ করুন</h3>
          <button className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          {/* BUY/SELL */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
            <button className={`btn btn-buy ${type === 'BUY' ? 'active' : ''}`}
              style={{ flex: 1, justifyContent: 'center', fontSize: 15, fontWeight: 800 }}
              onClick={() => setType('BUY')}>📈 কেনা (BUY)</button>
            <button className={`btn btn-sell ${type === 'SELL' ? 'active' : ''}`}
              style={{ flex: 1, justifyContent: 'center', fontSize: 15, fontWeight: 800 }}
              onClick={() => setType('SELL')}>📉 বেচা (SELL)</button>
          </div>

          {/* Exchange */}
          <div className="form-group">
            <label className="form-label">এক্সচেঞ্জ</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {['DSE', 'CSE'].map(ex => (
                <button key={ex} onClick={() => { setExchange(ex); setStockName('') }}
                  style={{ flex: 1, padding: '8px', borderRadius: 'var(--radius-xs)', border: `1px solid ${exchange === ex ? 'var(--accent)' : 'var(--border)'}`, background: exchange === ex ? 'rgba(0,229,180,0.1)' : 'var(--bg3)', color: exchange === ex ? 'var(--accent)' : 'var(--text2)', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
                  {ex}
                </button>
              ))}
            </div>
          </div>

          {/* Date */}
          <div className="form-group">
            <label className="form-label">তারিখ</label>
            <input className="form-input" type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>

          {/* Stock Name */}
          <div className="form-group" style={{ position: 'relative' }}>
            <label className="form-label">স্টকের নাম / কোড</label>
            <input className="form-input" placeholder="যেমন: BRACBANK..."
              value={stockName}
              onChange={e => { setStockName(e.target.value.toUpperCase()); setShowSuggestions(true) }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} />
            {showSuggestions && stockName && filtered.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xs)', zIndex: 100, overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
                {filtered.map(s => (
                  <div key={s.code} onMouseDown={() => { setStockName(s.code); setShowSuggestions(false) }}
                    style={{ padding: '9px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{s.code}</div>
                    <div style={{ fontSize: 11, color: 'var(--text2)' }}>{s.name} · {s.sector}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Available shares info for SELL */}
          {type === 'SELL' && stockName && (
            <div style={{
              background: availableQty > 0 ? 'rgba(0,229,180,0.08)' : 'rgba(239,68,68,0.08)',
              border: `1px solid ${availableQty > 0 ? 'rgba(0,229,180,0.2)' : 'rgba(239,68,68,0.2)'}`,
              borderRadius: 'var(--radius-xs)', padding: '10px 14px', marginBottom: 14,
              display: 'flex', alignItems: 'center', gap: 8
            }}>
              <Info size={14} style={{ color: availableQty > 0 ? 'var(--accent)' : 'var(--red)', flexShrink: 0 }} />
              <div>
                <span style={{ fontSize: 13, color: 'var(--text2)' }}>{stockName} — হাতে আছে: </span>
                <span style={{ fontSize: 15, fontWeight: 800, color: availableQty > 0 ? 'var(--accent)' : 'var(--red)' }}>
                  {availableQty} শেয়ার
                </span>
                {availableQty === 0 && <div style={{ fontSize: 11, color: 'var(--red)', marginTop: 2 }}>এই স্টক আপনার কাছে নেই!</div>}
              </div>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">শেয়ার সংখ্যা {type === 'SELL' && availableQty > 0 && <span style={{ color: 'var(--accent)', fontSize: 10 }}>(সর্বোচ্চ {availableQty})</span>}</label>
              <input className="form-input" type="number" placeholder="যেমন: 50"
                value={quantity} onChange={e => setQuantity(e.target.value)}
                min="1" max={type === 'SELL' ? availableQty : undefined} />
            </div>
            <div className="form-group">
              <label className="form-label">{type === 'BUY' ? 'কেনার দাম' : 'বেচার দাম'} (৳)</label>
              <input className="form-input" type="number" placeholder="যেমন: 67.50"
                value={price} onChange={e => setPrice(e.target.value)} step="0.01" />
            </div>
          </div>

          {/* Total */}
          <div style={{ background: `rgba(${type === 'BUY' ? '0,229,180' : '239,68,68'},0.08)`, border: `1px solid rgba(${type === 'BUY' ? '0,229,180' : '239,68,68'},0.2)`, borderRadius: 'var(--radius-xs)', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, color: 'var(--text2)' }}>মোট {type === 'BUY' ? 'খরচ' : 'আয়'}</span>
            <span style={{ fontSize: 20, fontWeight: 800, color: type === 'BUY' ? 'var(--accent)' : 'var(--red)' }}>
              ৳{totalCost.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          {/* Profit preview for SELL */}
          {type === 'SELL' && stockName && quantity && price && availableQty > 0 && holdings[stockName] > 0 && (
            <div style={{ marginTop: 10, padding: '10px 14px', background: 'var(--bg3)', borderRadius: 'var(--radius-xs)', fontSize: 13 }}>
              {(() => {
                // avg buy price হিসাব (simplified)
                const sellTotal = Number(quantity) * Number(price)
                const note = `${quantity} শেয়ার × ৳${price} = ৳${sellTotal.toLocaleString()}`
                return <span style={{ color: 'var(--text2)' }}>💡 {note}</span>
              })()}
            </div>
          )}

          {error && <div style={{ color: 'var(--red)', fontSize: 13, marginTop: 10, padding: '8px 12px', background: 'rgba(239,68,68,0.08)', borderRadius: 6 }}>⚠️ {error}</div>}
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>বাতিল</button>
          <button className={`btn ${type === 'BUY' ? 'btn-primary' : ''}`}
            style={type === 'SELL' ? { background: 'var(--red)', color: '#fff' } : {}}
            onClick={handleSubmit} disabled={loading}>
            {loading ? '⏳ সংরক্ষণ হচ্ছে...' : `✅ ${type === 'BUY' ? 'কেনা' : 'বেচা'} যোগ করুন`}
          </button>
        </div>
      </div>
    </div>
  )
}
