import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { DSE_STOCKS, CSE_STOCKS, formatTaka } from '../lib/utils'
import { calcLedgerBalance } from '../lib/ledger'
import { X, Info, TrendingUp, TrendingDown, Calendar, Hash, Coins, Wallet } from 'lucide-react'

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
  const [holdings, setHoldings] = useState({})
  const [ledgerBalance, setLedgerBalance] = useState(0)

  const stocks = exchange === 'DSE' ? DSE_STOCKS : CSE_STOCKS
  const filtered = stocks.filter(s =>
    s.code.toLowerCase().includes(stockName.toLowerCase()) ||
    s.name.toLowerCase().includes(stockName.toLowerCase())
  ).slice(0, 6)

  const totalCost = quantity && price ? (Number(quantity) * Number(price)) : 0
  const availableQty = holdings[stockName] || 0
  const insufficientFunds = type === 'BUY' && totalCost > ledgerBalance

  useEffect(() => { fetchHoldings(); fetchLedgerBalance() }, [])

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

  async function fetchLedgerBalance() {
    const { data } = await supabase.from('ledger').select('type, amount')
    setLedgerBalance(calcLedgerBalance(data || []))
  }

  async function handleSubmit() {
    if (!stockName || !quantity || !price || !date) { setError('সব তথ্য পূরণ করুন'); return }
    if (type === 'SELL' && Number(quantity) > availableQty) {
      setError(`আপনার কাছে মাত্র ${availableQty}টি ${stockName} শেয়ার আছে!`)
      return
    }
    if (type === 'BUY' && totalCost > ledgerBalance) {
      setError(`লেডজারে পর্যাপ্ত টাকা নেই! এভেইলেবল: ${formatTaka(ledgerBalance)}`)
      return
    }
    setLoading(true); setError('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('লগইন করুন'); setLoading(false); return }

    // ট্রানজেকশন তৈরি
    const { error: err } = await supabase.from('transactions').insert({
      user_id: user.id, type, exchange,
      stock_name: stockName,
      quantity: Number(quantity),
      price: Number(price),
      date
    })
    if (err) { setError(err.message); setLoading(false); return }

    // লেডজার এন্ট্রি তৈরি — BUY হলে টাকা কাটবে, SELL হলে যুক্ত হবে
    await supabase.from('ledger').insert({
      user_id: user.id,
      type: type === 'BUY' ? 'STOCK_BUY' : 'STOCK_SELL',
      amount: totalCost,
      related_stock: stockName,
      date
    })

    onClose()
    setLoading(false)
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.3px' }}>ট্রানজেকশন যোগ করুন</h3>
            <p style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>স্টক কেনা বা বেচার রেকর্ড রাখুন</p>
          </div>
          <button className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="modal-body">
          {/* Ledger Balance Info */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'var(--glass)', border: '1px solid var(--border)', borderRadius: 12,
            padding: '10px 14px', marginBottom: 16
          }}>
            <span style={{ fontSize: 12, color: 'var(--text2)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Wallet size={13} /> লেডজার ব্যালেন্স
            </span>
            <span style={{ fontWeight: 800, fontSize: 15, color: ledgerBalance > 0 ? 'var(--green)' : 'var(--red)' }}>
              {formatTaka(ledgerBalance)}
            </span>
          </div>

          {/* BUY/SELL Pill Toggle */}
          <div className="tx-type-toggle" style={{ marginBottom: 20 }}>
            <button
              className={`tx-type-btn ${type === 'BUY' ? 'buy-active' : ''}`}
              onClick={() => setType('BUY')}
            >
              <TrendingUp size={16} /> কেনা
            </button>
            <button
              className={`tx-type-btn ${type === 'SELL' ? 'sell-active' : ''}`}
              onClick={() => setType('SELL')}
            >
              <TrendingDown size={16} /> বেচা
            </button>
          </div>

          {/* Exchange */}
          <div className="form-group">
            <label className="form-label">এক্সচেঞ্জ</label>
            <div className="exchange-toggle">
              {['DSE', 'CSE'].map(ex => (
                <button key={ex} className={`exchange-btn ${exchange === ex ? 'active' : ''}`}
                  onClick={() => { setExchange(ex); setStockName('') }}>
                  {ex}
                </button>
              ))}
            </div>
          </div>

          <div className="form-row">
            {/* Date */}
            <div className="form-group">
              <label className="form-label"><Calendar size={10} style={{ display: 'inline', marginRight: 3 }} />তারিখ</label>
              <input className="form-input" type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>

            {/* Stock Name */}
            <div className="form-group" style={{ position: 'relative' }}>
              <label className="form-label">স্টক কোড</label>
              <input className="form-input" placeholder="BRACBANK..."
                value={stockName}
                onChange={e => { setStockName(e.target.value.toUpperCase()); setShowSuggestions(true) }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} />
              {showSuggestions && stockName && filtered.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 'var(--radius-xs)', zIndex: 100, overflow: 'hidden', boxShadow: '0 12px 32px rgba(0,0,0,0.4)', marginTop: 4 }}>
                  {filtered.map(s => (
                    <div key={s.code} className="stock-suggestion-item"
                      onMouseDown={() => { setStockName(s.code); setShowSuggestions(false) }}>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{s.code}</div>
                      <div style={{ fontSize: 11, color: 'var(--text2)' }}>{s.name} · {s.sector}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Available shares info for SELL */}
          {type === 'SELL' && stockName && (
            <div style={{
              background: availableQty > 0 ? 'rgba(22,163,74,0.06)' : 'rgba(226,58,78,0.06)',
              border: `1px solid ${availableQty > 0 ? 'rgba(22,163,74,0.18)' : 'rgba(226,58,78,0.18)'}`,
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
              <label className="form-label">
                <Hash size={10} style={{ display: 'inline', marginRight: 3 }} />
                শেয়ার সংখ্যা {type === 'SELL' && availableQty > 0 && <span style={{ color: 'var(--accent)', fontSize: 10 }}>(সর্বোচ্চ {availableQty})</span>}
              </label>
              <input className="form-input" type="number" placeholder="50"
                value={quantity} onChange={e => setQuantity(e.target.value)}
                min="1" max={type === 'SELL' ? availableQty : undefined} />
            </div>
            <div className="form-group">
              <label className="form-label"><Coins size={10} style={{ display: 'inline', marginRight: 3 }} />{type === 'BUY' ? 'কেনার দাম' : 'বেচার দাম'} (৳)</label>
              <input className="form-input" type="number" placeholder="67.50"
                value={price} onChange={e => setPrice(e.target.value)} step="0.01" />
            </div>
          </div>

          {/* Total */}
          <div className={`tx-total-box ${type === 'BUY' ? 'buy' : 'sell'}`}>
            <span style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 600 }}>মোট {type === 'BUY' ? 'খরচ' : 'আয়'}</span>
            <span style={{ fontSize: 22, fontWeight: 800, color: type === 'BUY' ? 'var(--accent)' : 'var(--red)', letterSpacing: '-0.5px' }}>
              ৳{totalCost.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          {/* Insufficient funds warning */}
          {insufficientFunds && (
            <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(226,58,78,0.08)', borderRadius: 'var(--radius-xs)', border: '1px solid rgba(226,58,78,0.18)', fontSize: 12.5, color: 'var(--red)', fontWeight: 600 }}>
              ⚠️ লেডজারে পর্যাপ্ত টাকা নেই। আগে "লেডজার" থেকে ক্যাশ ইন করুন।
            </div>
          )}

          {error && (
            <div style={{ color: 'var(--red)', fontSize: 13, marginTop: 12, padding: '10px 14px', background: 'rgba(226,58,78,0.08)', borderRadius: 'var(--radius-xs)', border: '1px solid rgba(226,58,78,0.15)' }}>
              ⚠️ {error}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>বাতিল</button>
          <button className={`btn ${type === 'BUY' ? 'btn-primary' : ''}`}
            style={type === 'SELL' ? { background: 'var(--red)', color: '#fff' } : {}}
            onClick={handleSubmit} disabled={loading || insufficientFunds}>
            {loading ? '⏳ সংরক্ষণ হচ্ছে...' : `✅ ${type === 'BUY' ? 'কেনা' : 'বেচা'} যোগ করুন`}
          </button>
        </div>
      </div>
    </div>
  )
}
