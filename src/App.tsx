import React, { useState } from 'react'
import Calculator from './components/Calculator'

export default function App() {
  const [force, setForce] = useState<number | null>(589375)
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState<string>(force?.toString() ?? '')

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
    // follow example: omit leading zero for day if single-digit, keep month two-digit
    const dayStr = d < 10 ? String(d) : String(d)
    const monthStr = m < 10 ? `0${m}` : String(m)
    const s = `${dayStr}${monthStr}${y < 10 ? '0' + y : String(y)}`
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

  return (
    <div className="app">
      <div className="surface">
        <header className="topbar">
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
          <Calculator force={force ?? 0} />
        </main>

        {open && (
          <div className="modal-overlay" onMouseDown={() => setOpen(false)}>
            <div className="modal" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
              <h3>Ustaw Force number</h3>
              <label>
                Własny numer
                <input value={input} onChange={e => setInput(e.target.value)} />
              </label>
              <div className="modal-actions">
                <button className="btn" onClick={applyCustom}>Zapisz</button>
                <button className="btn" onClick={applyDate}>Ustaw na dzisiejszą datę (ddmmyy)</button>
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
