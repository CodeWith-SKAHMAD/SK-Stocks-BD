import { useState } from 'react'
import { calculateFibLevels, formatTaka } from '../lib/utils'
import { Calculator, TrendingUp, Delete } from 'lucide-react'

export default function CalculatorPage() {
  const [calcTab, setCalcTab] = useState('general')

  return (
    <div className="fade-up">
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px' }}>🧮 ক্যালকুলেটর</h2>
        <p style={{ color: 'var(--text2)', fontSize: '13.5px', marginTop: 3 }}>সব ধরনের হিসাব এক জায়গায়</p>
      </div>

      <div className="tabs">
        <button className={`tab ${calcTab === 'general' ? 'active' : ''}`} onClick={() => setCalcTab('general')}>🔢 সাধারণ</button>
        <button className={`tab ${calcTab === 'profit' ? 'active' : ''}`} onClick={() => setCalcTab('profit')}>💰 লাভ/ক্ষতি</button>
        <button className={`tab ${calcTab === 'fib' ? 'active' : ''}`} onClick={() => setCalcTab('fib')}>📐 Fibonacci</button>
        <button className={`tab ${calcTab === 'breakeven' ? 'active' : ''}`} onClick={() => setCalcTab('breakeven')}>⚖️ Break-Even</button>
      </div>

      {calcTab === 'general' && <GeneralCalc />}
      {calcTab === 'profit' && <ProfitCalc />}
      {calcTab === 'fib' && <FibCalc />}
      {calcTab === 'breakeven' && <BreakevenCalc />}
    </div>
  )
}

function GeneralCalc() {
  const [display, setDisplay] = useState('0')
  const [prev, setPrev] = useState(null)
  const [op, setOp] = useState(null)
  const [reset, setReset] = useState(false)
  const [history, setHistory] = useState([])

  function press(val) {
    if (display === '0' || reset) { setDisplay(String(val)); setReset(false) }
    else if (display.length < 12) setDisplay(display + val)
  }

  function pressOp(o) {
    setPrev(parseFloat(display)); setOp(o); setReset(true)
  }

  function pressEqual() {
    if (prev === null || op === null) return
    const cur = parseFloat(display)
    let res
    if (op === '+') res = prev + cur
    else if (op === '-') res = prev - cur
    else if (op === '×') res = prev * cur
    else if (op === '÷') res = cur !== 0 ? prev / cur : 'Error'
    else if (op === '%') res = prev % cur
    const resultStr = typeof res === 'number' ? parseFloat(res.toFixed(8)).toString() : res
    setHistory(h => [`${prev} ${op} ${cur} = ${resultStr}`, ...h].slice(0, 5))
    setDisplay(resultStr)
    setPrev(null); setOp(null); setReset(true)
  }

  function pressDecimal() {
    if (reset) { setDisplay('0.'); setReset(false); return }
    if (!display.includes('.')) setDisplay(display + '.')
  }

  function pressSign() { setDisplay(String(parseFloat(display) * -1)) }
  function pressPercent() { setDisplay(String(parseFloat(display) / 100)) }
  function pressClear() { setDisplay('0'); setPrev(null); setOp(null); setReset(false) }
  function pressBackspace() {
    if (display.length > 1) setDisplay(display.slice(0, -1))
    else setDisplay('0')
  }

  const btn = (label, onClick, style = {}) => (
    <button onClick={onClick} style={{
      padding: '16px', borderRadius: 10, border: 'none', cursor: 'pointer',
      fontSize: 18, fontWeight: 600, transition: 'all 0.1s', fontFamily: 'var(--font-body)',
      ...style
    }}>{label}</button>
  )

  const numStyle = { background: 'var(--bg3)', color: 'var(--text)' }
  const opStyle = { background: 'rgba(59,130,246,0.15)', color: 'var(--accent2)' }
  const eqStyle = { background: 'linear-gradient(135deg, var(--accent), var(--accent2))', color: '#fff' }
  const fnStyle = { background: 'var(--card2)', color: 'var(--text2)', fontSize: 14 }

  return (
    <div style={{ maxWidth: 360, margin: '0 auto' }}>
      <div className="card" style={{ marginBottom: 14 }}>
        {op && prev !== null && (
          <div style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'right', marginBottom: 4 }}>
            {prev} {op}
          </div>
        )}
        <div style={{ fontSize: 36, fontWeight: 800, textAlign: 'right', letterSpacing: '-1px', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {display}
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {btn('AC', pressClear, fnStyle)}
          {btn('+/-', pressSign, fnStyle)}
          {btn('%', pressPercent, fnStyle)}
          {btn('÷', () => pressOp('÷'), opStyle)}
          {btn('7', () => press(7), numStyle)}
          {btn('8', () => press(8), numStyle)}
          {btn('9', () => press(9), numStyle)}
          {btn('×', () => pressOp('×'), opStyle)}
          {btn('4', () => press(4), numStyle)}
          {btn('5', () => press(5), numStyle)}
          {btn('6', () => press(6), numStyle)}
          {btn('-', () => pressOp('-'), opStyle)}
          {btn('1', () => press(1), numStyle)}
          {btn('2', () => press(2), numStyle)}
          {btn('3', () => press(3), numStyle)}
          {btn('+', () => pressOp('+'), opStyle)}
          {btn('⌫', pressBackspace, fnStyle)}
          {btn('0', () => press(0), numStyle)}
          {btn('.', pressDecimal, numStyle)}
          {btn('=', pressEqual, eqStyle)}
        </div>
      </div>

      {history.length > 0 && (
        <div className="card" style={{ marginTop: 14 }}>
          <div style={{ fontSize: 11.5, color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 10 }}>ইতিহাস</div>
          {history.map((h, i) => (
            <div key={i} style={{ fontSize: 13, color: 'var(--text2)', padding: '5px 0', borderBottom: i < history.length - 1 ? '1px solid var(--border)' : 'none' }}>{h}</div>
          ))}
        </div>
      )}
    </div>
  )
}

