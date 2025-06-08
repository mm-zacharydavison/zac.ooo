import { useEffect, useRef, useState } from "react"
import { Path } from "./drawing/path"

function Canvas() {

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [paths, setPaths] = useState<Path[]>([])
  const [currentPath, setCurrentPath] = useState<Path | null>(null)

  const onMouseDown = (e: React.MouseEvent) => {
    const path = new Path([[e.pageX, e.pageY]])
    setCurrentPath(path)
    console.log('onMouseDown', currentPath)
  }

  const onMouseMove = (e: React.MouseEvent) => {
    if (!currentPath) { return }
    setCurrentPath(currentPath.appended([e.pageX, e.pageY]))
    console.log('onMouseMove', currentPath)
  }

  const onMouseUp = (e: React.MouseEvent) => {
    if(!currentPath) { return }

    paths.push(currentPath.simplified())
    setPaths(paths)
    setCurrentPath(null)
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas ||!ctx) { return }

    // draw settings
    ctx.fillStyle = '#fffbf7'

    // Background
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)

    // Draw all paths
    if (currentPath) {
      paths.push(currentPath)
    }

    for (const path of paths) {
      const path2d = new Path2D(path.beautified().renderToSVGPath())
      ctx.fillStyle = '#000000'
      ctx.fill(path2d)
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