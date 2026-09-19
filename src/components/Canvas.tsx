import { useState, useEffect } from 'react';
import { type Token, type Prog } from './data.ts';
import { serialize } from './lexer.ts';
import { compile } from './compiler.ts';
import { type D, CompGraph, get_value } from './comp_graph.ts';

function Canvas({ height, width, setCode, tokens, prog }: { height: number; width: number; setCode: React.Dispatch<React.SetStateAction<string>>; tokens: Token[], prog: Prog }) {
  const [mousePressed, setMousePressed] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [mouseFocus, setMouseFocus] = useState<D | undefined>(undefined);

  const [origin, setOrigin] = useState({ x: width/2, y: height/2 });
  const [logScale, setLogScale] = useState(0);

  const [comp_graph, setCompGraph] = useState(new CompGraph([], [], [], []));

  function updateMousePos(x: number, y: number) {
    if (mousePressed) {
      if (mouseFocus === undefined) setOrigin({ x: origin.x + x - mousePos.x, y: origin.y + y - mousePos.y });
      else {
        const canvas = document.querySelector('canvas') as HTMLCanvasElement;
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;

        const context = canvas.getContext('2d') as CanvasRenderingContext2D;
        context.font = '20px Consolas';
        context.textAlign = 'center';
        context.textBaseline = 'middle';

        context.resetTransform();
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.translate(origin.x, origin.y);
        context.scale(1, -1);

        let mouse_x = mousePos.x - origin.x;
        let mouse_y = -(mousePos.y - origin.y);
        try {
          comp_graph.adjust_point(mouseFocus, [mouse_x, mouse_y]);
          setCode(serialize(tokens));
          comp_graph.render(context);
        } catch (err) {
          console.log(err);
        }
      }
    }
    setMousePos({ x, y });
  }

  function updateScale(delta: number) {
    let nextX = mousePos.x + Math.pow(1.1, delta/100) * (origin.x - mousePos.x);
    let nextY = mousePos.y + Math.pow(1.1, delta/100) * (origin.y - mousePos.y);
    let nextLogScale = logScale + delta / 100;
    if (-50 < nextLogScale && nextLogScale < 50) {
      setOrigin({ x: nextX, y: nextY });
      setLogScale(nextLogScale);
    }
  }

  useEffect(
    () => {
      try {
        let graph = compile(prog, Math.pow(1.1, logScale));
        setCompGraph(graph);
      } catch (err) {
        console.log(err);
      }
    },
    [logScale, prog]
  );

  useEffect(
    () => {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;

      const context = canvas.getContext('2d') as CanvasRenderingContext2D;
      context.font = '20px Consolas';
      context.textAlign = 'center';
      context.textBaseline = 'middle';

      context.resetTransform();
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.translate(origin.x, origin.y);
      context.scale(1, -1);

      try{
        comp_graph.compute();
        console.log(comp_graph);
        comp_graph.render(context);
      } catch (err) {
        console.log(err);
      }
    },
    [width, height, origin, comp_graph]
  );

  return (
    <canvas
      style={{width}}
      onMouseDown={() => {
        setMousePressed(true);
        let mouse_x = mousePos.x - origin.x;
        let mouse_y = -(mousePos.y - origin.y);
        setMouseFocus(comp_graph.points.find(([x, y]: D) => Math.hypot(get_value(x) as number - mouse_x, get_value(y) as number - mouse_y) < 5));
      }}
      onMouseUp={() => setMousePressed(false)}
      onMouseMove={
        (e) => {
          let target = e.currentTarget.getBoundingClientRect();
          updateMousePos(e.clientX - target.left, e.clientY - target.top);
        }
      }
      onWheel={(e) => updateScale(-e.deltaY)}
    ></canvas>
  )
}

export default Canvas;