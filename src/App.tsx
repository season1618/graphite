import './App.css';
import { useState, useEffect } from 'react';
import CodeEditor from './components/CodeEditor';
import Canvas from './components/Canvas';

import { type Expr, type Error, show_error, show_token_list } from './components/data.ts';
import { tokenize } from './components/lexer.ts';
import { parse } from './components/parser.ts';

function App() {
  const [dragged, setDragged] = useState<boolean>(false);
  const [borderX, setBorderX] = useState<number>(window.innerWidth / 2);
  const width = 5;

  const [code, setCode] = useState('var r = 100;\nvar f = x -> (r * cos x, r * sin x);\ncurve(f, (-3, 3))');
  const [msg, setMsg] = useState('');
  const [expr, setExpr] = useState<Expr>({ kind: 'block', exprs: [] });

  useEffect(
    () => {
      try {
        let tokens = tokenize(code);
        let expr_next = parse(tokens);
        setExpr(expr_next);
        setMsg(show_token_list(tokens));
      } catch (err: any) {
        if ('kind' in err) {
          setMsg(show_error(err as Error, code));
        } else {
          console.log(err);
        }
      }
    },
    [code]
  )

  return (
    <div id="app">
      <nav><h2>Graphite</h2></nav>
      <div id="flex"
        onMouseMove={
          (e) => {
            if (dragged) setBorderX(e.clientX);
          }
        }
      >
        <CodeEditor width={borderX} code={code} msg={msg} setCode={setCode}/>
        <div id="border"
          style={{left: borderX - width/2, width }}
          onMouseDown={() => setDragged(true)}
          onMouseUp={() => setDragged(false)}
        />
        <Canvas width={window.innerWidth - borderX} expr={expr}/>
      </div>
    </div>
  );
}

export default App;