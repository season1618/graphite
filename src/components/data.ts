export type TokenKind = Keyword | Punct | Ident | Num;
export type Token = {
  line: number;
  coll: number;
  colr: number;
  token: TokenKind;
};

interface Keyword { kind: 'keyword', value: string }
interface Punct { kind: 'punct', value: string }
interface Ident { kind: 'ident', value: string }

export interface Num { kind: 'num', value: number }

export type Expr = Block | Let | Add | Sub | Mul | Div | Pow | App | Var | Num | Tuple

interface Block { kind: 'block', exprs: Expr[] }
interface Let { kind: 'let', name: string, expr1: Expr, expr2: Expr }
interface Add { kind: 'add', lhs: Expr, rhs: Expr }
interface Sub { kind: 'sub', lhs: Expr, rhs: Expr }
interface Mul { kind: 'mul', lhs: Expr, rhs: Expr }
interface Div { kind: 'div', lhs: Expr, rhs: Expr }
interface Pow { kind: 'pow', lhs: Expr, rhs: Expr }
interface App { kind: 'app', e1: Expr, e2: Expr }
interface Var { kind: 'var', name: string }
interface Tuple { kind: 'tuple', exprs: Expr[] }

export type Error
  = InvalidToken | NoToken | UnexpectedToken | NotPrim | NotIdent
  | NotFound;

interface InvalidToken { kind: 'Invalid Token', line: number, col: number };
interface NoToken { kind: 'No Token', line: number, col: number };
interface UnexpectedToken { kind: 'Unexpected Token', expected: TokenKind, actual: Token };
interface NotPrim { kind: 'not primary expression', token: Token };
interface NotIdent { kind: 'not identifier', token: Token };

interface NotFound { kind: 'Not Found', name: string };

export function show_token_list(tokens: Token[]): string {
  return tokens
    .map(token => show_token(token))
    .join(', ');
}

export function show_token(token_pos: Token): string {
  let token = token_pos.token;
  return `${token.kind} ${token.value}`;
}

function show_token_kind(token: TokenKind): string {
  return `${token.value}`;
}

export function show_error(err: Error, code: string): string {
  switch (err.kind) {
    case 'Invalid Token':
    case 'No Token': {
      let { line, col } = err;
      return 'Syntax Error\n' +
        `${err.kind}\n` +
        `line ${line}, col ${col}\n` +
        `${code.split('\n')[line-1]}\n` +
        `${' '.repeat(col)}^\n`;
    }
    case 'Unexpected Token': {
      let { expected, actual: { line, coll: col, token: actual} } = err;
      return 'Syntax Error\n' +
        `${err.kind}: excpected "${show_token_kind(expected)}", actual "${show_token_kind(actual)}"\n` +
        `line ${line}, col ${col}\n` +
        `${code.split('\n')[line-1]}\n` +
        `${' '.repeat(col)}^\n`;
    }
    case 'not primary expression':
    case 'not identifier':
      let { token: { line, coll: col } } = err;
      return 'Syntax Error\n' +
        `${err.kind}\n` +
        `line ${line}, col ${col}\n` +
        `${code.split('\n')[line-1]}\n` +
        `${' '.repeat(col)}^\n`;
    case 'Not Found':
      return 'Runtime Error\n' +
        `"${err.name}" is not found\n`;
        // `line ${line}, col ${col}\n` +
        // `${code.split('\n')[line-1]}\n` +
        // `${' '.repeat(col)}^\n`;
  }
}
