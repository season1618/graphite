import './CodeEditor.css';
import { useState, useEffect, useContext } from 'react';
import { BorderContext } from '../App';
import { type SyntaxErr, show_syntax_error, show_token_list } from './data.ts';
import { tokenize } from './lexer.ts';
import { parse } from './parser.ts';

function CodeEditor() {
  const [code, setCode] = useState('var x = 1 / (1 + 1 * e^x)');
  const [cursorPos, setCursorPos] = useState(-1);
  const [msg, setMsg] = useState('');
  const borderX = useContext(BorderContext)[0];
  const indent = 4;

  const [dragged, setDragged] = useState(false);
  const [borderY, setBorderY] = useState(200);

  const paneHeight = window.innerHeight - 60;

  useEffect(
    () => {
      const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
      textarea.focus();
      textarea.setSelectionRange(cursorPos, cursorPos);
    },
    [cursorPos]
  )

  useEffect(
    () => {
      try {
        let tokens = tokenize(code);
        let expr = parse(tokens);
        setMsg(show_token_list(tokens));
      } catch (err: any) {
        if ('kind' in err) {
          setMsg(show_syntax_error(err as SyntaxErr, code));
        } else {
          console.log(err);
        }
      }
    },
    [code]
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
    <div id="pane"
      style={{width: borderX}}
      onMouseMove={
          (e) => {
            if (dragged) {
              setBorderY(e.clientY - e.currentTarget.getBoundingClientRect().top);
            }
          }
        }
    >
      <textarea id="editor"
        style={{ height: borderY }}
        value={code}
        onChange={
          (e) => {
            let code = e.target.value;
            format(e.target.selectionStart, code);
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
      <div id="drag_handle_h"
        style={{width: borderX, top: borderY - 2.5}}
        onMouseDown={() => setDragged(true)}
        onMouseUp={() => setDragged(false)}
      />
      <p id="report"
        style={{height: paneHeight - borderY}}
      >{msg}</p>
    </div>
  );
}

export default CodeEditor;