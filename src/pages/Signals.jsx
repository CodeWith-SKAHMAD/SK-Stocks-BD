import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { calculateFibLevels, formatTaka, DSE_STOCKS, CSE_STOCKS } from '../lib/utils'
import { Plus, Trash2, Zap } from 'lucide-react'

export default function Signals() {
  const [signals, setSignals] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    stock_name: '', exchange: 'DSE', current_price: '', high: '', low: '', note: ''
  })

  useEffect(() => { fetchSignals() }, [])

  async function fetchSignals() {
    const { data } = await supabase.from('signals').select('*').order('created_at', { ascending: false })
    setSignals(data || [])
    setLoading(false)
  }

  async function addSignal() {
    if (!form.stock_name || !form.high || !form.low) return
    const fib = calculateFibLevels(Number(form.high), Number(form.low))
    const { error } = await supabase.from('signals').insert({
      stock_name: form.stock_name,
      exchange: form.exchange,
      current_price: Number(form.current_price),
      fib_236: fib.fib236, fib_382: fib.fib382,
      fib_500: fib.fib500, fib_618: fib.fib618,
      fib_786: fib.fib786, note: form.note
    })
    if (!error) {
      setForm({ stock_name: '', exchange: 'DSE', current_price: '', high: '', low: '', note: '' })
      setShowForm(false)
      fetchSignals()
    }
  }

  async function deleteSignal(id) {
    await supabase.from('signals').delete().eq('id', id)
    fetchSignals()
  }

  function getSignalStatus(signal) {
    const price = Number(signal.current_price)
    if (!price) return null
    if (price <= signal.fib_618) return { label: 'শক্তিশালী Buy Zone', color: 'var(--green)', emoji: '🟢' }
    if (price <= signal.fib_500) return { label: 'Buy Zone', color: 'var(--accent)', emoji: '🔵' }
    if (price <= signal.fib_382) return { label: 'দেখুন', color: 'var(--yellow)', emoji: '🟡' }
    return { label: 'এখন কিনবেন না', color: 'var(--red)', emoji: '🔴' }
  }

  if (loading) return <div className="loading"><div className="spinner" /></div>

  return (
    <div className="fade-up">
      <div className="section-header" style={{ marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800 }}>⚡ সিগন্যাল</h2>
          <p style={{ color: 'var(--text2)', fontSize: 14 }}>Fibonacci ভিত্তিক Buy Entry সিগন্যাল</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <Plus size={14} /> নতুন সিগন্যাল
        </button>
      </div>

      {/* Info box */}
      <div style={{ background: 'rgba(0,153,255,0.08)', border: '1px solid rgba(0,153,255,0.2)', borderRadius: 'var(--radius)', padding: 16, marginBottom: 20, fontSize: 13, color: 'var(--text2)' }}>
        <strong style={{ color: 'var(--accent2)' }}>📌 কিভাবে কাজ করে?</strong> DSE থেকে স্টকের সর্বোচ্চ (High) ও সর্বনিম্ন (Low) দাম দিন। অ্যাপ Fibonacci retracement level হিসাব করবে। 61.8% লেভেলে সাধারণত ভালো buy entry পাওয়া যায়। বর্তমান দাম দিলে আপনার সিগন্যাল স্ট্যাটাস দেখাবে।
      </div>

      {/* Add Signal Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ marginBottom: 16, fontSize: 16 }}>নতুন সিগন্যাল যোগ করুন</h3>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">স্টক কোড</label>
              <input className="form-input" placeholder="যেমন: GRAMEENPHONE" value={form.stock_name} onChange={e => setForm({ ...form, stock_name: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">এক্সচেঞ্জ</label>
              <select className="form-select" value={form.exchange} onChange={e => setForm({ ...form, exchange: e.target.value })}>
                <option value="DSE">DSE</option>
                <option value="CSE">CSE</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">সর্বোচ্চ দাম / High (৳)</label>
              <input className="form-input" type="number" placeholder="যেমন: 500" value={form.high} onChange={e => setForm({ ...form, high: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">সর্বনিম্ন দাম / Low (৳)</label>
              <input className="form-input" type="number" placeholder="যেমন: 300" value={form.low} onChange={e => setForm({ ...form, low: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">বর্তমান দাম (৳) — ঐচ্ছিক</label>
            <input className="form-input" type="number" placeholder="যেমন: 380" value={form.current_price} onChange={e => setForm({ ...form, current_price: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">নোট — ঐচ্ছিক</label>
            <input className="form-input" placeholder="যেমন: সাপোর্টে আসলে কিনবো" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-primary" onClick={addSignal}><Zap size={14} /> সিগন্যাল সংরক্ষণ</button>
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>বাতিল</button>
          </div>
        </div>
      )}

      {/* Signal Cards */}
      {signals.length === 0 ? (
        <div className="card empty">
          <Zap size={40} />
          <h3>কোনো সিগন্যাল নেই</h3>
          <p>উপরে "নতুন সিগন্যাল" বাটন চাপুন</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {signals.map(s => {
            const status = getSignalStatus(s)
            return (
              <div key={s.id} className="signal-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <h3 style={{ fontSize: 18, fontWeight: 800 }}>{s.stock_name}</h3>
                      <span className={`badge badge-${s.exchange?.toLowerCase()}`}>{s.exchange}</span>
                      {status && <span style={{ fontSize: 13, fontWeight: 700, color: status.color }}>{status.emoji} {status.label}</span>}
                    </div>
                    {s.current_price && <div style={{ fontSize: 14, color: 'var(--text2)', marginTop: 4 }}>বর্তমান দাম: <strong style={{ color: 'var(--text)' }}>{formatTaka(s.current_price)}</strong></div>}
                    {s.note && <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>📝 {s.note}</div>}
                  </div>
                  <button className="btn btn-danger btn-sm" onClick={() => deleteSignal(s.id)}><Trash2 size={12} /></button>
                </div>

                <div className="fib-levels">
                  {[
                    { label: 'FIB 23.6%', value: s.fib_236, strong: false },
                    { label: 'FIB 38.2%', value: s.fib_382, strong: false },
                    { label: 'FIB 50%', value: s.fib_500, strong: false },
                    { label: 'FIB 61.8% ⭐', value: s.fib_618, strong: true },
                    { label: 'FIB 78.6%', value: s.fib_786, strong: true },
                  ].map((f, i) => (
                    <div key={i} className={`fib-level ${f.strong ? 'buy' : ''}`}>
                      <div style={{ fontSize: 10, opacity: 0.7 }}>{f.label}</div>
                      <div style={{ fontWeight: 800 }}>{formatTaka(f.value)}</div>
                      {s.current_price && Number(s.current_price) <= f.value && (
                        <div style={{ fontSize: 9, color: 'var(--green)' }}>✓ এখন Buy Zone</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
