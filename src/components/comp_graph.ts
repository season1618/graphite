import type { Expr, Pattern } from './data.ts';
import { type Value as Val, Closure, type Ref } from './compiler.ts';

type Value = number | Closure | Value[]

export type Node = Base | Const | Uni | Bin
export interface Base { kind: 'base', value: number, diff: number }
export type D = [Node, Node]
interface Const { kind: 'const', value: Value }
interface Uni { kind: 'neg' | 'rec' | 'exp' | 'log' | 'sin' | 'cos' | 'tan', value: number, diff: number, arg: Node }
interface Bin { kind: 'add' | 'sub' | 'mul' | 'div' | 'pow', value: number, diff: number, lhs: Node, rhs: Node }

type CanvasCtx = CanvasRenderingContext2D

export class Curve {
  fun: Closure;
  param1: Node;
  param2: Node;
  point1: [Node, Node];
  point2: [Node, Node];
  ref: Ref;

  constructor(fun: Closure, param1: Node, param2: Node, point1: [Node, Node], point2: [Node, Node], ref: Ref) {
    this.fun = fun;
    this.param1 = param1;
    this.param2 = param2;
    this.point1 = point1;
    this.point2 = point2;
    this.ref = ref;
  }

  render(ctx: CanvasCtx) {
    this.render_interval(this.param1.value as number, this.param2.value as number, [this.point1[0].value as number, this.point1[1].value as number], [this.point2[0].value as number, this.point2[1].value as number], ctx);
  }

  render_interval(a: number, b: number, pa: [number, number], pb: [number, number], ctx: CanvasCtx) {
    const eps = 1;
    // console.log(a, b, pa, pb);
    if (dist(pa, pb) < eps) {
      let [x1, y1] = pa;
      let [x2, y2] = pb;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    } else {
      let m = (a + b) / 2;
      let pm = frame_apply(this.ref, apply(this.fun, m, null)) as [number, number];
      this.render_interval(a, m, pa, pm, ctx);
      this.render_interval(m, b, pm, pb, ctx);
    }
  }
}

function dist([x1, y1]: [number, number], [x2, y2]: [number, number]): number {
  return Math.hypot(x1 - x2, y1 - y2);
}

type Name = string

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

function convert(val: Val): Value {
  if (typeof val === 'number') return val;
  else if (val instanceof Closure) return val;
  else if (Array.isArray(val)) return val.map(convert);
  else if (val === 'curve') throw '';
  else return val.value;
}

function evaluate_(expr: Expr, env: Env, ref: Ref): Value {
  switch (expr.kind) {
    case 'param':
    case 'num':
      return expr.value;
    case 'var':
      return convert(find(env, expr.name));
    case 'abs': {
      let { param, body } = expr;
      return new Closure(env, ref, param, body);
    }
    case 'app': {
      let { e1, e2 } = expr;
      let v1 = evaluate_(e1, env, ref);
      let v2 = evaluate_(e2, env, ref);
      return apply(v1 as Closure, v2, ref);
    }
    case 'tuple':
      return expr.exprs.map(e => evaluate_(e, env, ref));
    case 'neg':
    case 'rec':
    case 'exp':
    case 'log':
    case 'sin':
    case 'cos':
    case 'tan': {
      let { kind, arg } = expr;
      let val = evaluate_(arg, env, ref) as number;
      return unary_op(kind, val);
    }
    case 'add':
    case 'sub':
    case 'mul':
    case 'div':
    case 'pow':
      let { kind, lhs, rhs } = expr;
      let v1 = evaluate_(lhs, env, ref) as number;
      let v2 = evaluate_(rhs, env, ref) as number;
      return binary_op(kind, v1, v2);
    case 'block':
      let vals = expr.exprs.map(e => evaluate_(e, env, ref));
      return vals[vals.length - 1];
  }
}

function apply(fun: Closure, arg: Value, _: Ref): Value {
  let { env, ref, param, body } = fun;
  return evaluate_(body, extend(env as Env, param, arg), ref);
}

function frame_apply(ref: Ref, point: Value): [number, number] {
  if (ref === null) {
    return point as [number, number];
  }
  else {
    let { ref: ref_, trans } = ref;
    return frame_apply(ref_, apply(trans, point, null));
  }
}

