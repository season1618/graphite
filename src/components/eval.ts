import { type Expr } from './data.ts';

type Name = string
type Value = number | Value[]

class Bind {
  x: Name;
  v: Value;

  constructor(x: Name, v: Value) {
    this.x = x;
    this.v = v;
  }
}

class Env {
  env: Bind[];

  constructor() {
    this.env = [];
  }

  push(x: Name, v: Value) {
    this.env.push(new Bind(x, v));
  }

  pop() {
    this.env.pop();
  }

  find(x: Name) {
    for (let bind of this.env.reverse()) {
      if (bind.x === x) return bind.v;
    }
    throw { kind: 'Not Found', name: x }
  }
}

export function evaluate0(expr: Expr): Value {
  return evaluate(expr, new Env());
}

function evaluate(expr: Expr, env: Env): Value {
  switch (expr.kind) {
    case 'block':
      let vals = expr.exprs.map(e => evaluate(e, env));
      return vals[vals.length - 1];
    case 'let':
      let { name, expr1, expr2 } = expr;
      let value = evaluate(expr1, env);
      env.push(name, value);
      let res = evaluate(expr2, env);
      env.pop();
      return res;
    case 'add':
    case 'sub':
    case 'mul':
    case 'div':
    case 'pow':
      let { kind, lhs, rhs } = expr;
      let v1 = evaluate(lhs, env) as number;
      let v2 = evaluate(rhs, env) as number;
      return arith_op(kind, v1, v2);
    case 'app':
      return 0;
    case 'var':
      return env.find(expr.name);
    case 'num':
      return expr.value;
    case 'tuple':
      return expr.exprs.map(e => evaluate(e, env));
  }
}

function arith_op(op: 'add' | 'sub' | 'mul' | 'div' | 'pow', v1: number, v2: number): number {
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
