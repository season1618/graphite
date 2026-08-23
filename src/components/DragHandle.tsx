import './DragHandle.css';

function DragHandle({ borderX, setDragged }: { borderX: number; setDragged: React.Dispatch<React.SetStateAction<boolean>> }) {
  const width = 5;

  return (
    <div id="draghandle"
      style={{left: borderX - width/2, width }}
      onMouseDown={() => setDragged(true)}
      onMouseUp={() => setDragged(false)}
    ></div>
  );
}

export default DragHandle;