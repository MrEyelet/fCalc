import React, { useState } from 'react'
import { evaluateExpression, formatNumber } from '../utils/eval'

type Props = { force: number }

const buttons = [
  ['AC','( )','%','/'],
  ['7','8','9','x'],
  ['4','5','6','-'],
  ['1','2','3','+'],
  ['0',',','DEL','=']
]

export default function Calculator({ force }: Props) {
  const [expr, setExpr] = useState<string>('')
  const [display, setDisplay] = useState<string>('0')

  const push = (t: string) => {
    // AC (all clear)
    if (t === 'AC') { setExpr(''); setDisplay('0'); return }

    // DEL
    if (t === 'DEL') { setExpr(e => e.slice(0, -1)); return }

    // Comma as decimal separator (comma -> dot for evaluator)
    if (t === ',') {
      // append dot only if current number doesn't already contain one
      const m = expr.match(/(\d*\.?\d*)$/)
      const last = m ? m[0] : ''
      if (!last.includes('.')) setExpr(e => e + '.')
      return
    }

    // Percent: replace trailing number by number/100
    if (t === '%') {
      const m = expr.match(/(\d*\.?\d+)$/)
      if (!m) return
      const num = Number(m[0])
      if (Number.isNaN(num)) return
      const replaced = formatNumber(num / 100)
      setExpr(e => e.slice(0, -m[0].length) + replaced)
      return
    }

    // Parenthesis button toggles insert '(' or ')' based on balance
    if (t === '( )') {
      const open = (expr.match(/\(/g) || []).length
      const close = (expr.match(/\)/g) || []).length
      if (open > close && !/[+\-*/(]$/.test(expr)) {
        // close if there's unclosed and last char is digit
        setExpr(e => e + ')')
      } else {
        setExpr(e => e + '(')
      }
      return
    }

    // Equals
    if (t === '=') {
      const r = evaluateExpression(expr)
      setDisplay(isFinite(r) ? formatNumber(r) : 'Error')
      setExpr(isFinite(r) ? String(formatNumber(r)) : '')
      return
    }

    // Magic minus behavior remains: when pressing '-' we compute X so random - X = force
    if (t === '-') {
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

    // Default: append token (operators like '/', 'x', '+', numbers, etc.)
    setExpr(e => e + t)
  }

  // live evaluate to show result preview
  React.useEffect(() => {
    const r = evaluateExpression(expr)
    setDisplay(isFinite(r) ? String(formatNumber(r)) : (expr || '0'))
  }, [expr])

  // keyboard support: Backspace/Delete should act like DEL, Enter like '='
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault()
        setExpr(prev => prev.slice(0, -1))
        return
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        const r = evaluateExpression(expr)
        setDisplay(isFinite(r) ? formatNumber(r) : 'Error')
        setExpr(isFinite(r) ? String(formatNumber(r)) : '')
        return
      }
      // allow typing numbers, operators and comma/dot
      if (/^[0-9+\-*/.,()]$/.test(e.key)) {
        e.preventDefault()
        if (e.key === ',') {
          // insert decimal point if current number has none
          const m = expr.match(/(\d*\.?\d*)$/)
          const last = m ? m[0] : ''
          if (!last.includes('.')) setExpr(s => s + '.')
        } else if (e.key === '*') {
          setExpr(s => s + 'x')
        } else {
          setExpr(s => s + e.key)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [expr])

  return (
    <div className="calc">
      <div className="display">
        <div className="result">{expr || ' '}</div>
        <div className="expr">{display}</div>
      </div>
      <div className="pad">
        {buttons.flat().map((b) => {
          const classes = ['key']
          if (['/','x','-','+'].includes(b)) classes.push('operator')
          if (b === '=') classes.push('operator', 'equals')
          if (['AC','( )','%'].includes(b)) classes.push('func')
          if (b === '0') classes.push('zero')
          return <button key={b} className={classes.join(' ')} onClick={() => push(b)}>{b}</button>
        })}
      </div>
    </div>
  )
}
