import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Camera, Save, Lock, LogOut, Bell } from 'lucide-react'

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth()
  const [name, setName] = useState(profile?.full_name || '')
  const [dailyStack, setDailyStack] = useState(profile?.daily_stack || '')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const [oldPass, setOldPass] = useState('')
  const [newPass, setNewPass] = useState('')
  const [passMsg, setPassMsg] = useState('')
  const [passLoading, setPassLoading] = useState(false)

  const initials = (profile?.full_name || user?.email || '?').charAt(0).toUpperCase()

  async function saveProfile() {
    setSaving(true); setMsg('')
    const { error } = await supabase.from('profiles').update({
      full_name: name, daily_stack: Number(dailyStack)
    }).eq('id', user.id)
    if (!error) { await refreshProfile(); setMsg('✅ প্রোফাইল সংরক্ষিত হয়েছে!') }
    else setMsg('❌ সমস্যা হয়েছে: ' + error.message)
    setSaving(false)
  }

  async function uploadAvatar(e) {
    const file = e.target.files[0]
    if (!file) return
    const ext = file.name.split('.').pop()
    const path = `${user.id}/avatar.${ext}`
    const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (uploadError) { setMsg('❌ ছবি আপলোড হয়নি'); return }
    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    await supabase.from('profiles').update({ avatar_url: data.publicUrl }).eq('id', user.id)
    await refreshProfile()
    setMsg('✅ প্রোফাইল ছবি আপডেট হয়েছে!')
  }

  async function changePassword() {
    setPassLoading(true); setPassMsg('')
    const { error } = await supabase.auth.updateUser({ password: newPass })
    if (!error) setPassMsg('✅ পাসওয়ার্ড পরিবর্তন হয়েছে!')
    else setPassMsg('❌ ' + error.message)
    setPassLoading(false)
    setOldPass(''); setNewPass('')
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <div className="fade-up" style={{ maxWidth: 680, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800 }}>👤 প্রোফাইল</h2>
        <p style={{ color: 'var(--text2)', fontSize: 14 }}>আপনার একাউন্ট সেটিংস</p>
      </div>

      {/* Avatar */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="profile-header">
          <label htmlFor="avatar-upload" style={{ cursor: 'pointer' }}>
            <div className="profile-avatar">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : initials}
              <div className="avatar-overlay">
                <Camera size={20} color="#fff" />
              </div>
            </div>
          </label>
          <input id="avatar-upload" type="file" accept="image/*" style={{ display: 'none' }} onChange={uploadAvatar} />
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 800 }}>{profile?.full_name || 'নাম নেই'}</h3>
            <p style={{ color: 'var(--text2)', fontSize: 14 }}>{user?.email}</p>
            <p style={{ color: 'var(--text3)', fontSize: 12, marginTop: 4 }}>📷 ছবিতে ক্লিক করে পরিবর্তন করুন</p>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">পূর্ণ নাম</label>
          <input className="form-input" placeholder="আপনার নাম" value={name} onChange={e => setName(e.target.value)} />
        </div>

        <div className="form-group">
          <label className="form-label">
            <Bell size={12} style={{ display: 'inline', marginRight: 4 }} />
            দৈনিক বিনিয়োগ লক্ষ্যমাত্রা (৳) — Daily Stack
          </label>
          <input className="form-input" type="number" placeholder="যেমন: 10000" value={dailyStack} onChange={e => setDailyStack(e.target.value)} />
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>প্রতিদিন কত টাকা বিনিয়োগ করতে চান</div>
        </div>

        {msg && <div style={{ padding: '10px 14px', borderRadius: 8, background: msg.includes('✅') ? 'rgba(0,200,150,0.1)' : 'rgba(255,77,106,0.1)', color: msg.includes('✅') ? 'var(--green)' : 'var(--red)', fontSize: 13, marginBottom: 12 }}>{msg}</div>}

        <button className="btn btn-primary" onClick={saveProfile} disabled={saving}>
          <Save size={14} /> {saving ? 'সংরক্ষণ হচ্ছে...' : 'প্রোফাইল সংরক্ষণ করুন'}
        </button>
      </div>

      {/* Change Password */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ marginBottom: 16, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}><Lock size={16} /> পাসওয়ার্ড পরিবর্তন</h3>
        <div className="form-group">
          <label className="form-label">নতুন পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)</label>
          <input className="form-input" type="password" placeholder="নতুন পাসওয়ার্ড" value={newPass} onChange={e => setNewPass(e.target.value)} />
        </div>
        {passMsg && <div style={{ padding: '10px 14px', borderRadius: 8, background: passMsg.includes('✅') ? 'rgba(0,200,150,0.1)' : 'rgba(255,77,106,0.1)', color: passMsg.includes('✅') ? 'var(--green)' : 'var(--red)', fontSize: 13, marginBottom: 12 }}>{passMsg}</div>}
        <button className="btn btn-ghost" onClick={changePassword} disabled={passLoading || newPass.length < 6}>
          <Lock size={14} /> {passLoading ? 'পরিবর্তন হচ্ছে...' : 'পাসওয়ার্ড পরিবর্তন করুন'}
        </button>
      </div>

      {/* Account Info */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ marginBottom: 16, fontSize: 16 }}>একাউন্ট তথ্য</h3>
        {[
          { label: 'ইমেইল', value: user?.email },
          { label: 'একাউন্ট তৈরি', value: user?.created_at ? new Date(user.created_at).toLocaleDateString('bn-BD') : '-' },
          { label: 'দৈনিক Stack', value: profile?.daily_stack ? '৳' + Number(profile.daily_stack).toLocaleString() : 'সেট করা হয়নি' },
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < 2 ? '1px solid var(--border)' : 'none' }}>
            <span style={{ color: 'var(--text2)', fontSize: 14 }}>{item.label}</span>
            <span style={{ fontWeight: 600, fontSize: 14 }}>{item.value}</span>
          </div>
        ))}
      </div>

      {/* Sign Out */}
      <button className="btn btn-danger btn-full" onClick={signOut}>
        <LogOut size={14} /> লগআউট করুন
      </button>
    </div>
  )
}
