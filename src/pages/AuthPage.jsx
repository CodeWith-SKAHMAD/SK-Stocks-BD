import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function AuthPage() {
  const [tab, setTab] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  async function handleSignup(e) {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name } }
    })
    if (error) setError(error.message)
    else setMsg('✅ একাউন্ট তৈরি হয়েছে! Email যাচাই করুন।')
    setLoading(false)
  }

  return (
    <div className="auth-page">
      <div className="auth-bg" />
      <div className="auth-card fade-up">
        <div className="auth-logo">
          <h1>📈 BD Stock</h1>
          <p>বাংলাদেশ স্টক ইনভেস্টমেন্ট ট্র্যাকার</p>
        </div>

        <div className="tabs" style={{marginBottom: 24}}>
          <button className={`tab ${tab==='login'?'active':''}`} onClick={()=>setTab('login')}>লগইন</button>
          <button className={`tab ${tab==='signup'?'active':''}`} onClick={()=>setTab('signup')}>একাউন্ট খুলুন</button>
        </div>

        {error && <div style={{background:'rgba(255,77,106,0.1)',border:'1px solid rgba(255,77,106,0.3)',borderRadius:8,padding:'10px 14px',fontSize:13,color:'var(--red)',marginBottom:16}}>{error}</div>}
        {msg && <div style={{background:'rgba(0,200,150,0.1)',border:'1px solid rgba(0,200,150,0.3)',borderRadius:8,padding:'10px 14px',fontSize:13,color:'var(--green)',marginBottom:16}}>{msg}</div>}

        {tab === 'login' ? (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">ইমেইল</label>
              <input className="form-input" type="email" placeholder="your@email.com" value={email} onChange={e=>setEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">পাসওয়ার্ড</label>
              <input className="form-input" type="password" placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)} required />
            </div>
            <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
              {loading ? '⏳ লগইন হচ্ছে...' : '🔑 লগইন করুন'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignup}>
            <div className="form-group">
              <label className="form-label">আপনার নাম</label>
              <input className="form-input" type="text" placeholder="যেমন: রাহিম সাহেব" value={name} onChange={e=>setName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">ইমেইল</label>
              <input className="form-input" type="email" placeholder="your@email.com" value={email} onChange={e=>setEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)</label>
              <input className="form-input" type="password" placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)} required />
            </div>
            <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
              {loading ? '⏳ তৈরি হচ্ছে...' : '✨ একাউন্ট খুলুন'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
