import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { getLedgerSummary } from '../lib/ledger'
import { formatTaka } from '../lib/utils'
import { Plus, X, Trash2, Edit2, Wallet, ArrowDownCircle, ArrowUpCircle, Receipt, Image as ImageIcon, TrendingUp, TrendingDown } from 'lucide-react'

export default function Ledger() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [type, setType] = useState('CASH_IN')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [receiptFile, setReceiptFile] = useState(null)
  const [receiptPreview, setReceiptPreview] = useState(null)
  const [existingReceiptUrl, setExistingReceiptUrl] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('ALL')

  useEffect(() => {
    fetchEntries()
    const channel = supabase
      .channel('ledger-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ledger' }, () => fetchEntries())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  async function fetchEntries() {
    const { data } = await supabase.from('ledger').select('*').order('date', { ascending: false }).order('created_at', { ascending: false })
    setEntries(data || [])
    setLoading(false)
  }

  function openNew(t) {
    setEditingId(null)
    setType(t); setAmount(''); setNote(''); setDate(new Date().toISOString().split('T')[0])
    setReceiptFile(null); setReceiptPreview(null); setExistingReceiptUrl(null); setError('')
    setShowModal(true)
  }

  function openEdit(entry) {
    setEditingId(entry.id)
    setType(entry.type); setAmount(String(entry.amount)); setNote(entry.note || '')
    setDate(entry.date)
    setReceiptFile(null); setReceiptPreview(null); setExistingReceiptUrl(entry.receipt_url)
    setError('')
    setShowModal(true)
  }

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

    let receiptUrl = existingReceiptUrl
    if (receiptFile) {
      const ext = receiptFile.name.split('.').pop()
      const path = `${user.id}/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('receipts').upload(path, receiptFile)
      if (!upErr) {
        const { data } = supabase.storage.from('receipts').getPublicUrl(path)
        receiptUrl = data.publicUrl
      }
    }

    if (editingId) {
      const { error: err } = await supabase.from('ledger').update({
        type, amount: Number(amount), note, date, receipt_url: receiptUrl
      }).eq('id', editingId)
      if (err) { setError(err.message); setSaving(false); return }
    } else {
      const { error: err } = await supabase.from('ledger').insert({
        user_id: user.id, type, amount: Number(amount), note, date,
        receipt_url: receiptUrl
      })
      if (err) { setError(err.message); setSaving(false); return }
    }

    setShowModal(false)
    fetchEntries()
    setSaving(false)
  }

  async function deleteEntry(id, entryType) {
    if (entryType === 'STOCK_BUY' || entryType === 'STOCK_SELL') {
      alert('স্টক ট্রানজেকশন থেকে তৈরি এন্ট্রি এখান থেকে মুছবেন না। Portfolio থেকে ট্রানজেকশন মুছুন।')
      return
    }
    if (!confirm('এই এন্ট্রি মুছে ফেলবেন?')) return
    await supabase.from('ledger').delete().eq('id', id)
    fetchEntries()
  }

  const { totalCashIn, totalCashOut, totalStockBuy, totalStockSell, balance } = getLedgerSummary(entries)

  const filtered = filter === 'ALL' ? entries : entries.filter(e => e.type === filter)

  const typeLabels = {
    CASH_IN: { label: '💰 ক্যাশ ইন', color: 'var(--green)', badge: 'badge-buy' },
    CASH_OUT: { label: '💸 ক্যাশ আউট', color: 'var(--red)', badge: 'badge-sell' },
    STOCK_BUY: { label: '📈 স্টক কেনা', color: 'var(--accent2)', badge: 'badge-dse' },
    STOCK_SELL: { label: '📉 স্টক বেচা', color: 'var(--yellow)', badge: 'badge-cse' },
  }

  if (loading) return <div className="loading"><div className="spinner" /></div>

  return (
    <div className="fade-up">
      <div className="section-header" style={{ marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px' }}>📒 লেডজার</h2>
          <p style={{ color: 'var(--text2)', fontSize: 13.5, marginTop: 3 }}>ব্রোকার অ্যাকাউন্টের টাকার হিসাব</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-buy" onClick={() => openNew('CASH_IN')}>
            <ArrowDownCircle size={14} /> ক্যাশ ইন
          </button>
          <button className="btn btn-sell" onClick={() => openNew('CASH_OUT')}>
            <ArrowUpCircle size={14} /> ক্যাশ আউট
          </button>
        </div>
      </div>

      {/* Balance Hero Card */}
      <div className="card" style={{ marginBottom: 20, textAlign: 'center', padding: 28, background: 'linear-gradient(135deg, var(--glow-g), var(--glow-b))' }}>
        <div style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>
          <Wallet size={14} style={{ display: 'inline', marginRight: 6 }} />
          ব্রোকার অ্যাকাউন্টে এভেইলেবল ব্যালেন্স
        </div>
        <div style={{ fontSize: 38, fontWeight: 800, color: balance >= 0 ? 'var(--text)' : 'var(--red)', letterSpacing: '-1px' }}>
          {formatTaka(balance)}
        </div>
        {balance <= 0 && (
          <div style={{ fontSize: 12, color: 'var(--red)', marginTop: 8, fontWeight: 600 }}>
            ⚠️ ব্যালেন্স কম — নতুন স্টক কিনতে চাইলে আগে টাকা ঢোকান
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="stat-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card green">
          <div className="stat-label">মোট ক্যাশ ইন</div>
          <div className="stat-value">{formatTaka(totalCashIn)}</div>
          <div className="stat-sub"><TrendingUp size={12} /> {entries.filter(e=>e.type==='CASH_IN').length}টি এন্ট্রি</div>
        </div>
        <div className="stat-card red">
          <div className="stat-label">মোট ক্যাশ আউট</div>
          <div className="stat-value">{formatTaka(totalCashOut)}</div>
          <div className="stat-sub"><TrendingDown size={12} /> {entries.filter(e=>e.type==='CASH_OUT').length}টি এন্ট্রি</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-label">স্টকে বিনিয়োগ</div>
          <div className="stat-value">{formatTaka(totalStockBuy)}</div>
        </div>
        <div className="stat-card yellow">
          <div className="stat-label">স্টক থেকে আয়</div>
          <div className="stat-value">{formatTaka(totalStockSell)}</div>
        </div>
      </div>

      {/* Filter */}
      <div className="filter-bar">
        {['ALL', 'CASH_IN', 'CASH_OUT', 'STOCK_BUY', 'STOCK_SELL'].map(t => (
          <button key={t} className={`period-tab ${filter === t ? 'active' : ''}`} onClick={() => setFilter(t)}>
            {t === 'ALL' ? 'সব' : typeLabels[t].label}
          </button>
        ))}
      </div>

      {/* Entries Table */}
      <div className="card">
        <div className="section-title" style={{ marginBottom: 14 }}>লেনদেনের ইতিহাস ({filtered.length}টি)</div>
        {filtered.length === 0 ? (
          <div className="empty">
            <Wallet size={36} />
            <h3>কোনো এন্ট্রি নেই</h3>
            <p>"ক্যাশ ইন" চেপে টাকা যোগ করুন</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>তারিখ</th><th>ধরন</th><th>পরিমাণ</th><th>নোট</th><th>রিসিট</th><th>কাজ</th></tr></thead>
              <tbody>
                {filtered.map(e => (
                  <tr key={e.id}>
                    <td style={{ color: 'var(--text2)', fontSize: 13 }}>{e.date}</td>
                    <td><span className={`badge ${typeLabels[e.type]?.badge}`}>{typeLabels[e.type]?.label}</span></td>
                    <td style={{ fontWeight: 700, color: typeLabels[e.type]?.color }}>
                      {(e.type === 'CASH_IN' || e.type === 'STOCK_SELL') ? '+' : '-'}{formatTaka(e.amount)}
                    </td>
                    <td style={{ fontSize: 12.5, color: 'var(--text2)' }}>{e.note || e.related_stock || '—'}</td>
                    <td>
                      {e.receipt_url ? (
                        <a href={e.receipt_url} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">
                          <Receipt size={11} /> দেখুন
                        </a>
                      ) : <span style={{ color: 'var(--text3)', fontSize: 11 }}>—</span>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 5 }}>
                        {(e.type === 'CASH_IN' || e.type === 'CASH_OUT') && (
                          <button className="btn btn-ghost btn-sm" onClick={() => openEdit(e)}><Edit2 size={11} /></button>
                        )}
                        <button className="btn btn-danger btn-sm" onClick={() => deleteEntry(e.id, e.type)}><Trash2 size={11} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Entry Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3 style={{ fontSize: 17, fontWeight: 800 }}>
                {editingId ? '✏️ এন্ট্রি সম্পাদনা' : (type === 'CASH_IN' ? '💰 ক্যাশ ইন করুন' : '💸 ক্যাশ আউট করুন')}
              </h3>
              <button className="icon-btn" onClick={() => setShowModal(false)}><X size={16} /></button>
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
                {(receiptPreview || existingReceiptUrl) ? (
                  <div style={{ position: 'relative' }}>
                    <img src={receiptPreview || existingReceiptUrl} alt="" style={{ width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 10 }} />
                    <button onClick={() => { setReceiptFile(null); setReceiptPreview(null); setExistingReceiptUrl(null) }}
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
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>বাতিল</button>
              <button className={type === 'CASH_IN' ? 'btn btn-primary' : 'btn'} style={type === 'CASH_OUT' ? { background: 'var(--red)', color: '#fff' } : {}} onClick={handleSave} disabled={saving}>
                {saving ? '⏳ সংরক্ষণ হচ্ছে...' : (editingId ? '✅ আপডেট করুন' : '✅ সংরক্ষণ করুন')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
