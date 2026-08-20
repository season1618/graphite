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

export type SyntaxErrKind = UnexpectToken;
export type SyntaxErr = {
  line: number;
  col: number;
  err: SyntaxErrKind;
}

interface UnexpectToken { kind: 'Unexpected Token' };
