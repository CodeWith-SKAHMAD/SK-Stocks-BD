import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { X, ArrowDownCircle, ArrowUpCircle, Image as ImageIcon } from 'lucide-react'

export default function LedgerEntryModal({ initialType = 'CASH_IN', onClose, onSaved }) {
  const [type, setType] = useState(initialType)
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [receiptFile, setReceiptFile] = useState(null)
  const [receiptPreview, setReceiptPreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function handleReceiptSelect(e) {
    const file = e.target.files[0]
    if (!file) return
    setReceiptFile(file)
    setReceiptPreview(URL.createObjectURL(file))
  }

  async function handleSave() {
    if (!amount || Number(amount) <= 0) { setError('সঠিক পরিমাণ লিখুন'); return }
    setSaving(true); setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('লগইন করুন'); setSaving(false); return }

    let receiptUrl = null
    if (receiptFile) {
      const ext = receiptFile.name.split('.').pop()
      const path = `${user.id}/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('receipts').upload(path, receiptFile)
      if (!upErr) {
        const { data } = supabase.storage.from('receipts').getPublicUrl(path)
        receiptUrl = data.publicUrl
      }
    }

    const { error: err } = await supabase.from('ledger').insert({
      user_id: user.id, type, amount: Number(amount), note, date,
      receipt_url: receiptUrl
    })
    if (err) { setError(err.message); setSaving(false); return }

    setSaving(false)
    if (onSaved) onSaved()
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3 style={{ fontSize: 17, fontWeight: 800 }}>
            {type === 'CASH_IN' ? '💰 ক্যাশ ইন করুন' : '💸 ক্যাশ আউট করুন'}
          </h3>
          <button className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          <div className="tx-type-toggle" style={{ marginBottom: 18 }}>
            <button className={`tx-type-btn ${type === 'CASH_IN' ? 'buy-active' : ''}`} onClick={() => setType('CASH_IN')}>
              <ArrowDownCircle size={15} /> ক্যাশ ইন
            </button>
            <button className={`tx-type-btn ${type === 'CASH_OUT' ? 'sell-active' : ''}`} onClick={() => setType('CASH_OUT')}>
              <ArrowUpCircle size={15} /> ক্যাশ আউট
            </button>
          </div>

          <div className="form-group">
            <label className="form-label">তারিখ</label>
            <input className="form-input" type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">পরিমাণ (৳)</label>
            <input className="form-input" type="number" placeholder="যেমন: 10000" value={amount} onChange={e => setAmount(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">নোট (ঐচ্ছিক)</label>
            <input className="form-input" placeholder="যেমন: ব্যাংক থেকে জমা" value={note} onChange={e => setNote(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">মানি রিসিট (ঐচ্ছিক)</label>
            {receiptPreview ? (
              <div style={{ position: 'relative' }}>
                <img src={receiptPreview} alt="" style={{ width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 10 }} />
                <button onClick={() => { setReceiptFile(null); setReceiptPreview(null) }}
                  style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: 6, color: '#fff', padding: 6, cursor: 'pointer' }}>
                  <X size={14} />
                </button>
              </div>
            ) : (
              <label className="btn btn-ghost btn-full" style={{ cursor: 'pointer', justifyContent: 'center' }}>
                <ImageIcon size={14} /> রিসিট ছবি যুক্ত করুন
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleReceiptSelect} />
              </label>
            )}
          </div>

          {error && <div style={{ color: 'var(--red)', fontSize: 13, padding: '10px 14px', background: 'rgba(226,58,78,0.08)', borderRadius: 8 }}>⚠️ {error}</div>}
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>বাতিল</button>
          <button className={type === 'CASH_IN' ? 'btn btn-primary' : 'btn'} style={type === 'CASH_OUT' ? { background: 'var(--red)', color: '#fff' } : {}} onClick={handleSave} disabled={saving}>
            {saving ? '⏳ সংরক্ষণ হচ্ছে...' : '✅ সংরক্ষণ করুন'}
          </button>
        </div>
      </div>
    </div>
  )
}
