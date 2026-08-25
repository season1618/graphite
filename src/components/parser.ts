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
      let expr1 = this.add();
      this.consume({ kind: 'punct', value: ';' });
      let expr2 = this.let();
      return { kind: 'let', name, expr1, expr2 };
    }
    let first = this.add();
    if (this.consume_if({ kind: 'punct', value: ';' })) {
      let next = this.let();
      return { kind: 'seq', first, next };
    }
    return first;
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
    let lhs = this.app();
    if (this.consume_if({ kind: 'punct', value: '^' })) {
      let rhs = this.pow();
      lhs = { kind: 'pow', lhs, rhs };
    }
    return lhs;
  }

  app(): Expr {
    let fun = this.unary();
    while (true) {
      let pos = this.pos;
      try{
        let arg = this.unary();
        fun = { kind: 'app', e1: fun, e2: arg };
        continue;
      } catch {
        this.pos = pos;
        break;
      }
    }
    return fun;
  }

  unary(): Expr {
    if (this.consume_if({ kind: 'punct', value: '-' })) {
      return { kind: 'neg', arg: this.unary() };
    }
    if (this.consume_if({ kind: 'keyword', value: 'sin' })) {
      return { kind: 'sin', arg: this.unary() };
    }
    if (this.consume_if({ kind: 'keyword', value: 'cos' })) {
      return { kind: 'cos', arg: this.unary() };
    }
    if (this.consume_if({ kind: 'keyword', value: 'tan' })) {
      return { kind: 'tan', arg: this.unary() };
    }
    return this.prim();
  }

  prim(): Expr {
    let token = this.current().token;
    if (this.consume_if({ kind: 'punct', value: '(' })) {
      if (this.consume_if({ kind: 'punct', value: ')' })) {
        return { kind: 'tuple', exprs: [] };
      } else {
        let exprs = [this.expr()];
        while (this.consume_if({ kind: 'punct', value: ',' })) {
          exprs.push(this.expr());
        }
        this.consume({ kind: 'punct', value: ')' });
        if (exprs.length === 1) return exprs[0];
        else return { kind: 'tuple', exprs };
      }
    }
    switch (token.kind) {
      case 'ident':
        let name = token.value;
        this.pos++;
        if (this.consume_if({ kind: 'punct', value: '->' })) {
          let body = this.add();
          return { kind: 'abs', name, body };
        } else {
          return { kind: 'var', name };
        }
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

  ident_if(): string | null {
    let token = this.current().token;
    if (token.kind == 'ident') {
      this.pos++;
      return token.value;
    } else {
      return null;
    }
  }
} 
