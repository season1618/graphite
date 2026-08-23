import { type Expr } from './data.ts';

type Name = string
type Value = number | Closure | Value[]

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

class Closure {
  env: Env;
  name: Name;
  body: Expr;

  constructor(env: Env, name: Name, body: Expr) {
    this.env = env;
    this.name = name;
    this.body = body;
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
    case 'abs': {
      let { name, body } = expr;
      return new Closure(env, name, body);
    }
    case 'app': {
      let { e1, e2 } = expr;
      let v1 = evaluate(e1, env);
      let v2 = evaluate(e2, env);
      return apply(v1 as Closure, v2);
    }
    case 'var':
      return env.find(expr.name);
    case 'num':
      return expr.value;
    case 'tuple':
      return expr.exprs.map(e => evaluate(e, env));
  }
}

function apply(fun: Closure, arg: Value): Value {
  let { env, name, body } = fun;
  env.push(name, arg);
  let ret = evaluate(body, env);
  env.pop();
  return ret;
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
