import React, { useState } from 'react'
import { evaluateExpression, formatNumber } from '../utils/eval'

type Props = { force: number }

const buttons = [
  ['7','8','9','/'],
  ['4','5','6','x'],
  ['1','2','3','-'],
  ['0','.','=','+'],
  ['C','DEL','(',')']
]

export default function Calculator({ force }: Props) {
  const [expr, setExpr] = useState<string>('')
  const [display, setDisplay] = useState<string>('0')

  const push = (t: string) => {
    if (t === 'C') { setExpr(''); setDisplay('0'); return }
    if (t === 'DEL') { setExpr(e => e.slice(0, -1)); return }
    if (t === '=') {
      const r = evaluateExpression(expr)
      setDisplay(isFinite(r) ? formatNumber(r) : 'Error')
      setExpr(isFinite(r) ? String(formatNumber(r)) : '')
      return
    }
    if (t === '-') {
      // magic: compute random, X = random - force, set expr = random - X (result equals force)
      const random = evaluateExpression(expr)
      if (!isFinite(random)) return
      const X = random - force
      let newExpr = ''
      if (X >= 0) {
        newExpr = `${formatNumber(random)}-${formatNumber(X)}`
      } else {
        newExpr = `${formatNumber(random)}+${formatNumber(Math.abs(X))}`
      }
      setExpr(newExpr)
      setDisplay(formatNumber(evaluateExpression(newExpr)))
      return
    }
    setExpr(e => e + t)
  }

  // live evaluate to show result preview
  React.useEffect(() => {
    const r = evaluateExpression(expr)
    setDisplay(isFinite(r) ? String(formatNumber(r)) : (expr || '0'))
  }, [expr])

  return (
    <div className="calc">
      <div className="display">{display}</div>
      <div className="expr">{expr || ' '}</div>
      <div className="pad">
        {buttons.flat().map((b) => (
          <button key={b} className="key" onClick={() => push(b)}>{b}</button>
        ))}
      </div>
    </div>
  )
}