function ProfitCalc() {
  const [buyPrice, setBuyPrice] = useState('')
  const [sellPrice, setSellPrice] = useState('')
  const [qty, setQty] = useState('')
  const [commission, setCommission] = useState('0.5')

  function calcProfit() {
    if (!buyPrice || !sellPrice || !qty) return null
    const buy = Number(buyPrice) * Number(qty)
    const sell = Number(sellPrice) * Number(qty)
    const commRate = Number(commission) / 100
    const buyComm = buy * commRate; const sellComm = sell * commRate
    const netBuy = buy + buyComm; const netSell = sell - sellComm
    const pl = netSell - netBuy; const plPct = (pl / netBuy) * 100
    return { pl, plPct, netBuy, netSell, buyComm, sellComm }
  }

  const r = calcProfit()

  return (
    <div className="calc-grid">
      <div className="card">
        <h3 style={{ marginBottom: 16, fontSize: 15, fontWeight: 700 }}>ইনপুট দিন</h3>
        <div className="form-group"><label className="form-label">কেনার দাম (৳)</label><input className="form-input" type="number" placeholder="যেমন: 350" value={buyPrice} onChange={e => setBuyPrice(e.target.value)} /></div>
        <div className="form-group"><label className="form-label">বেচার দাম (৳)</label><input className="form-input" type="number" placeholder="যেমন: 420" value={sellPrice} onChange={e => setSellPrice(e.target.value)} /></div>
        <div className="form-group"><label className="form-label">শেয়ার সংখ্যা</label><input className="form-input" type="number" placeholder="যেমন: 100" value={qty} onChange={e => setQty(e.target.value)} /></div>
        <div className="form-group"><label className="form-label">কমিশন (%)</label><input className="form-input" type="number" placeholder="0.5" value={commission} onChange={e => setCommission(e.target.value)} step="0.1" /></div>
      </div>
      <div>
        {r ? (
          <div className="card">
            <h3 style={{ marginBottom: 14, fontSize: 15, fontWeight: 700 }}>ফলাফল</h3>
            <div className="calc-result" style={{ marginBottom: 14, background: r.pl >= 0 ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', borderColor: r.pl >= 0 ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)' }}>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 5 }}>মোট লাভ/ক্ষতি</div>
              <div className={`result-value ${r.pl >= 0 ? 'profit' : 'loss'}`}>{r.pl >= 0 ? '+' : ''}{formatTaka(r.pl)}</div>
              <div style={{ fontSize: 14, marginTop: 5, fontWeight: 700, color: r.pl >= 0 ? 'var(--green)' : 'var(--red)' }}>({r.plPct >= 0 ? '+' : ''}{r.plPct.toFixed(2)}%)</div>
            </div>
            {[['মোট কেনার খরচ', formatTaka(r.netBuy)], ['মোট বিক্রয় আয়', formatTaka(r.netSell)], ['কেনার কমিশন', formatTaka(r.buyComm)], ['বেচার কমিশন', formatTaka(r.sellComm)]].map(([l, v], i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border)', fontSize: 13.5 }}>
                <span style={{ color: 'var(--text2)' }}>{l}</span><span style={{ fontWeight: 600 }}>{v}</span>
              </div>
            ))}
          </div>
        ) : <div className="card empty" style={{ height: '100%' }}><Calculator size={36} /><h3>তথ্য দিন</h3></div>}
      </div>
    </div>
  )
}

