import type { Closure, Ref } from './eval.ts';

type Value = number | Value[]

export type Node = Base | Const | Uni | Bin
export interface Base { kind: 'base', value: number, diff: number }
export type D = [Node, Node]
interface Const { kind: 'const', value: Value }
interface Uni { kind: 'neg' | 'rec' | 'exp' | 'log' | 'sin' | 'cos' | 'tan', value: number, diff: number, arg: Node }
interface Bin { kind: 'add' | 'sub' | 'mul' | 'div' | 'pow', value: number, diff: number, lhs: Node, rhs: Node }

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
}

export class CompGraph {
  inputs: Base[];
  nodes: Node[];
  outputs: D[];

  constructor(inputs: Base[], nodes: Node[], outputs: D[]) {
    this.inputs = inputs;
    this.nodes = nodes;
    this.outputs = outputs;
  }

  evaluate(vals: number[]) {
    for (let i = 0; i < this.inputs.length; i++) {
      this.inputs[i].value = vals[i];
    }
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
}

function evaluate(node: Node) {
  switch (node.kind) {
    case 'base':
    case 'const':
      break;
    case 'neg':
      node.value = -node.arg.value;
      break;
    case 'rec':
      node.value = 1 / (node.arg.value as number);
      break;
    case 'exp':
      node.value = Math.exp(node.arg.value as number);
      break;
    case 'log':
      node.value = Math.log(node.arg.value as number);
      break;
    case 'sin':
      node.value = Math.sin(node.arg.value as number);
      break;
    case 'cos':
      node.value = Math.cos(node.arg.value as number);
      break;
    case 'tan':
      node.value = Math.tan(node.arg.value as number);
      break;
    case 'add':
      node.value = (node.lhs.value as number) + (node.rhs.value as number);
      break;
    case 'sub':
      node.value = (node.lhs.value as number) - (node.rhs.value as number);
      break;
    case 'mul':
      node.value = (node.lhs.value as number) * (node.rhs.value as number);
      break;
    case 'div':
      node.value = (node.lhs.value as number) / (node.rhs.value as number);
      break;
    case 'pow':
      node.value = (node.lhs.value as number) ** (node.rhs.value as number);
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

let a: Node = { kind: 'base', value: 0, diff: 0 };
let x: Node = { kind: 'base', value: 0, diff: 0 };
let b: Node = { kind: 'base', value: 0, diff: 0 };
let n1: Node = { kind: 'mul', value: 0, diff: 0, lhs: a, rhs: x };
let n2: Node = { kind: 'add', value: 0, diff: 0, lhs: n1, rhs: b };
export let graph1 = new CompGraph([a, x, b], [n1, n2], [[n1, n2]]);

let w1: Node = { kind: 'base', value: 0, diff: 0 };
let x1: Node = { kind: 'base', value: 0, diff: 0 };
let w2: Node = { kind: 'base', value: 0, diff: 0 };
let x2: Node = { kind: 'base', value: 0, diff: 0 };
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
export let graph2 = new CompGraph([w1, x1, w2, x2], [c1, c2, c3, m1, m2, m3, m4, m5, m6, m7, m8, m9], [[c1, m9]]);
