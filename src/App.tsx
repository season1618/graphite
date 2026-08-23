import './App.css';
import { useState } from 'react';
import CodeEditor from './components/CodeEditor';
import Canvas from './components/Canvas';
import DragHandle from './components/DragHandle';

function App() {
  const [dragged, setDragged] = useState<boolean>(false);
  const [borderX, setBorderX] = useState<number>(window.innerWidth / 2);

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
        <CodeEditor borderX={borderX}/>
        <DragHandle borderX={borderX} setDragged={setDragged}/>
        <Canvas borderX={borderX}/>
      </div>
    </div>
  );
}

export default App;