function FibCalc() {
  const [high, setHigh] = useState('')
  const [low, setLow] = useState('')
  const [fibResult, setFibResult] = useState(null)

  return (
    <div className="calc-grid">
      <div className="card">
        <h3 style={{ marginBottom: 8, fontSize: 15, fontWeight: 700 }}>Fibonacci Retracement</h3>
        <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 18 }}>High ও Low দিলে support/resistance level বের হবে।</p>
        <div className="form-group"><label className="form-label">সর্বোচ্চ দাম (৳)</label><input className="form-input" type="number" placeholder="যেমন: 500" value={high} onChange={e => setHigh(e.target.value)} /></div>
        <div className="form-group"><label className="form-label">সর্বনিম্ন দাম (৳)</label><input className="form-input" type="number" placeholder="যেমন: 300" value={low} onChange={e => setLow(e.target.value)} /></div>
        <button className="btn btn-primary btn-full" onClick={() => { if (high && low && Number(high) > Number(low)) setFibResult(calculateFibLevels(Number(high), Number(low))) }}>📐 হিসাব করুন</button>
      </div>
      <div className="card">
        {fibResult ? (
          <>
            <h3 style={{ marginBottom: 14, fontSize: 15, fontWeight: 700 }}>Fibonacci Levels</h3>
            {[['0% (Low)', fibResult.fib0, 'নিচের সীমা', 'var(--red)'],['23.6%', fibResult.fib236, 'দুর্বল সাপোর্ট', 'var(--yellow)'],['38.2%', fibResult.fib382, 'মাঝারি সাপোর্ট', 'var(--accent2)'],['50%', fibResult.fib500, 'গুরুত্বপূর্ণ সাপোর্ট', 'var(--accent)'],['61.8% ⭐', fibResult.fib618, 'Golden Ratio', 'var(--green)'],['78.6%', fibResult.fib786, 'শক্তিশালী সাপোর্ট', 'var(--green)'],['100% (High)', fibResult.fib100, 'উপরের সীমা', 'var(--text2)']].map(([l, v, d, c], i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
                <div><div style={{ fontSize: 13, fontWeight: 700, color: c }}>{l}</div><div style={{ fontSize: 11, color: 'var(--text3)' }}>{d}</div></div>
                <div style={{ fontSize: 15, fontWeight: 800, color: c }}>৳{v}</div>
              </div>
            ))}
          </>
        ) : <div className="empty" style={{ height: '100%' }}><TrendingUp size={36} /><h3>High ও Low দিন</h3></div>}
      </div>
    </div>
  )
}

function BreakevenCalc() {
  const [buyPrice, setBuyPrice] = useState('')
  const [qty, setQty] = useState('')
  const [targetProfit, setTargetProfit] = useState('')
  const [commRate, setCommRate] = useState('0.5')

  function calc() {
    if (!buyPrice || !qty) return null
    const totalBuy = Number(buyPrice) * Number(qty)
    const buyComm = totalBuy * (Number(commRate) / 100)
    const totalCost = totalBuy + buyComm
    const breakEvenWithComm = (totalCost / Number(qty)) / (1 - Number(commRate) / 100)
    const targetPL = Number(targetProfit) || 0
    const targetSellTotal = totalCost + targetPL
    const targetSellPerShare = targetSellTotal / Number(qty) / (1 - Number(commRate) / 100)
    return { breakEvenPerShare: breakEvenWithComm, targetSellPerShare, totalCost, targetPL }
  }

  const r = calc()

  return (
    <div className="calc-grid">
      <div className="card">
        <h3 style={{ marginBottom: 8, fontSize: 15, fontWeight: 700 }}>Break-Even Calculator</h3>
        <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 18 }}>কমিশন সহ কত দামে বেচলে ক্ষতি হবে না।</p>
        <div className="form-group"><label className="form-label">কেনার দাম (৳)</label><input className="form-input" type="number" placeholder="যেমন: 350" value={buyPrice} onChange={e => setBuyPrice(e.target.value)} /></div>
        <div className="form-group"><label className="form-label">শেয়ার সংখ্যা</label><input className="form-input" type="number" placeholder="যেমন: 100" value={qty} onChange={e => setQty(e.target.value)} /></div>
        <div className="form-group"><label className="form-label">লক্ষ্য লাভ (৳) — ঐচ্ছিক</label><input className="form-input" type="number" placeholder="যেমন: 5000" value={targetProfit} onChange={e => setTargetProfit(e.target.value)} /></div>
        <div className="form-group"><label className="form-label">কমিশন হার (%)</label><input className="form-input" type="number" placeholder="0.5" value={commRate} onChange={e => setCommRate(e.target.value)} step="0.1" /></div>
      </div>
      <div className="card">
        {r ? (
          <>
            <h3 style={{ marginBottom: 18, fontSize: 15, fontWeight: 700 }}>ফলাফল</h3>
            <div className="calc-result" style={{ marginBottom: 14, background: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.25)' }}>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>Break-Even দাম</div>
              <div className="result-value" style={{ color: 'var(--yellow)' }}>৳{r.breakEvenPerShare.toFixed(2)}</div>
              <div style={{ fontSize: 11.5, color: 'var(--text3)', marginTop: 4 }}>এর নিচে বেচলে ক্ষতি হবে</div>
            </div>
            {targetProfit && (
              <div className="calc-result" style={{ background: 'rgba(16,185,129,0.08)', borderColor: 'rgba(16,185,129,0.25)' }}>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>লক্ষ্য পূরণে বেচার দাম</div>
                <div className="result-value profit">৳{r.targetSellPerShare.toFixed(2)}</div>
                <div style={{ fontSize: 11.5, color: 'var(--green)', marginTop: 4 }}>+{formatTaka(r.targetPL)} লাভের জন্য</div>
              </div>
            )}
          </>
        ) : <div className="empty" style={{ height: '100%' }}><Calculator size={36} /><h3>তথ্য দিন</h3></div>}
      </div>
    </div>
  )
}
