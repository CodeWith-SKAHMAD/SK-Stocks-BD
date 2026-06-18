import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, X, Trash2, Edit2, Image as ImageIcon, StickyNote } from 'lucide-react'

export default function Notes() {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [existingImageUrl, setExistingImageUrl] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchNotes()
    const channel = supabase
      .channel('notes-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notes' }, () => fetchNotes())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  async function fetchNotes() {
    const { data } = await supabase.from('notes').select('*').order('created_at', { ascending: false })
    setNotes(data || [])
    setLoading(false)
  }

  function openNew() {
    setEditingId(null); setTitle(''); setContent(''); setImageFile(null); setImagePreview(null); setExistingImageUrl(null)
    setShowModal(true)
  }

  function openEdit(note) {
    setEditingId(note.id); setTitle(note.title || ''); setContent(note.content || '')
    setImageFile(null); setImagePreview(null); setExistingImageUrl(note.image_url)
    setShowModal(true)
  }

  function handleImageSelect(e) {
    const file = e.target.files[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  async function handleSave() {
    if (!title.trim() && !content.trim()) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    let imageUrl = existingImageUrl
    if (imageFile) {
      const ext = imageFile.name.split('.').pop()
      const path = `${user.id}/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('note-images').upload(path, imageFile)
      if (!upErr) {
        const { data } = supabase.storage.from('note-images').getPublicUrl(path)
        imageUrl = data.publicUrl
      }
    }

    if (editingId) {
      await supabase.from('notes').update({
        title, content, image_url: imageUrl, updated_at: new Date().toISOString()
      }).eq('id', editingId)
    } else {
      await supabase.from('notes').insert({
        user_id: user.id, title, content, image_url: imageUrl
      })
    }
    setSaving(false)
    setShowModal(false)
    fetchNotes()
  }

  async function deleteNote(id) {
    if (!confirm('এই নোট মুছে ফেলবেন?')) return
    await supabase.from('notes').delete().eq('id', id)
    fetchNotes()
  }

  if (loading) return <div className="loading"><div className="spinner" /></div>

  return (
    <div className="fade-up">
      <div className="section-header" style={{ marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px' }}>📝 আমার নোট</h2>
          <p style={{ color: 'var(--text2)', fontSize: 13.5, marginTop: 3 }}>বিনিয়োগ পরিকল্পনা ও ভাবনা লিখে রাখুন</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>
          <Plus size={14} /> নতুন নোট
        </button>
      </div>

      {notes.length === 0 ? (
        <div className="card empty">
          <StickyNote size={40} />
          <h3>কোনো নোট নেই</h3>
          <p>"নতুন নোট" চাপুন এবং আপনার পরিকল্পনা লিখুন</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {notes.map(note => (
            <div key={note.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              {note.image_url && (
                <img src={note.image_url} alt="" style={{ width: '100%', height: 150, objectFit: 'cover', borderRadius: 10, marginBottom: 12 }} />
              )}
              {note.title && <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{note.title}</div>}
              {note.content && (
                <div style={{ fontSize: 13, color: 'var(--text2)', whiteSpace: 'pre-wrap', flex: 1, marginBottom: 12, lineHeight: 1.5 }}>
                  {note.content}
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                  {new Date(note.created_at).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' })}
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => openEdit(note)}><Edit2 size={11} /></button>
                  <button className="btn btn-danger btn-sm" onClick={() => deleteNote(note.id)}><Trash2 size={11} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal fade-up">
            <div className="modal-header">
              <h3 style={{ fontSize: 17, fontWeight: 800 }}>{editingId ? 'নোট সম্পাদনা' : 'নতুন নোট'}</h3>
              <button className="icon-btn" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">শিরোনাম</label>
                <input className="form-input" placeholder="যেমন: Q3 বিনিয়োগ পরিকল্পনা" value={title} onChange={e => setTitle(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">বিস্তারিত</label>
                <textarea
                  className="form-input"
                  placeholder="আপনার পরিকল্পনা, ভাবনা লিখুন..."
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  rows={6}
                  style={{ resize: 'vertical', fontFamily: 'var(--font)' }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">ছবি (ঐচ্ছিক)</label>
                {(imagePreview || existingImageUrl) ? (
                  <div style={{ position: 'relative', marginBottom: 8 }}>
                    <img src={imagePreview || existingImageUrl} alt="" style={{ width: '100%', maxHeight: 180, objectFit: 'cover', borderRadius: 10 }} />
                    <button
                      onClick={() => { setImageFile(null); setImagePreview(null); setExistingImageUrl(null) }}
                      style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: 6, color: '#fff', padding: 6, cursor: 'pointer' }}
                    ><X size={14} /></button>
                  </div>
                ) : (
                  <label className="btn btn-ghost btn-full" style={{ cursor: 'pointer', justifyContent: 'center' }}>
                    <ImageIcon size={14} /> ছবি যুক্ত করুন
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageSelect} />
                  </label>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>বাতিল</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? '⏳ সংরক্ষণ হচ্ছে...' : '✅ সংরক্ষণ করুন'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
