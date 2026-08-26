import type { Prog, Expr, Pattern } from './data.ts';

type Name = string
type Value = number | Fun | Value[]
type Fun = 'curve' | Closure

class Bind {
  x: Name;
  v: Value;

  constructor(x: Name, v: Value) {
    this.x = x;
    this.v = v;
  }
}

type Env = null | { env: Env, bind: Bind }

function find(env: Env, name: Name): Value {
  if (env === null) throw { kind: 'Not Found', name };
  else {
    let { env: env_, bind } = env;
    if (bind.x === name) return bind.v;
    else return find(env_, name);
  }
}

function extend(env: Env, param: Pattern, value: Value): Env {
  if (typeof param === 'string') {
    return { env, bind: new Bind(param, value) };
  } else if (Array.isArray(value)) {
    let binds = [];
    for (let i = 0; i < param.length; i++) {
      binds.push([param[i], value[i]]);
    }
    return binds.reduce((env, [x, v]) => extend(env, x as Pattern, v as Value), env);
  }
  throw "";
}

class Closure {
  env: Env;
  param: Pattern;
  body: Expr;

  constructor(env: Env, param: Pattern, body: Expr) {
    this.env = env;
    this.param = param;
    this.body = body;
  }
}

type CanvasCtx = CanvasRenderingContext2D
let context: CanvasCtx;

export function execute(prog: Prog, context_: CanvasCtx) {
  context = context_;
  let env = extend(null, 'curve', 'curve');
  
  for (const stmt of prog) {
    if (stmt.kind === 'let') {
      let { name, expr } = stmt;
      let val = evaluate(expr, env);
      env = extend(env, name, val);
    } else {
      let expr = stmt;
      evaluate(expr, env);
    }
  }
}

function evaluate(expr: Expr, env: Env): Value {
  switch (expr.kind) {
    case 'num':
      return expr.value;
    case 'var':
      return find(env, expr.name);
    case 'abs': {
      let { param, body } = expr;
      return new Closure(env, param, body);
    }
    case 'app': {
      let { e1, e2 } = expr;
      let v1 = evaluate(e1, env);
      let v2 = evaluate(e2, env);
      return apply(v1 as Fun, v2);
    }
    case 'tuple':
      return expr.exprs.map(e => evaluate(e, env));
    case 'neg':
    case 'sin':
    case 'cos':
    case 'tan': {
      let { kind, arg } = expr;
      let val = evaluate(arg, env) as number;
      return unary_op(kind, val);
    }
    case 'add':
    case 'sub':
    case 'mul':
    case 'div':
    case 'pow':
      let { kind, lhs, rhs } = expr;
      let v1 = evaluate(lhs, env) as number;
      let v2 = evaluate(rhs, env) as number;
      return binary_op(kind, v1, v2);
    case 'block':
      let vals = expr.exprs.map(e => evaluate(e, env));
      return vals[vals.length - 1];
  }
}

function apply(fun: Fun, arg: Value): Value {
  if (fun instanceof Closure) {
    let { env, param, body } = fun;
    return evaluate(body, extend(env, param, arg));
  } else {
    let [f, [a, b]] = arg as [Closure, [number, number]];
    curve(f, a, b);
    return [];
  }
}

function unary_op(op: 'neg' | 'sin' | 'cos' | 'tan', v: number): number {
  switch (op) {
    case 'neg':
      return -v;
    case 'sin':
      return Math.sin(v);
    case 'cos':
      return Math.cos(v);
    case 'tan':
      return Math.tan(v);
  }
}

function binary_op(op: 'add' | 'sub' | 'mul' | 'div' | 'pow', v1: number, v2: number): number {
  switch (op) {
    case 'add':
      return v1 + v2;
    case 'sub':
      return v1 - v2;
    case 'mul':
      return v1 * v2;
    case 'div':
      return v1 / v2;
    case 'pow':
      return v1 ** v2;
  }
}

function dist([x1, y1]: [number, number], [x2, y2]: [number, number]): number {
  return Math.hypot(x1 - x2, y1 - y2);
}

function curve(f: Closure, a: number, b: number) {
  const eps = 1;
  let p1 = apply(f, a) as [number, number];
  let p2 = apply(f, b) as [number, number];
  if (dist(p1, p2) < eps) {
    let [x1, y1] = p1;
    let [x2, y2] = p2;
    context.beginPath();
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.stroke();
  } else {
    let m = (a + b) / 2;
    curve(f, a, m);
    curve(f, m, b);
  }
}
