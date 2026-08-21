import type { Token, TokenKind, Expr } from './data.ts';

export function parse(tokens: Token[]): Expr {
  let parser = new Parser(tokens);
  return parser.parse();
}

class Parser {
  tokens: Token[];
  pos: number;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
    this.pos = 0;
  }

  parse(): Expr {
    return this.add();
  }

  add(): Expr {
    let lhs = this.mul();
    while (true) {
      if (this.consume_if({ kind: 'punct', value: '+' })) {
        let rhs = this.mul();
        lhs = { kind: 'add', lhs, rhs };
        continue;
      }
      if (this.consume_if({ kind: 'punct', value: '-' })) {
        let rhs = this.mul();
        lhs = { kind: 'sub', lhs, rhs };
        continue;
      }
      break;
    }
    return lhs;
  }

  mul(): Expr {
    let lhs = this.pow();
    while (true) {
      if (this.consume_if({ kind: 'punct', value: '*' })) {
        let rhs = this.pow();
        lhs = { kind: 'mul', lhs, rhs };
        continue;
      }
      if (this.consume_if({ kind: 'punct', value: '/' })) {
        let rhs = this.pow();
        lhs = { kind: 'div', lhs, rhs };
        continue;
      }
      break;
    }
    return lhs;
  }

  pow(): Expr {
    let lhs = this.prim();
    while (this.consume_if({ kind: 'punct', value: '^' })) {
      let rhs = this.prim();
      lhs = { kind: 'pow', lhs, rhs };
    }
    return lhs;
  }

  prim(): Expr {
    let token = this.tokens[this.pos].token;
    switch (token.kind) {
      case 'ident':
        this.pos++;
        return { kind: 'var', name: token.value };
      case 'num':
        this.pos++;
        return { kind: 'num', value: token.value };
      default:
        throw { kind: 'not primary expression', token: this.tokens[this.pos] };
    }
  }

  consume_if(token: TokenKind): boolean {
    if (this.tokens[this.pos].token === token) {
      this.pos++;
      return true;
    } else {
      return false;
    }
  }
} 
