export type TokenKind = Keyword | Punct | Ident | Num;
export type Token = {
    line: number;
    coll: number;
    colr: number;
    token: TokenKind;
};

interface Keyword {
  kind: 'keyword';
  value: string;
}

interface Punct {
  kind: 'punct';
  value: string;
}

interface Ident {
  kind: 'ident';
  value: string;
}

interface Num {
  kind: 'num';
  value: number;
}

export type SyntaxErrKind = InvalidToken;
export type SyntaxErr = {
  line: number;
  col: number;
  code: string;
  err: SyntaxErrKind;
};

interface InvalidToken { kind: 'Invalid Token' };

export function show_token_list(tokens: Token[]): string {
  return tokens
    .map(token => show_token(token))
    .join(', ');
}

export function show_token(token_pos: Token): string {
  let token = token_pos.token;
  return `${token.kind} ${token.value}`;
}

export function show_syntax_error(err_: SyntaxErr): string {
  let { line, col, code, err } = err_;
  return 'Syntax Error\n' +
    `${err.kind}\n` +
    `line ${line}, col ${col}\n` +
    `${code.split('\n')[line-1]}\n` +
    `${' '.repeat(col)}^\n`;
}