function unary_op(op: 'neg' | 'rec' | 'exp' | 'log' | 'sin' | 'cos' | 'tan', v: number): number {
  switch (op) {
    case 'neg':
      return -v;
    case 'rec':
      return 1/v;
    case 'exp':
      return Math.exp(v);
    case 'log':
      return Math.log(v);
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

export class CompGraph {
  inputs: Base[];
  nodes: Node[];
  points: D[];
  curves: Curve[];

  constructor(inputs: Base[], nodes: Node[], points: D[], curves: Curve[]) {
    this.inputs = inputs;
    this.nodes = nodes;
    this.points = points;
    this.curves = curves;
  }

  evaluate() {
    this.nodes.forEach(evaluate);
  }

  adjust_point([x, y]: [Node, Node], [dx, dy]: [number, number]) {
    this.adjust(x, dx);
    this.adjust(y, dy);
  }

  adjust(root: Node, diff: number) { // root in nodes
    this.inputs.forEach(node => { node.diff = 0; });
    this.nodes.forEach(node => { if (node.kind !== 'const') node.diff = 0; });

    if (root.kind === 'const') return;
    root.diff = 1;
    this.nodes.toReversed().forEach(evaluate_diff);

    // gradient descent
    let sum_square = this.inputs.map(node => node.diff).reduce((acc, g) => acc + g*g, 0);
    this.inputs.forEach(node => { node.value += node.diff / sum_square * diff; });

    this.nodes.forEach(evaluate);
  }

  render(ctx: CanvasCtx) {
    this.curves.forEach(curve => curve.render(ctx));
  }
}

function evaluate(node: Node) {
  switch (node.kind) {
    case 'base':
    case 'const':
      break;
    case 'neg':
    case 'rec':
    case 'exp':
    case 'log':
    case 'sin':
    case 'cos':
    case 'tan':
      node.value = unary_op(node.kind, node.arg.value as number);
      break;
    case 'add':
    case 'sub':
    case 'mul':
    case 'div':
    case 'pow':
      node.value = binary_op(node.kind, node.lhs.value as number, node.rhs.value as number);
      break;
  }
}

function evaluate_diff(node: Node) {
  if (node.kind === 'const') return;
  let diff = node.diff;
  switch (node.kind) {
    case 'base':
      break;
    case 'neg':
      update_diff(node.arg, -diff);
      break;
    case 'rec': {
      let x = node.arg.value as number;
      update_diff(node.arg, -diff / x**2);
      break;
    }
    case 'exp':
      update_diff(node.arg, node.value * diff);
      break;
    case 'log':
      update_diff(node.arg, diff / (node.arg.value as number));
      break;
    case 'sin':
      update_diff(node.arg, Math.cos(node.arg.value as number) * diff);
      break;
    case 'cos':
      update_diff(node.arg, -Math.sin(node.arg.value as number) * diff);
      break;
    case 'tan':
      update_diff(node.arg, diff / Math.cos(node.arg.value as number)**2);
      break;
    case 'add':
      update_diff(node.lhs, diff);
      update_diff(node.rhs, diff);
      break;
    case 'sub':
      update_diff(node.lhs, diff);
      update_diff(node.rhs, -diff);
      break;
    case 'mul':
      update_diff(node.lhs, node.rhs.value as number * diff);
      update_diff(node.rhs, node.lhs.value as number * diff);
      break;
    case 'div':
      let x = node.lhs.value as number;
      let y = node.rhs.value as number;
      update_diff(node.lhs, diff / y);
      update_diff(node.rhs, -x / y**2 * diff);
      break;
    case 'pow': {
      let x = node.lhs.value as number;
      let y = node.rhs.value as number;
      update_diff(node.lhs, y * x**(y-1) * diff);
      update_diff(node.rhs, node.value * Math.log(x) * diff);
      break;
    }
  }
}

function update_diff(node: Node, diff: number) {
  if (node.kind !== 'const') node.diff += diff;
}

let a: Node = { kind: 'base', value: -2, diff: 0 };
let x: Node = { kind: 'base', value: 3, diff: 0 };
let b: Node = { kind: 'base', value: 4, diff: 0 };
let n1: Node = { kind: 'mul', value: 0, diff: 0, lhs: a, rhs: x };
let n2: Node = { kind: 'add', value: 0, diff: 0, lhs: n1, rhs: b };
export let graph1 = new CompGraph([a, x, b], [n1, n2], [[n1, n2]], []);

let w1: Node = { kind: 'base', value: 1, diff: 0 };
let x1: Node = { kind: 'base', value: 1, diff: 0 };
let w2: Node = { kind: 'base', value: 0.5, diff: 0 };
let x2: Node = { kind: 'base', value: -1, diff: 0 };
let c1: Node = { kind: 'const', value: -1 };
let c2: Node = { kind: 'const', value: 1 };
let c3: Node = { kind: 'const', value: -1 };
let m1: Node = { kind: 'mul', value: 0, diff: 0, lhs: w1, rhs: x1 };
let m2: Node = { kind: 'mul', value: 0, diff: 0, lhs: w2, rhs: x2 };
let m3: Node = { kind: 'add', value: 0, diff: 0, lhs: m1, rhs: m2 };
let m4: Node = { kind: 'mul', value: 0, diff: 0, lhs: m3, rhs: c1 };
let m5: Node = { kind: 'exp', value: 0, diff: 0, arg: m4 };
let m6: Node = { kind: 'add', value: 0, diff: 0, lhs: m5, rhs: c2 };
let m7: Node = { kind: 'rec', value: 0, diff: 0, arg: m6 };
let m8: Node = { kind: 'log', value: 0, diff: 0, arg: m7 };
let m9: Node = { kind: 'mul', value: 0, diff: 0, lhs: m8, rhs: c3 };
export let graph2 = new CompGraph([w1, x1, w2, x2], [c1, c2, c3, m1, m2, m3, m4, m5, m6, m7, m8, m9], [[c1, m9]], []);
