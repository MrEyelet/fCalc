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
  const [display, setDisplay] = useState<string>('')
  const [lastComputed, setLastComputed] = useState<string>('')
  const [locked, setLocked] = useState<boolean>(false)
  const lockTimer = React.useRef<number | null>(null)
  const resultRef = React.useRef<HTMLDivElement | null>(null)
  const [resultFont, setResultFont] = React.useState<number>(90)
  // dynamic font sizing for long expressions
  const exprLength = expr.length
  const BASE_FONT = 82
  const MIN_FONT = 18
  // start shrinking only after 9 characters to keep 9 digits visible
  const SHRINK_START = 9
  const SHRINK_END = 16
  // make final font larger (+8 then increased by 10px)
  const FINAL_FONT = MIN_FONT + 18
  const isLong = exprLength >= SHRINK_END

  // adjust font when expr changes (normal typing) — keep previous behaviour
  React.useEffect(() => {
    if (exprLength > SHRINK_START && exprLength < SHRINK_END) {
      const ratio = (exprLength - SHRINK_START) / (SHRINK_END - SHRINK_START)
      const f = Math.round(BASE_FONT - (BASE_FONT - FINAL_FONT) * ratio)
      setResultFont(f)
    } else if (exprLength >= SHRINK_END) {
      setResultFont(FINAL_FONT)
    } else {
      setResultFont(BASE_FONT)
    }
  }, [exprLength])

  const push = (t: string) => {
    // if locked, ignore all button presses
    if (locked) return

    // AC (all clear)
    if (t === 'AC') { setExpr(''); setDisplay(''); return }

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
      if (!expr.trim()) return
      const r = evaluateExpression(expr)
      if (isFinite(r)) {
        setDisplay(formatNumber(r))
        setExpr('')
      } else {
        setDisplay('Error')
      }
      return
    }

    // Magic minus behavior: use current `expr` if present, otherwise fall back
    // to the last `display`ed result (so it works after '='). Compute a base
    // expression such that random - X = force and append marker '(%'.
    if (t === '-') {
      const source = expr && expr.trim() ? expr : (display && display !== 'Error' ? display : '')
      if (!source) return
      const random = evaluateExpression(source)
      if (!isFinite(random)) return
      const X = random - force
      let baseExpr = ''
      if (X >= 0) {
        baseExpr = `${formatNumber(random)}-${formatNumber(X)}`
      } else {
        baseExpr = `${formatNumber(random)}+${formatNumber(Math.abs(X))}`
      }
      // append marker '(%' after the generated number, but display evaluates base expression
      setExpr(baseExpr + '(%')
      setDisplay(formatNumber(evaluateExpression(baseExpr)))
      // lock input for 10 seconds (overlay must block clicks)
      setLocked(true)
      if (lockTimer.current) window.clearTimeout(lockTimer.current)
      lockTimer.current = window.setTimeout(() => {
        setLocked(false)
        lockTimer.current = null
      }, 10000)
      return
    }

    // If user presses an operator while the current expr is empty but there's
    // a last result in `display`, start new expression from that result.
    if (['/','x','-','+'].includes(t) && !expr && display && display !== 'Error') {
      setExpr(display + t)
      setDisplay('')
      return
    }

    // Default: append token (operators like '/', 'x', '+', numbers, etc.)
    setExpr(e => e + t)
  }

  // live evaluate to update lastComputed preview
  React.useEffect(() => {
    if (!expr) { setLastComputed(''); return }
    const hasOp = /[+\-x*/]/.test(expr)
    const endsWithNumber = /[0-9)]$/.test(expr)
    const r = evaluateExpression(expr)
    if (hasOp && endsWithNumber && isFinite(r)) {
      setLastComputed(formatNumber(r))
    } else if (!hasOp) {
      setLastComputed('')
    }
    // if expression ends with operator we keep lastComputed unchanged
  }, [expr])

  // keep result scrolled to the end when content overflows
  React.useEffect(() => {
    const el = resultRef.current
    if (!el) return
    // if content wider than container, scroll to end
    if (el.scrollWidth > el.clientWidth) {
      // if we currently show an evaluated `display` (expr is empty), prefer
      // to shrink the font rather than scroll — try to fit by decreasing font
      if (!expr && display) {
        let f = resultFont
        // decrease until it fits or reach MIN_FONT
        while (el.scrollWidth > el.clientWidth && f > MIN_FONT) {
          f -= 1
          el.style.fontSize = `${f}px`
        }
        setResultFont(f)
        // ensure final scroll position is at end
        el.scrollTo({ left: el.scrollWidth })
      } else {
        // use smooth scroll for nicer UX when typing
        el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' })
      }
    } else {
      // if it fits, restore font to state value (in case inline style was used)
      el.style.fontSize = `${resultFont}px`
    }
  }, [expr, display])

  // keyboard support: Backspace/Delete should act like DEL, Enter like '='
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // ignore keyboard while locked
      if (locked) { e.preventDefault(); return }
      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault()
        setExpr(prev => prev.slice(0, -1))
        return
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        if (!expr.trim()) return
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

  // cleanup lock timer on unmount
  React.useEffect(() => {
    return () => {
      if (lockTimer.current) window.clearTimeout(lockTimer.current)
    }
  }, [])

  return (
    <div className="calc">
      {locked && <div className="block-cover" aria-hidden="true"></div>}
      <div className="display">
        <div ref={resultRef} className={`result ${isLong ? 'long' : ''}`} style={{ fontSize: `${resultFont}px` }}>
          {expr || display || ' '}
          {<span className="blink-cursor" aria-hidden="true"></span>}
        </div>
        <div className="expr">{lastComputed}</div>
      </div>
      <div className="pad">
        {buttons.flat().map((b) => {
          const classes = ['key']
          if (['/','x','-','+'].includes(b)) classes.push('operator')
          if (b === '=') classes.push('operator', 'equals')
          if (['AC','( )','%'].includes(b)) classes.push('func')
          // add more specific classes for targeted styling
          if (b === 'AC') classes.push('ac')
          if (b === '( )') classes.push('paren')
          if (b === '%') classes.push('percent')
          if (b === '/') classes.push('divide')
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
