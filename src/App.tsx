import './App.css';
import { useState } from 'react';
import CodeEditor from './components/CodeEditor';
import Canvas from './components/Canvas';

function App() {
  const [dragged, setDragged] = useState<boolean>(false);
  const [borderX, setBorderX] = useState<number>(window.innerWidth / 2);
  const width = 5;

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
        <CodeEditor width={borderX}/>
        <div id="border"
          style={{left: borderX - width/2, width }}
          onMouseDown={() => setDragged(true)}
          onMouseUp={() => setDragged(false)}
        />
        <Canvas width={window.innerWidth - borderX}/>
      </div>
    </div>
  );
}

export default App;