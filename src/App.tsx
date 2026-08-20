import './App.css';
import { useState, createContext } from 'react';
import CodeEditor from './components/CodeEditor';
import Canvas from './components/Canvas';
import DragHandle from './components/DragHandle';

export const DragContext = createContext<[boolean, (dragged: boolean) => void]>([false, () => {}])
export const BorderContext = createContext<[number, (borderX: number) => void]>([0, () => {}])

function App() {
  const [dragged, setDragged] = useState<boolean>(false);
  const [borderX, setBorderX] = useState<number>(window.innerWidth / 2);

  return (
    <div id="app">
      <nav><h2>Graphite</h2></nav>
      <div id="flex"
        onMouseMove={
          (e) => {
            if (dragged) {
              setBorderX(e.clientX);
            }
          }
        }
      >
        <DragContext.Provider value={[dragged, setDragged]}>
          <BorderContext.Provider value={[borderX, setBorderX]}>
            <CodeEditor /><DragHandle /><Canvas />
          </BorderContext.Provider>
        </DragContext.Provider>
        
      </div>
    </div>
  );
}

export default App;