import type { Token, TokenKind } from './data.ts';

const keywords = ["put", "end", "let", "exp", "log", "sin", "cos", "tan"];
const puncts = ["[", "]", "{", "}", "(", ")", "->", "==", "=", "+", "-", "*", "/", "^", ",", "?", ":", ";"];

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

    let punct = find_punct(code.substring(i));
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
      let token: TokenKind = keywords.includes(ident) ?
        { kind: 'keyword', value: ident } :
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

function find_punct(str: string): string | undefined {
  return puncts.find((punct) => str.startsWith(punct));
}

function find_numeric(str: string): [number, number] {
  let i = 0;
  let n = 0;
  let power = 1;
  while (is_numeric(str[i])) {
    n = 10 * n + Number(str[i]);
    i++;
  }
  if (str[i] === '.') i++;
  while (is_numeric(str[i])) {
    power /= 10;
    n += Number(str[i]) * power;
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