import { type Expr } from './data.ts';

type Name = string
type Value = number

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
      return evaluate(expr.lhs, env) + evaluate(expr.rhs, env);
    case 'sub':
      return evaluate(expr.lhs, env) - evaluate(expr.rhs, env);
    case 'mul':
      return evaluate(expr.lhs, env) * evaluate(expr.rhs, env);
    case 'div':
      return evaluate(expr.lhs, env) / evaluate(expr.rhs, env);
    case 'pow':
      return evaluate(expr.lhs, env) ** evaluate(expr.rhs, env);
    case 'app':
      return 0;
    case 'var':
      return env.find(expr.name);
    case 'num':
      return expr.value;
  }
}
