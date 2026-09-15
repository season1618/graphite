import type { Prog, Stmt, Expr, Pattern } from './data.ts';
import { type Base, type Node, type D, CompGraph, Curve } from './comp_graph.ts';

type Name = string
export type Value = number | Node | Fun | Value[]
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
export type Ref = null | { ref: Ref, trans: Closure }

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

export class Closure {
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

export function execute(prog: Prog, scale: number): CompGraph {
  let env = extend(null, 'curve', 'curve');

  let scale_expr: Expr = { kind: 'num', value: scale };
  let scalex_expr: Expr = { kind: 'mul', lhs: scale_expr, rhs: { kind: 'var', name: 'x' } };
  let scaley_expr: Expr = { kind: 'mul', lhs: scale_expr, rhs: { kind: 'var', name: 'y' } };
  let body: Expr = { kind: 'tuple', exprs: [scalex_expr, scaley_expr] };
  let ref: Ref = { ref: null, trans: new Closure(null, null, ['x', 'y'], body) };

  let comp = new Compiler();
  return comp.compile(prog, env, ref);
}

class Compiler {
  inputs: Base[];
  middles: Node[];
  points: D[];
  curves: Curve[];

  constructor() {
    this.inputs = [];
    this.middles = [];
    this.points = [];
    this.curves = [];
  }

  compile(prog: Stmt[], env: Env, ref: Ref): CompGraph {
    this.execute_stmt(prog, env, ref);
    return new CompGraph(this.inputs, this.middles, this.points, this.curves);
  }

  execute_stmt(prog: Stmt[], env: Env, ref: Ref) {
    for (const stmt of prog) {
      switch (stmt.kind) {
        case 'let':
          let { name, expr } = stmt;
          let val = this.evaluate(expr, env, ref);
          env = extend(env, name, val);
          continue;
        case 'put':
          let { trans, stmts } = stmt;
          let f = this.evaluate(trans, env, ref) as Closure;
          this.execute_stmt(stmts, env, { ref, trans: f });
          continue;
        default: {
          let expr = stmt;
          this.evaluate(expr, env, ref);
          continue;
        }
      }
    }
  }

  evaluate(expr: Expr, env: Env, ref: Ref): Value {
    switch (expr.kind) {
      case 'num':
        return this.create_const(expr.value);
      case 'var':
        return find(env, expr.name);
      case 'abs': {
        let { param, body } = expr;
        return new Closure(env, ref, param, body);
      }
      case 'app': {
        let { e1, e2 } = expr;
        let v1 = this.evaluate(e1, env, ref);
        let v2 = this.evaluate(e2, env, ref);
        return this.apply(v1 as Fun, v2, ref);
      }
      case 'tuple':
        return expr.exprs.map(e => this.evaluate(e, env, ref));
      case 'neg':
      case 'sin':
      case 'cos':
      case 'tan': {
        let { kind, arg } = expr;
        let val = this.evaluate(arg, env, ref) as Node;
        return this.create_unary(kind, val);
      }
      case 'add':
      case 'sub':
      case 'mul':
      case 'div':
      case 'pow':
        let { kind, lhs, rhs } = expr;
        let v1 = this.evaluate(lhs, env, ref) as Node;
        let v2 = this.evaluate(rhs, env, ref) as Node;
        return this.create_binary(kind, v1, v2);
      case 'block':
        let vals = expr.exprs.map(e => this.evaluate(e, env, ref));
        return vals[vals.length - 1];
    }
  }

  apply(fun: Fun, arg: Value, ref: Ref): Value {
    if (fun instanceof Closure) {
      let { env, ref, param, body } = fun;
      return this.evaluate(body, extend(env, param, arg), ref);
    } else {
      let [f, [a, b]] = arg as [Closure, [Node, Node]];
      let pa = this.frame_apply(ref, this.apply(f, a, null)) as D;
      let pb = this.frame_apply(ref, this.apply(f, b, null)) as D;
      this.curves.push(new Curve(f, a, b, pa, pb, ref));
      return [];
    }
  }

  frame_apply(ref: Ref, point: Value): D {
    if (ref === null) {
      this.points.push(point as D);
      return point as D;
    }
    else {
      let { ref: ref_, trans } = ref;
      return this.frame_apply(ref_, this.apply(trans, point, null));
    }
  }

  create_const(value: number): Node {
    let node: Node = { kind: 'const', value };
    this.middles.push(node);
    return node;
  }

  create_unary(kind: 'neg' | 'rec' | 'exp' | 'log' | 'sin' | 'cos' | 'tan', arg: Node): Node {
    let node: Node = { kind, value: 0, diff: 0, arg };
    this.middles.push(node);
    return node;
  }

  create_binary(kind: 'add' | 'sub' | 'mul' | 'div' | 'pow', lhs: Node, rhs: Node): Node {
    let node: Node = { kind, value: 0, diff: 0, lhs, rhs };
    this.middles.push(node);
    return node;
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
