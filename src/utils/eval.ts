// simple shunting-yard + rpn evaluator for + - * / and parentheses, supports floats
export function formatNumber(n: number) {
  if (!isFinite(n)) return 'NaN'
  if (Math.abs(n) < 1e-6) return '0'
  return Number.isInteger(n) ? String(n) : String(Number(n.toFixed(6)))
}

function isOp(c: string) { return ['+','-','*','/'].includes(c) }
function prec(op: string) {
  if (op === '+' || op === '-') return 1
  if (op === '*' || op === '/') return 2
  return 0
}

export function evaluateExpression(s: string): number {
  if (!s) return 0
  // allow 'x' as multiply
  const ss = s.replace(/x/g, '*').trim()
  // sanitize: allow digits, operators, parentheses and dot
  if (!/^[0-9+\-*/().\s]+$/.test(ss)) return NaN

  const output: string[] = []
  const ops: string[] = []
  const tokens: string[] = []
  // tokenize
  let i = 0
  while (i < ss.length) {
    const c = ss[i]
    if (/\d|\./.test(c)) {
      let num = c
      i++
      while (i < ss.length && /[\d\.]/.test(ss[i])) { num += ss[i++]}
      tokens.push(num)
      continue
    }
    if (isOp(c) || c === '('|| c === ')') {
      tokens.push(c)
    }
    i++
  }

  for (const t of tokens) {
    if (/^[\d.]+$/.test(t)) {
      output.push(t)
    } else if (isOp(t)) {
      while (ops.length && isOp(ops[ops.length-1]) && prec(ops[ops.length-1]) >= prec(t)) {
        output.push(ops.pop()!)
      }
      ops.push(t)
    } else if (t === '(') {
      ops.push(t)
    } else if (t === ')') {
      while (ops.length && ops[ops.length-1] !== '(') output.push(ops.pop()!)
      ops.pop()
    }
  }
  while (ops.length) output.push(ops.pop()!)

  // eval RPN
  const stack: number[] = []
  for (const tk of output) {
    if (/^[\d.]+$/.test(tk)) stack.push(Number(tk))
    else {
      const b = stack.pop() ?? 0
      const a = stack.pop() ?? 0
      let r = 0
      if (tk === '+') r = a + b
      else if (tk === '-') r = a - b
      else if (tk === '*') r = a * b
      else if (tk === '/') r = b === 0 ? NaN : a / b
      stack.push(r)
    }
  }
  return stack[0] ?? NaN
}
