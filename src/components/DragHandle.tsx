import './DragHandle.css';
import { useContext } from 'react';
import { DragContext, BorderContext } from '../App';

function DragHandle() {
  const setDragged = useContext(DragContext)[1];
  const borderX = useContext(BorderContext)[0];

  return (
    <div id="draghandle"
      style={{left: borderX - 2.5}}
      onMouseDown={() => setDragged(true)}
      onMouseUp={() => setDragged(false)}
    ></div>
  );
}

export default DragHandle;