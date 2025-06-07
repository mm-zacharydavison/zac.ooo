import { useEffect, useRef, useState } from "react";

function Canvas() {

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [paths, setPaths] = useState<Path2D[]>([])
  const [currentPath, setCurrentPath] = useState<Path2D | null>(null)

  const onMouseDown = (e: React.MouseEvent) => {
    const path = new Path2D
    path?.moveTo(e.pageX, e.pageY)
    setCurrentPath(path)
    console.log('onMouseDown', currentPath)
  }

  const onMouseMove = (e: React.MouseEvent) => {
    if (!currentPath) { return }
    currentPath?.lineTo(e.pageX, e.pageY)
    setCurrentPath(new Path2D(currentPath))
    console.log('onMouseMove', currentPath)
  }

  const onMouseUp = (e: React.MouseEvent) => {
    if(!currentPath) { return }

    console.log('onMouseUp', currentPath)
    paths.push(currentPath)
    setPaths(paths)
    setCurrentPath(null)
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas ||!ctx) { return }

    // draw settings
    ctx.strokeStyle = '#000000'
    ctx.fillStyle = '#fffbf7'

    // Background
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)

    // Draw all paths
    if (currentPath) {
      paths.push(currentPath)
    }

    console.log('re-rendering paths', paths)

    for (const path of paths) {
      ctx.stroke(path)
    }
  }, [currentPath, paths])
7
  return <canvas 
    ref={canvasRef} 
    id="canvas" 
    width={window.innerWidth} 
    height={window.innerHeight} 
    onMouseDown={onMouseDown} 
    onMouseMove={onMouseMove} 
    onMouseUp={onMouseUp}
  />;
}

export default Canvas;