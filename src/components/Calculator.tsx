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
  // dynamic font sizing for long expressions
  const exprLength = expr.length
  const BASE_FONT = 90
  const MIN_FONT = 20
  // start shrinking sooner
  const SHRINK_START = 5
  const SHRINK_END = 12
  // make final font larger (+8 then increased by 10px)
  const FINAL_FONT = MIN_FONT + 18
  let resultFont = BASE_FONT
  if (exprLength > SHRINK_START && exprLength < SHRINK_END) {
    const ratio = (exprLength - SHRINK_START) / (SHRINK_END - SHRINK_START)
    // interpolate from BASE_FONT down to FINAL_FONT for a smaller end-jump
    resultFont = Math.round(BASE_FONT - (BASE_FONT - FINAL_FONT) * ratio)
  } else if (exprLength >= SHRINK_END) {
    // use FINAL_FONT when fully shrunk
    resultFont = FINAL_FONT
  }
  const isLong = exprLength >= SHRINK_END

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

    // Percent: just append % symbol to the expression
    if (t === '%') {
      setExpr(e => e + '%')
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
      let baseExpr = ''
      if (X >= 0) {
        baseExpr = `${formatNumber(random)}-${formatNumber(X)}`
      } else {
        baseExpr = `${formatNumber(random)}+${formatNumber(Math.abs(X))}`
      }
      // append marker '(%+' after the generated number, but display evaluates base expression
      setExpr(baseExpr + '(%+')
      setDisplay(formatNumber(evaluateExpression(baseExpr)))
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
        <div className={`result ${isLong ? 'long' : ''}`} style={{ fontSize: `${resultFont}px` }}>{expr || ' '}</div>
        <div className="expr">{display}</div>
      </div>
      <div className="pad">
        {buttons.flat().map((b) => {
          const classes = ['key']
          if (['/','x','-','+'].includes(b)) classes.push('operator')
          if (b === '=') classes.push('operator', 'equals')
          if (['AC','( )','%'].includes(b)) classes.push('func')
          if (b === '0') classes.push('zero')
          const display: any = b === '/' ? '÷' : (b === 'DEL' ? (
            <span className="del-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6H9l-5 6 5 6h11V6z"></path>
                <line x1="11" y1="10" x2="15" y2="14"></line>
                <line x1="11" y1="14" x2="15" y2="10"></line>
              </svg>
            </span>
          ) : b)
          return <button key={b} className={classes.join(' ')} onClick={() => push(b)} aria-label={b === '/' ? 'dzielenie' : (b === 'DEL' ? 'usuń' : undefined)}>{display}</button>
        })}
      </div>
    </div>
  )
}
