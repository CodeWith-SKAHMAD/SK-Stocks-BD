import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { DSE_STOCKS, CSE_STOCKS } from '../lib/utils'
import { X } from 'lucide-react'

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

  const stocks = exchange === 'DSE' ? DSE_STOCKS : CSE_STOCKS
  const filtered = stocks.filter(s =>
    s.code.toLowerCase().includes(stockName.toLowerCase()) ||
    s.name.toLowerCase().includes(stockName.toLowerCase())
  ).slice(0, 6)

  const totalCost = quantity && price ? (Number(quantity) * Number(price)) : 0

  async function handleSubmit() {
    if (!stockName || !quantity || !price || !date) { setError('সব তথ্য পূরণ করুন'); return }
    setLoading(true); setError('')
    const { error: err } = await supabase.from('transactions').insert({
      type, exchange, stock_name: stockName,
      quantity: Number(quantity), price: Number(price), date
    })
    if (err) setError(err.message)
    else onClose()
    setLoading(false)
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal fade-up">
        <div className="modal-header">
          <h3 style={{ fontFamily: 'var(--font-head)', fontSize: 18 }}>ট্রানজেকশন যোগ করুন</h3>
          <button className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="modal-body">
          {/* BUY/SELL Toggle */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <button
              className={`btn btn-buy ${type === 'BUY' ? 'active' : ''}`}
              style={{ flex: 1, justifyContent: 'center', fontSize: 16, fontWeight: 800 }}
              onClick={() => setType('BUY')}
            >
              📈 কেনা (BUY)
            </button>
            <button
              className={`btn btn-sell ${type === 'SELL' ? 'active' : ''}`}
              style={{ flex: 1, justifyContent: 'center', fontSize: 16, fontWeight: 800 }}
              onClick={() => setType('SELL')}
            >
              📉 বেচা (SELL)
            </button>
          </div>

          {/* Exchange */}
          <div className="form-group">
            <label className="form-label">এক্সচেঞ্জ</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {['DSE', 'CSE'].map(ex => (
                <button
                  key={ex}
                  onClick={() => { setExchange(ex); setStockName('') }}
                  style={{
                    flex: 1, padding: '8px', borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${exchange === ex ? 'var(--accent)' : 'var(--border)'}`,
                    background: exchange === ex ? 'rgba(0,212,170,0.1)' : 'var(--bg3)',
                    color: exchange === ex ? 'var(--accent)' : 'var(--text2)',
                    cursor: 'pointer', fontWeight: 600, fontSize: 14
                  }}
                >{ex}</button>
              ))}
            </div>
          </div>

          {/* Date */}
          <div className="form-group">
            <label className="form-label">তারিখ</label>
            <input className="form-input" type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>

          {/* Stock Name with autocomplete */}
          <div className="form-group" style={{ position: 'relative' }}>
            <label className="form-label">স্টকের নাম / কোড</label>
            <input
              className="form-input"
              placeholder="যেমন: GRAMEENPHONE বা Grameenphone..."
              value={stockName}
              onChange={e => { setStockName(e.target.value); setShowSuggestions(true) }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            />
            {showSuggestions && stockName && filtered.length > 0 && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0,
                background: 'var(--card)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', zIndex: 100, overflow: 'hidden',
                boxShadow: 'var(--shadow)'
              }}>
                {filtered.map(s => (
                  <div
                    key={s.code}
                    onMouseDown={() => { setStockName(s.code); setShowSuggestions(false) }}
                    style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.target.style.background = 'var(--bg3)'}
                    onMouseLeave={e => e.target.style.background = ''}
                  >
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{s.code}</div>
                    <div style={{ fontSize: 11, color: 'var(--text2)' }}>{s.name} · {s.sector}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-row">
            {/* Quantity */}
            <div className="form-group">
              <label className="form-label">শেয়ার সংখ্যা</label>
              <input className="form-input" type="number" placeholder="যেমন: 100" value={quantity} onChange={e => setQuantity(e.target.value)} min="1" />
            </div>

            {/* Price */}
            <div className="form-group">
              <label className="form-label">{type === 'BUY' ? 'কেনার দাম' : 'বেচার দাম'} (৳)</label>
              <input className="form-input" type="number" placeholder="যেমন: 380.50" value={price} onChange={e => setPrice(e.target.value)} step="0.01" />
            </div>
          </div>

          {/* Total Cost Display */}
          <div style={{
            background: `rgba(${type === 'BUY' ? '0,200,150' : '255,77,106'},0.08)`,
            border: `1px solid rgba(${type === 'BUY' ? '0,200,150' : '255,77,106'},0.2)`,
            borderRadius: 'var(--radius-sm)',
            padding: '12px 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <span style={{ fontSize: 13, color: 'var(--text2)' }}>মোট {type === 'BUY' ? 'খরচ' : 'আয়'}</span>
            <span style={{ fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-head)', color: type === 'BUY' ? 'var(--accent2)' : 'var(--green)' }}>
              ৳{totalCost.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          {error && <div style={{ color: 'var(--red)', fontSize: 13, marginTop: 12 }}>⚠️ {error}</div>}
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>বাতিল</button>
          <button
            className={`btn ${type === 'BUY' ? 'btn-primary' : 'btn-sell'}`}
            style={{ background: type === 'SELL' ? 'var(--red)' : '', color: type === 'SELL' ? '#fff' : '' }}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? '⏳ সংরক্ষণ হচ্ছে...' : `✅ ${type === 'BUY' ? 'কেনা' : 'বেচা'} যোগ করুন`}
          </button>
        </div>
      </div>
    </div>
  )
}
