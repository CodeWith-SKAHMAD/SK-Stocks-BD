import { useState } from 'react'
import { calculateFibLevels, formatTaka } from '../lib/utils'
import { Calculator, TrendingUp } from 'lucide-react'

export default function CalculatorPage() {
  const [calcTab, setCalcTab] = useState('profit')

  // Profit/Loss Calculator
  const [buyPrice, setBuyPrice] = useState('')
  const [sellPrice, setSellPrice] = useState('')
  const [qty, setQty] = useState('')
  const [commission, setCommission] = useState('0.5')

  // FIB Calculator
  const [high, setHigh] = useState('')
  const [low, setLow] = useState('')
  const [fibResult, setFibResult] = useState(null)

  function calcProfit() {
    if (!buyPrice || !sellPrice || !qty) return null
    const buy = Number(buyPrice) * Number(qty)
    const sell = Number(sellPrice) * Number(qty)
    const commRate = Number(commission) / 100
    const buyComm = buy * commRate
    const sellComm = sell * commRate
    const netBuy = buy + buyComm
    const netSell = sell - sellComm
    const pl = netSell - netBuy
    const plPct = (pl / netBuy) * 100
    return { pl, plPct, netBuy, netSell, buyComm, sellComm }
  }

  function calcFib() {
    if (!high || !low || Number(high) <= Number(low)) return
    setFibResult(calculateFibLevels(Number(high), Number(low)))
  }

  const profitResult = calcProfit()

  return (
    <div className="fade-up">
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800 }}>🧮 ক্যালকুলেটর</h2>
        <p style={{ color: 'var(--text2)', fontSize: 14 }}>লাভ/ক্ষতি এবং Fibonacci হিসাব করুন</p>
      </div>

      <div className="tabs">
        <button className={`tab ${calcTab === 'profit' ? 'active' : ''}`} onClick={() => setCalcTab('profit')}>
          💰 লাভ/ক্ষতি
        </button>
        <button className={`tab ${calcTab === 'fib' ? 'active' : ''}`} onClick={() => setCalcTab('fib')}>
          📐 Fibonacci
        </button>
        <button className={`tab ${calcTab === 'breakeven' ? 'active' : ''}`} onClick={() => setCalcTab('breakeven')}>
          ⚖️ Break-Even
        </button>
      </div>

      {calcTab === 'profit' && (
        <div className="calc-grid">
          <div className="card">
            <h3 style={{ marginBottom: 20, fontSize: 16 }}>ইনপুট দিন</h3>
            <div className="form-group">
              <label className="form-label">শেয়ার কেনার দাম (৳)</label>
              <input className="form-input" type="number" placeholder="যেমন: 350" value={buyPrice} onChange={e => setBuyPrice(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">শেয়ার বেচার দাম (৳)</label>
              <input className="form-input" type="number" placeholder="যেমন: 420" value={sellPrice} onChange={e => setSellPrice(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">শেয়ার সংখ্যা</label>
              <input className="form-input" type="number" placeholder="যেমন: 100" value={qty} onChange={e => setQty(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">কমিশন (%) — সাধারণত ০.৫%</label>
              <input className="form-input" type="number" placeholder="0.5" value={commission} onChange={e => setCommission(e.target.value)} step="0.1" />
            </div>
          </div>

          <div>
            {profitResult ? (
              <div className="card">
                <h3 style={{ marginBottom: 16, fontSize: 16 }}>ফলাফল</h3>
                <div className="calc-result" style={{ marginBottom: 16, background: profitResult.pl >= 0 ? 'rgba(0,200,150,0.1)' : 'rgba(255,77,106,0.1)', borderColor: profitResult.pl >= 0 ? 'rgba(0,200,150,0.3)' : 'rgba(255,77,106,0.3)' }}>
                  <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 6 }}>মোট লাভ/ক্ষতি</div>
                  <div className={`result-value ${profitResult.pl >= 0 ? 'profit' : 'loss'}`}>
                    {profitResult.pl >= 0 ? '+' : ''}{formatTaka(profitResult.pl)}
                  </div>
                  <div style={{ fontSize: 15, marginTop: 6, fontWeight: 600, color: profitResult.pl >= 0 ? 'var(--green)' : 'var(--red)' }}>
                    ({profitResult.plPct >= 0 ? '+' : ''}{profitResult.plPct.toFixed(2)}%)
                  </div>
                </div>

                {[
                  { label: 'মোট কেনার খরচ', value: formatTaka(profitResult.netBuy), color: 'var(--text)' },
                  { label: 'মোট বিক্রয় আয়', value: formatTaka(profitResult.netSell), color: 'var(--text)' },
                  { label: 'কেনার কমিশন', value: formatTaka(profitResult.buyComm), color: 'var(--red)' },
                  { label: 'বেচার কমিশন', value: formatTaka(profitResult.sellComm), color: 'var(--red)' },
                ].map((r, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 14 }}>
                    <span style={{ color: 'var(--text2)' }}>{r.label}</span>
                    <span style={{ fontWeight: 600, color: r.color }}>{r.value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card empty" style={{ height: '100%' }}>
                <Calculator size={40} />
                <h3>বাম দিকে তথ্য দিন</h3>
                <p>স্বয়ংক্রিয়ভাবে হিসাব হবে</p>
              </div>
            )}
          </div>
        </div>
      )}

      {calcTab === 'fib' && (
        <div className="calc-grid">
          <div className="card">
            <h3 style={{ marginBottom: 8, fontSize: 16 }}>Fibonacci Retracement</h3>
            <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 20 }}>স্টকের High এবং Low দাম দিলে গুরুত্বপূর্ণ support/resistance level বের করবে।</p>

            <div className="form-group">
              <label className="form-label">সর্বোচ্চ দাম / High (৳)</label>
              <input className="form-input" type="number" placeholder="যেমন: 500" value={high} onChange={e => setHigh(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">সর্বনিম্ন দাম / Low (৳)</label>
              <input className="form-input" type="number" placeholder="যেমন: 300" value={low} onChange={e => setLow(e.target.value)} />
            </div>
            <button className="btn btn-primary btn-full" onClick={calcFib}>📐 হিসাব করুন</button>
          </div>

          <div className="card">
            {fibResult ? (
              <>
                <h3 style={{ marginBottom: 16, fontSize: 16 }}>Fibonacci Levels</h3>
                {[
                  { label: '0% (Low)', value: fibResult.fib0, desc: 'নিচের সীমা', color: 'var(--red)' },
                  { label: '23.6%', value: fibResult.fib236, desc: 'দুর্বল সাপোর্ট', color: 'var(--yellow)' },
                  { label: '38.2%', value: fibResult.fib382, desc: 'মাঝারি সাপোর্ট', color: 'var(--accent2)' },
                  { label: '50%', value: fibResult.fib500, desc: 'গুরুত্বপূর্ণ সাপোর্ট', color: 'var(--accent)' },
                  { label: '61.8% ⭐', value: fibResult.fib618, desc: 'শক্তিশালী সাপোর্ট (Golden Ratio)', color: 'var(--green)' },
                  { label: '78.6%', value: fibResult.fib786, desc: 'খুব শক্তিশালী সাপোর্ট', color: 'var(--green)' },
                  { label: '100% (High)', value: fibResult.fib100, desc: 'উপরের সীমা', color: 'var(--text2)' },
                ].map((f, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: f.color }}>{f.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>{f.desc}</div>
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 800, fontFamily: 'var(--font-head)', color: f.color }}>৳{f.value}</div>
                  </div>
                ))}
              </>
            ) : (
              <div className="empty" style={{ height: '100%' }}>
                <TrendingUp size={40} />
                <h3>High ও Low দিন</h3>
                <p>Fibonacci support level বের হবে</p>
              </div>
            )}
          </div>
        </div>
      )}

      {calcTab === 'breakeven' && (
        <BreakevenCalc />
      )}
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
    const breakEvenPerShare = totalCost / Number(qty)
    const breakEvenWithComm = breakEvenPerShare / (1 - Number(commRate) / 100)

    const targetPL = Number(targetProfit) || 0
    const targetSellTotal = totalCost + targetPL
    const targetSellPerShare = targetSellTotal / Number(qty) / (1 - Number(commRate) / 100)

    return { breakEvenPerShare: breakEvenWithComm, targetSellPerShare, totalCost, targetPL }
  }

  const r = calc()

  return (
    <div className="calc-grid">
      <div className="card">
        <h3 style={{ marginBottom: 8, fontSize: 16 }}>Break-Even Calculator</h3>
        <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 20 }}>কমিশন সহ কত দামে বেচলে ক্ষতি হবে না।</p>
        <div className="form-group">
          <label className="form-label">কেনার দাম (৳)</label>
          <input className="form-input" type="number" placeholder="যেমন: 350" value={buyPrice} onChange={e => setBuyPrice(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">শেয়ার সংখ্যা</label>
          <input className="form-input" type="number" placeholder="যেমন: 100" value={qty} onChange={e => setQty(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">লক্ষ্য লাভ (৳) — ঐচ্ছিক</label>
          <input className="form-input" type="number" placeholder="যেমন: 5000" value={targetProfit} onChange={e => setTargetProfit(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">কমিশন হার (%)</label>
          <input className="form-input" type="number" placeholder="0.5" value={commRate} onChange={e => setCommRate(e.target.value)} step="0.1" />
        </div>
      </div>
      <div className="card">
        {r ? (
          <>
            <h3 style={{ marginBottom: 20, fontSize: 16 }}>ফলাফল</h3>
            <div className="calc-result" style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 4 }}>Break-Even দাম (কমিশন সহ)</div>
              <div className="result-value" style={{ color: 'var(--yellow)' }}>৳{r.breakEvenPerShare.toFixed(2)}</div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>এর নিচে বেচলে ক্ষতি হবে</div>
            </div>
            {targetProfit && (
              <div className="calc-result" style={{ background: 'rgba(0,200,150,0.1)', borderColor: 'rgba(0,200,150,0.3)' }}>
                <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 4 }}>লক্ষ্য পূরণে বেচার দাম</div>
                <div className="result-value profit">৳{r.targetSellPerShare.toFixed(2)}</div>
                <div style={{ fontSize: 12, color: 'var(--green)', marginTop: 4 }}>+{formatTaka(r.targetPL)} লাভের জন্য</div>
              </div>
            )}
          </>
        ) : (
          <div className="empty" style={{ height: '100%' }}>
            <Calculator size={40} />
            <h3>তথ্য দিন</h3>
          </div>
        )}
      </div>
    </div>
  )
}
