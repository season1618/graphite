import './App.css';
import { useState, useEffect } from 'react';
import CodeEditor from './components/CodeEditor';
import Canvas from './components/Canvas';

import { type Prog, type Error, show_error, show_token_list } from './components/data.ts';
import { tokenize } from './components/lexer.ts';
import { parse } from './components/parser.ts';
import { graph1, graph2 } from './components/comp_graph.ts';

function App() {
  const [dragged, setDragged] = useState<boolean>(false);
  const [borderX, setBorderX] = useState<number>(window.innerWidth / 2);
  const width = 5;

  const [code, setCode] = useState('var r = 100;\nvar f = x -> (r * cos x, r * sin x);\ncurve(f, (-3, 3));');
  const [msg, setMsg] = useState('');
  const [prog, setProg] = useState<Prog>([]);

  useEffect(
    () => {
      try {
        let tokens = tokenize(code);
        let prog_next = parse(tokens);
        setProg(prog_next);
        setMsg(show_token_list(tokens));

        graph1.evaluate([-2, 3, 4]);
        graph1.adjust_point(graph1.outputs[0], [0, 1]);
        console.log(graph1);
        graph2.evaluate([1, 1, 0.5, -1]);
        graph2.adjust_point(graph2.outputs[0], [1, 0.1]);
        console.log(graph2);
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
      <nav style={{ height: 60 }}><h2>Graphite</h2></nav>
      <div id="flex"
        style={{ height: window.innerHeight - 60 }}
        onMouseMove={
          (e) => {
            if (dragged) setBorderX(e.clientX);
          }
        }
      >
        <CodeEditor height={window.innerHeight - 60} width={borderX} code={code} msg={msg} setCode={setCode}/>
        <div id="border"
          style={{left: borderX - width/2, width }}
          onMouseDown={() => setDragged(true)}
          onMouseUp={() => setDragged(false)}
        />
        <Canvas height={window.innerHeight - 60} width={window.innerWidth - borderX} prog={prog}/>
      </div>
    </div>
  );
}

export default App;