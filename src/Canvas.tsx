import { useEffect, useRef, useState } from "react"
import * as perfect from "perfect-freehand"
import type { Point, Path } from "./schema/path"
import { getSvgPathFromStroke } from "./drawing/path-tools"
import { Simplify } from "simplify-ts"

function Canvas() {

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [paths, setPaths] = useState<Path[]>([])
  const [currentPath, setCurrentPath] = useState<Path | null>(null)

  const onMouseDown = (e: React.MouseEvent) => {
    const path: Path = { points: [[e.pageX, e.pageY]] }
    setCurrentPath(path)
    console.log('onMouseDown', currentPath)
  }

  const onMouseMove = (e: React.MouseEvent) => {
    if (!currentPath) { return }
    setCurrentPath({
      points: [...currentPath.points, [e.pageX, e.pageY]]
    })
    console.log('onMouseMove', currentPath)
  }

  const onMouseUp = (e: React.MouseEvent) => {
    if(!currentPath) { return }

    const simplifiedPoints = Simplify([...currentPath.points, [e.pageX, e.pageY]].map(p => ({ x: p[0], y:p[1] }))).map(p => [p.x, p.y] as Point)
    paths.push({ points: simplifiedPoints })
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

    console.log('re-rendering paths', paths)

    for (const path of paths) {
      const stroke = perfect.getStroke(path.points) as Point[]
      const svg = getSvgPathFromStroke(stroke)
      const path2d = new Path2D(svg)
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