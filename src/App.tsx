import './App.css';
import { useState, useEffect } from 'react';
import CodeEditor from './components/CodeEditor';
import Canvas from './components/Canvas';

import { type Token, type Prog, type Error, show_error, show_prog } from './components/data.ts';
import { tokenize } from './components/lexer.ts';
import { parse } from './components/parser.ts';

function App() {
  const [dragged, setDragged] = useState<boolean>(false);
  const [borderX, setBorderX] = useState<number>(window.innerWidth / 2);
  const width = 5;

  const [code, setCode] = useState(
`let scale s (x, y) = (s * x, s * y);
let polar (r, th) = (r * cos th, r * sin th);
put scale 10:
  put polar:
    let spiral a th = (a * th, th);
    curve(spiral 1?, (0, 5? * 6.28));
    end
  end
`);
  const [msg, setMsg] = useState('');
  const [tokens, setTokens] = useState<Token[]>([]);
  const [prog, setProg] = useState<Prog>([]);

  useEffect(
    () => {
      setTokens(tokenize(code));
    },
    []
  );

  useEffect(
    () => {
      try {
        let prog = parse(tokens);
        setProg(prog);
        setMsg(show_prog(prog));
      } catch (err: any) {
        if ('kind' in err) {
          setMsg(show_error(err as Error, code));
        } else {
          console.log(err);
        }
      }
    },
    [tokens]
  )

  return (
    <div id="app">
      <nav style={{ height: 60 }}><h2>Graphite</h2></nav>
      <div id="flex"
        style={{ height: window.innerHeight - 60 }}
        onMouseMove={
          (e) => {
            if (dragged) setBorderX(e.clientX);
          }
        }
      >
        <CodeEditor height={window.innerHeight - 60} width={borderX} code={code} msg={msg} setCode={setCode} setMsg={setMsg} setTokens={setTokens}/>
        <div id="border"
          style={{left: borderX - width/2, width }}
          onMouseDown={() => setDragged(true)}
          onMouseUp={() => setDragged(false)}
        />
        <Canvas height={window.innerHeight - 60} width={window.innerWidth - borderX} setCode={setCode} tokens={tokens} prog={prog}/>
      </div>
    </div>
  );
}

export default App;