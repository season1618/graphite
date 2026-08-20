import './CodeEditor.css';
import { useState, useEffect, useContext } from 'react';
import { BorderContext } from '../App';
import { tokenize } from './lexer.ts';

function CodeEditor() {
  const [code, setCode] = useState('(define x 0)\n(+ (* x x) (* x 2) 1)');
  const [cursorPos, setCursorPos] = useState(-1);
  const borderX = useContext(BorderContext)[0];
  const indent = 4;

  useEffect(
    () => {
      const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
      textarea.focus();
      textarea.setSelectionRange(cursorPos, cursorPos);
    },
    [cursorPos]
  )

  function format(pos: number, nextCode: string) {
    pos -= 1;
    if (code.length < nextCode.length) {
      switch (nextCode[pos]) {
        case '(':
          nextCode = nextCode.substring(0, pos + 1) + ')' + nextCode.substring(pos + 1, nextCode.length);
          break;
        case ')':
          if (pos + 1 < nextCode.length && nextCode[pos + 1] === ')') nextCode = code;
          break;
        case '\'':
          if (pos + 1 < nextCode.length && nextCode[pos + 1] === '\'') nextCode = code;
          else nextCode = nextCode.substring(0, pos + 1) + '\'' + nextCode.substring(pos + 1, nextCode.length);
          break;
      }
    }
    setCode(nextCode);
    setCursorPos(pos + 1);
  }

  function formatTab(pos: number) {
    let nextCode = code.substring(0, pos) + ' '.repeat(indent) + code.substring(pos, code.length);
    setCode(nextCode);
    setCursorPos(pos + indent);
  }

  return (
    <div id="editor">
      <textarea
        style={{width: borderX - 10}}
        value={code}
        onChange={
          (e) => {
            format(e.target.selectionStart, e.target.value);
            console.log(tokenize(e.target.value));
          }
        }
        onKeyDown={
          (e) => {
            if (e.key === 'Tab') {
              e.preventDefault();
              const target = e.target as HTMLTextAreaElement;
              formatTab(target.selectionStart);
            }
          }
        }
      />
    </div>
  );
}

export default CodeEditor;