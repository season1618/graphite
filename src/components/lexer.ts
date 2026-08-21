import type { Token, TokenKind } from './data.ts';

const keywords = ["var"];
const puncts = ["[", "]", "{", "}", "(", ")", "==", "=", "+", "-", "*", "/", "^"];

function tokenize(code: string): Token[] {
  let tokens: Token[] = [];
  let line = 1;
  let col = 0;
  let i = 0;
  while (i < code.length) {
    if (code[i] == '\n') {
      i++;
      line++;
      col = 0;
      continue;
    }

    if (is_whitespace(code[i])) {
      i++;
      col++;
      continue;
    }

    let punct = find_punct(code[i]);
    if (punct !== undefined) {
      let len = punct.length;
      tokens.push({ 
        line, coll: col, colr: col + len,
        token: { kind: 'punct', value: punct }
      });
      i += len;
      col += len;
      continue;
    }

    if (is_numeric(code[i])) {
      let [n, len] = find_numeric(code.substring(i));
      tokens.push({ 
        line, coll: col, colr: col + len,
        token: { kind: 'num', value: n }
      });
      i += len;
      col += len;
      continue;
    }

    if (is_alphanumeric_(code[i])) {
      let [ident, len] = find_ident(code.substring(i));
      let keyword = find_keyword(code.substring(i));
      let token: TokenKind = keyword !== undefined ?
        { kind: 'keyword', value: keyword } :
        { kind: 'ident', value: ident };
      tokens.push({ 
        line, coll: col, colr: col + len,
        token
      });
      i += len;
      col += len;
      continue;
    }
    throw { kind: 'Invalid Token', line, col };
  }
  return tokens;
}

function is_whitespace(str: string): boolean {
  return [' ', '\n', '\t', '\v', '\f', '\r'].includes(str);
}

function is_numeric(str: string): boolean {
  return /^[0-9]$/.test(str);
}

function is_alphanumeric_(str: string): boolean {
  return /^[A-Za-z]$/.test(str) || is_numeric(str) || str === '_';
}

function find_keyword(str: string): string | undefined {
  return keywords.find((keyword) => str.startsWith(keyword))
}

function find_punct(str: string): string | undefined {
  return puncts.find((punct) => str.startsWith(punct));
}

function find_numeric(str: string): [number, number] {
  let i = 0;
  let n = 0;
  while (is_numeric(str[i])) {
    n = 10 * n + Number(str[i]);
    i++;
  }
  return [n, i];
}

function find_ident(str: string): [string, number] {
  let i = 0;
  while (is_alphanumeric_(str[i])) {
    i++;
  }
  return [str.substring(0, i), i];

}

export { tokenize };