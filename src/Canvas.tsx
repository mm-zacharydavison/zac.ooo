import { useState } from "react"
import { Path } from "./drawing/path"
import * as Konva from "react-konva"
import type { KonvaEventObject } from "konva/lib/Node"

function Canvas() {

  const [paths, setPaths] = useState<Path[]>([])
  const [currentPath, setCurrentPath] = useState<Path | null>(null)

  const onMouseDown = (e: KonvaEventObject<MouseEvent>) => {
    const position = e.target.getStage()?.getPointerPosition()
    if (!position) { return }

    const path = new Path([[position.x, position.y]])
    setCurrentPath(path)
  }

  const onMouseMove = (e: KonvaEventObject<MouseEvent>) => {
    const position = e.target.getStage()?.getPointerPosition()
    if (!currentPath || !position) { return }
    setCurrentPath(currentPath.appended([position.x, position.y]))
  }

  const onMouseUp = (e: KonvaEventObject<MouseEvent>) => {
    if(!currentPath) { return }

    setPaths([...paths, currentPath.simplified()])
    setCurrentPath(null)
  }

  return <Konva.Stage 
    width={window.innerWidth} 
    height={window.innerHeight}
    onMouseDown={onMouseDown}
    onMouseMove={onMouseMove}
    onMouseUp={onMouseUp}
    >
    <Konva.Layer>
      {paths.map((path) => (
        <Konva.Path
          key={path.id}
          data={path.beautified().renderToSVGPath()}
          fill='#000000'
        />
      ))}
      {currentPath && (
        <Konva.Path
          data={currentPath.beautified().renderToSVGPath()}
          fill='#000000'
        />
      )}
    </Konva.Layer>
  </Konva.Stage>
}

export default Canvas;