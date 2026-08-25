import './CodeEditor.css';
import { useState, useEffect } from 'react';

function CodeEditor({ height, width, code, msg, setCode }: { height: number; width: number; code: string; msg: string; setCode: React.Dispatch<React.SetStateAction<string>> }) {
  const [cursorPos, setCursorPos] = useState(-1);
  const indent = 4;

  const [dragged, setDragged] = useState(false);
  const [borderY, setBorderY] = useState(400);

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
    <div id="pane"
      style={{width}}
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
        style={{width, top: borderY - 2.5}}
        onMouseDown={() => setDragged(true)}
        onMouseUp={() => setDragged(false)}
      />
      <p id="report"
        style={{height: height - borderY}}
      >{msg}</p>
    </div>
  );
}

export default CodeEditor;