import type { Prog, Stmt, Expr, Pattern } from './data.ts';

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

type D = [number, number]
type Env = null | { env: Env, bind: Bind }
type Ref = (_: any) => D

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
  ref: Ref;
  param: Pattern;
  body: Expr;

  constructor(env: Env, ref: Ref, param: Pattern, body: Expr) {
    this.env = env;
    this.ref = ref;
    this.param = param;
    this.body = body;
  }
}

type CanvasCtx = CanvasRenderingContext2D
let context: CanvasCtx;

export function execute(prog: Prog, context_: CanvasCtx, scale: number) {
  context = context_;
  let env = extend(null, 'curve', 'curve');
  let ref: Ref = ([x, y]: D) => [scale * x, scale * y];
  execute_stmt(prog, env, ref);
}

function execute_stmt(prog: Stmt[], env: Env, ref: Ref) {
  for (const stmt of prog) {
    switch (stmt.kind) {
      case 'let':
        let { name, expr } = stmt;
        let val = evaluate(expr, env, ref);
        env = extend(env, name, val);
        continue;
      case 'put':
        let { trans, stmts } = stmt;
        let f = evaluate(trans, env, ref) as Fun;
        execute_stmt(stmts, env, x => ref(apply(f, x, ref)));
        continue;
      default: {
        let expr = stmt;
        evaluate(expr, env, ref);
        continue;
      }
    }
  }
}

function evaluate(expr: Expr, env: Env, ref: Ref): Value {
  switch (expr.kind) {
    case 'num':
      return expr.value;
    case 'var':
      return find(env, expr.name);
    case 'abs': {
      let { param, body } = expr;
      return new Closure(env, ref, param, body);
    }
    case 'app': {
      let { e1, e2 } = expr;
      let v1 = evaluate(e1, env, ref);
      let v2 = evaluate(e2, env, ref);
      return apply(v1 as Fun, v2, ref);
    }
    case 'tuple':
      return expr.exprs.map(e => evaluate(e, env, ref));
    case 'neg':
    case 'sin':
    case 'cos':
    case 'tan': {
      let { kind, arg } = expr;
      let val = evaluate(arg, env, ref) as number;
      return unary_op(kind, val);
    }
    case 'add':
    case 'sub':
    case 'mul':
    case 'div':
    case 'pow':
      let { kind, lhs, rhs } = expr;
      let v1 = evaluate(lhs, env, ref) as number;
      let v2 = evaluate(rhs, env, ref) as number;
      return binary_op(kind, v1, v2);
    case 'block':
      let vals = expr.exprs.map(e => evaluate(e, env, ref));
      return vals[vals.length - 1];
  }
}

function apply(fun: Fun, arg: Value, ref: Ref): Value {
  if (fun instanceof Closure) {
    let { env, ref, param, body } = fun;
    return evaluate(body, extend(env, param, arg), ref);
  } else {
    let [f, [a, b]] = arg as [Closure, [number, number]];
    let pa = ref(apply(f, a, x => x)) as D;
    let pb = ref(apply(f, b, x => x)) as D;
    curve(f, a, b, pa, pb, ref);
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

function dist([x1, y1]: D, [x2, y2]: D): number {
  return Math.hypot(x1 - x2, y1 - y2);
}

function curve(f: Closure, a: number, b: number, pa: D, pb: D, ref: Ref) {
  const eps = 1;
  if (dist(pa, pb) < eps) {
    let [x1, y1] = pa;
    let [x2, y2] = pb;
    context.beginPath();
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.stroke();
  } else {
    let m = (a + b) / 2;
    let pm = ref(apply(f, m, x => x)) as D;
    curve(f, a, m, pa, pm, ref);
    curve(f, m, b, pm, pb, ref);
  }
}
