import React, { useState, useRef, useEffect } from 'react'
import Calculator from './components/Calculator'

export default function App() {
  const [force, setForce] = useState<number | null>(882161)
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState<string>(force?.toString() ?? '')
  const [hint, setHint] = useState<string | null>(null)

  const openModal = () => {
    setInput(force?.toString() ?? '')
    setOpen(true)
  }

  const applyCustom = () => {
    const n = Number(input)
    if (!Number.isNaN(n)) setForce(n)
    setOpen(false)
  }

  const applyDate = () => {
    const now = new Date()
    const d = now.getDate() // day
    const m = now.getMonth() + 1 // month
    const y = now.getFullYear() % 100 // year two digits
    // if both day and month are > 9 use ddmmrr, otherwise use dmrr
    const yStr = y < 10 ? '0' + String(y) : String(y)
    let dayStr: string
    let monthStr: string
    if (d > 9 && m > 9) {
      dayStr = String(d).padStart(2, '0')
      monthStr = String(m).padStart(2, '0')
    } else {
      dayStr = String(d) // no leading zero
      monthStr = String(m) // no leading zero
    }
    const s = `${dayStr}${monthStr}${yStr}`
    setForce(Number(s))
    setOpen(false)
  }

  const applyDateTimePlus5 = () => {
    const now = new Date(Date.now() + 5 * 60 * 1000)
    const d = now.getDate()
    const m = now.getMonth() + 1
    const y = now.getFullYear() % 100
    const hh = now.getHours()
    const mm = now.getMinutes()
    // if both day and month are > 9 use ddmmrrhhmm, otherwise use dmrrhhmm
    const yStr = y < 10 ? '0' + String(y) : String(y)
    let dayStr: string
    let monthStr: string
    if (d > 9 && m > 9) {
      dayStr = String(d).padStart(2, '0')
      monthStr = String(m).padStart(2, '0')
    } else {
      dayStr = String(d)
      monthStr = String(m)
    }
    const hhStr = hh < 10 ? `0${hh}` : String(hh)
    const mmStr = mm < 10 ? `0${mm}` : String(mm)
    const s = `${dayStr}${monthStr}${yStr}${hhStr}${mmStr}`
    setForce(Number(s))
    setOpen(false)
  }

  const applyTimePlus5 = () => {
    const now = new Date(Date.now() + 5 * 60 * 1000)
    const hh = now.getHours()
    const mm = now.getMinutes()
    const hhStr = hh < 10 ? `0${hh}` : String(hh)
    const mmStr = mm < 10 ? `0${mm}` : String(mm)
    const s = `${hhStr}${mmStr}`
    setForce(Number(s))
    setOpen(false)
  }

  const hintTimer = useRef<number | null>(null)

  // showHint sets a hint in the topbar for 3 seconds
  const showHint = (text: string) => {
    setHint(text)
    if (hintTimer.current) window.clearTimeout(hintTimer.current)
    hintTimer.current = window.setTimeout(() => setHint(null), 3000)
  }

  useEffect(() => {
    return () => {
      if (hintTimer.current) window.clearTimeout(hintTimer.current)
    }
  }, [])

  return (
    <div className="app">
      <div className="surface">
        <header className="topbar">
          <button className="history-btn" title="Historia" aria-label="Historia (brak funkcji)">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 12a9 9 0 1 0-2.53 5.88" />
              <path d="M21 7v5h-5" />
              <path d="M12 7v5l3 2" />
            </svg>
          </button>

          <div className="topbar-hint" aria-live="polite">{hint}</div>

          <button
            className="force-btn"
            title={`Force: ${force ?? 'brak'}`}
            aria-label={`Force: ${force ?? 'brak'} — kliknij, aby zmienić`}
            onClick={openModal}
          >
            <span className="ellipsis-vertical" aria-hidden="true">⋮</span>
          </button>
        </header>
        <main className="main">
          <Calculator force={force ?? 0} onHint={showHint} />
        </main>

        {open && (
          <div className="modal-overlay" onMouseDown={() => setOpen(false)}>
            <div className="modal" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
              <button className="modal-close-x" aria-label="Zamknij modal" onClick={() => setOpen(false)}>✕</button>
              <h3>Ustaw Force number</h3>
              <label>
                Własny numer
                <input value={input} onChange={e => setInput(e.target.value)} />
              </label>
              <div className="modal-actions">
                <button className="btn" onClick={applyCustom}>Zapisz</button>
                <button className="btn" onClick={applyDate}>Ustaw na dzisiejszą datę (ddmmyy)</button>
                <button className="btn" onClick={applyDateTimePlus5}>Data i godzina (+5min)</button>
                <button className="btn" onClick={applyTimePlus5}>Ustaw na czas +5m (hhmm)</button>
              </div>
              <button className="modal-close" onClick={() => setOpen(false)}>Anuluj</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
