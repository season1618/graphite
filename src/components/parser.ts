import type { Token, TokenKind, Expr } from './data.ts';
import isEqual from "lodash/isEqual";

export function parse(tokens: Token[]): Expr {
  let parser = new Parser(tokens);
  return parser.expr();
}

class Parser {
  tokens: Token[];
  pos: number;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
    this.pos = 0;
  }

  expr(): Expr {
    return this.let();
  }

  let(): Expr {
    if (this.consume_if({ kind: 'keyword', value: 'var' })) {
      let name = this.ident();
      this.consume({ kind: 'punct', value: '=' });
      let expr1 = this.let();
      this.consume({ kind: 'punct', value: ';' });
      let expr2 = this.let();
      return { kind: 'let', name, expr1, expr2 };
    }
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
    let token = this.current().token;
    if (this.consume_if({ kind: 'punct', value: '(' })) {
      let expr = this.expr();
      this.consume({ kind: 'punct', value: ')' });
      return expr;
    }
    switch (token.kind) {
      case 'ident':
        this.pos++;
        return { kind: 'var', name: token.value };
      case 'num':
        this.pos++;
        return { kind: 'num', value: token.value };
      default:
        throw { kind: 'not primary expression', token: this.current() };
    }
  }

  current(): Token {
    if (this.pos < this.tokens.length) {
      return this.tokens[this.pos];
    } else {
      let { line, colr: col } = this.tokens[this.tokens.length - 1];
      throw { kind: 'No Token', line, col };
    }
  }

  consume_if(expected: TokenKind): boolean {
    try {
      let actual = this.current().token;
      if (isEqual(expected, actual)) {
        this.pos++;
        return true;
      } else {
        return false;
      }
    } catch (err) {
      return false;
    }
  }

  consume(expected: TokenKind) {
    let actual = this.current().token;
    if (isEqual(expected, actual)) {
      this.pos++;
      return;
    } else {
      throw { kind: 'Unexpected Token', expected, actual: this.current() };
    }
  }

  ident(): string {
    let token = this.current().token;
    if (token.kind == 'ident') {
      this.pos++;
      return token.value;
    } else {
      throw { kind: 'not identifier', token };
    }
  }
} 
