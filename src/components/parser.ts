import type { Token, TokenKind, Prog, Stmt, Expr, Pattern } from './data.ts';
import isEqual from "lodash/isEqual";

export function parse(tokens: Token[]): Prog {
  console.log('parse');
  let parser = new Parser(tokens);
  return parser.prog();
}

class Parser {
  tokens: Token[];
  pos: number;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
    this.pos = 0;
  }

  prog(): Prog {
    let prog = [];
    while (this.pos < this.tokens.length) {
      prog.push(this.stmt());
    }
    return prog;
  }

  stmt(): Stmt {
    if (this.consume_if({ kind: 'keyword', value: 'put' })) {
      let trans = this.expr();
      this.consume({ kind: 'punct', value: ':' });
      let stmts: Stmt[] = [];
      while (!this.consume_if({ kind: 'keyword', value: 'end' })) {
        stmts.push(this.stmt());
      }
      return { kind: 'put', trans, stmts };
    }
    if (this.consume_if({ kind: 'keyword', value: 'let' })) {
      let name = this.ident();
      let params: Pattern[] = [];
      while (!this.consume_if({ kind: 'punct', value: '=' })) {
        params.push(this.pattern());
      }
      let body0 = this.expr();
      this.consume({ kind: 'punct', value: ';' });

      let expr: Expr = params.reduceRight((body, param) => { return { kind: 'abs', param, body }; }, body0);
      return { kind: 'let', name, expr };
    } else {
      let expr = this.expr();
      this.consume({ kind: 'punct', value: ';' });
      return expr;
    }
  }

  expr(): Expr {
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
        let arg = this.prim();
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
    if (this.consume_if({ kind: 'keyword', value: 'exp' })) {
      return { kind: 'exp', arg: this.unary() };
    }
    if (this.consume_if({ kind: 'keyword', value: 'log' })) {
      return { kind: 'log', arg: this.unary() };
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

        let expr: Expr = exprs.length === 1 ? exprs[0] : { kind: 'tuple', exprs };

        try {
          let param = expr_to_pattern(expr);
          if (this.consume_if({ kind: 'punct', value: '->' })) {
            let body = this.expr();
            return { kind: 'abs', param, body };
          } else {
            return expr;
          }
        } catch {
          return expr;
        }
      }
    }
    switch (token.kind) {
      case 'ident':
        let name = token.value;
        this.pos++;
        if (this.consume_if({ kind: 'punct', value: '->' })) {
          let body = this.expr();
          return { kind: 'abs', param: name, body };
        } else {
          return { kind: 'var', name };
        }
      case 'num':
        this.pos++;
        if (this.consume_if({ kind: 'punct', value: '?' })) return { kind: 'param', token };
        else return { kind: 'num', value: token.value };
      default:
        throw { kind: 'not primary expression', token: this.current() };
    }
  }

  pattern(): Pattern {
    if (this.consume_if({ kind: 'punct', value: '(' })) {
      if (this.consume_if({ kind: 'punct', value: ')' })) {
        return [];
      } else {
        let pats = [this.pattern()];
        while (this.consume_if({ kind: 'punct', value: ',' })) {
          pats.push(this.pattern());
        }
        this.consume({ kind: 'punct', value: ')' });

        return pats.length === 1 ? pats[0] : pats;
      }
    } else {
      return this.ident();
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

function expr_to_pattern(expr: Expr): Pattern {
  switch (expr.kind) {
    case 'var':
      return expr.name;
    case 'tuple':
      return expr.exprs.map(expr_to_pattern);
    default:
      throw undefined;
  }
}
