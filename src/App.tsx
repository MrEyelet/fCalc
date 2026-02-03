import React, { useState } from 'react'
import Calculator from './components/Calculator'

export default function App() {
  const [force, setForce] = useState<number | null>(589375)

  return (
    <div className="app">
      <div className="surface">
        <header className="topbar">
          <button
            className="force-btn"
            title={`Force: ${force ?? 'brak'}`}
            aria-label={`Force: ${force ?? 'brak'} — kliknij, aby zmienić`}
            onClick={() => {
              const v = prompt('Ustaw force number', force?.toString() ?? '')
              if (v !== null) {
                const n = Number(v)
                if (!Number.isNaN(n)) setForce(n)
              }
            }}
          >
            <span className="ellipsis-vertical" aria-hidden="true">⋮</span>
          </button>
        </header>
        <main className="main">
          <Calculator force={force ?? 0} />
        </main>
      </div>
    </div>
  )
}
