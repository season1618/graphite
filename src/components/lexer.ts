import type { Token, TokenKind } from './data.ts';

const keywords = ["put", "end", "let", "exp", "log", "sin", "cos", "tan"];
const puncts = ["[", "]", "{", "}", "(", ")", "->", "==", "=", "+", "-", "*", "/", "^", ",", "?", ":", ";"];

export function tokenize(code: string): Token[] {
  console.log('tokenize');
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

    let spaces = 0;
    while (is_whitespace(code[i])) {
      i++;
      col++;
      spaces++;
      continue;
    }

    let punct = find_punct(code.substring(i));
    if (punct !== undefined) {
      let len = punct.length;
      tokens.push({ 
        line, coll: col, colr: col + len,
        spaces,
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
        spaces,
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
        spaces,
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
  while (is_numeric(str[i])) i++;
  if (str[i] === '.') i++;
  while (is_numeric(str[i])) i++;
  let n = parseFloat(str.substring(0, i));
  return [n, i];
}

function find_ident(str: string): [string, number] {
  let i = 0;
  while (is_alphanumeric_(str[i])) i++;
  return [str.substring(0, i), i];
}

export function serialize(tokens: Token[]): string {
  let code = '';
  let cur_line = 1;
  for (let token_ of tokens) {
    let { line, spaces, token } = token_;
    if (cur_line < line) {
      code += '\n'.repeat(line - cur_line);
      cur_line = line;
    }
    code += `${' '.repeat(spaces)}${token.value}`;
  }
  return code;
}
