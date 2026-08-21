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
    return this.prim();
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

  consume(token: TokenKind): boolean {
    if (this.tokens[this.pos].token === token) {
      this.pos++;
      return true;
    } else {
      return false;
    }
  }
} 
