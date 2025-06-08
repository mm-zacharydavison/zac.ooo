import { useState } from "react"
import { PathInstance } from "./drawing/path"
import * as Konva from "react-konva"
import type { KonvaEventObject } from "konva/lib/Node"
import type { JazzId } from "./jazz/aliases"
import { useAccount, useCoState } from "jazz-react"
import { AppAccount, GlobalContainer } from "./jazz/account"

export interface CanvasProps {
  /**
   * The ID of the `GlobalContainer` that should be used to render all data.
   * 
   * Will be loaded by the Canvas.
   */
  globalContainerId: JazzId
}

/**
 * The live, multiplayer drawing canvas.
 * 
 * - Allows user to draw and commit their canvas.
 * - Renders all other user canvases.
 */
function Canvas(props: CanvasProps) {
  const { me } = useAccount(
    AppAccount, 
    { resolve: 
      { root: 
        { myWorkspace: true }
      } 
    })

  const globalContainer = useCoState(
    GlobalContainer,
    props.globalContainerId,
    { resolve:
      { workspaces:
        { $each: { paths: true } 
      } 
    } 
  })
  const myWorkspace = me?.root?.myWorkspace

  const remotePaths = (globalContainer?.workspaces ?? [])
    ?.flatMap((workspace) => {
      return (workspace?.paths ?? [])
        .map(jazzPath => new PathInstance(jazzPath.points, 'simplified', workspace.color, jazzPath.scale)) // We store paths as 'simplified'.
    })

  console.log('remotePaths', remotePaths)

  const [localPaths, setLocalPaths] = useState<PathInstance[]>([])
  const [currentPath, setCurrentPath] = useState<PathInstance | null>(null)
  
  // Pan and zoom state
  const [stageScale, setStageScale] = useState(1)
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 })
  const [isDrawing, setIsDrawing] = useState(false)
  const [isPanning, setIsPanning] = useState(false)
  const [lastPanPoint, setLastPanPoint] = useState<{ x: number, y: number } | null>(null)

  // Drawing functions
  const handleDrawingStart = (e: KonvaEventObject<MouseEvent>) => {
    const position = e.target.getStage()?.getPointerPosition()
    if (!position) return

    // Convert screen coordinates to canvas coordinates
    const stage = e.target.getStage()
    if (!stage) return
    const transform = stage.getAbsoluteTransform().copy().invert()
    const canvasPos = transform.point(position)

    const path = new PathInstance([[canvasPos.x, canvasPos.y]], 'raw', undefined, stageScale)
    setCurrentPath(path)
    setIsDrawing(true)
  }

  const handleDrawingMove = (e: KonvaEventObject<MouseEvent>) => {
    if (!currentPath) return

    const position = e.target.getStage()?.getPointerPosition()
    if (!position) return
    
    // Convert screen coordinates to canvas coordinates
    const stage = e.target.getStage()
    if (!stage) return
    const transform = stage.getAbsoluteTransform().copy().invert()
    const canvasPos = transform.point(position)
    
    setCurrentPath(currentPath.appended([canvasPos.x, canvasPos.y]))
  }

  const handleDrawingEnd = () => {
    if (!currentPath) return

    const currentPathSimplified = currentPath.simplified()
    myWorkspace?.paths?.push({ points: currentPathSimplified.points, scale: stageScale })
    setLocalPaths([...localPaths, currentPathSimplified])
    setCurrentPath(null)
    setIsDrawing(false)
  }

  // Panning functions
  const handlePanningStart = (e: KonvaEventObject<MouseEvent>) => {
    const position = e.target.getStage()?.getPointerPosition()
    if (!position) return
    
    setIsPanning(true)
    setLastPanPoint({ x: position.x, y: position.y })
    e.evt.preventDefault()
  }

  const handlePanningMove = (e: KonvaEventObject<MouseEvent>) => {
    if (!lastPanPoint) return

    const position = e.target.getStage()?.getPointerPosition()
    if (!position) return
    
    const deltaX = position.x - lastPanPoint.x
    const deltaY = position.y - lastPanPoint.y
    
    setStagePos({
      x: stagePos.x + deltaX,
      y: stagePos.y + deltaY
    })
    
    setLastPanPoint({ x: position.x, y: position.y })
  }

  const handlePanningEnd = () => {
    setIsPanning(false)
    setLastPanPoint(null)
  }

  // Main mouse event handlers
  const onMouseDown = (e: KonvaEventObject<MouseEvent>) => {
    if (e.evt.button === 0) {
      // Left click for drawing
      handleDrawingStart(e)
    } else if (e.evt.button === 1) {
      // Middle click for panning
      handlePanningStart(e)
    }
  }

  const onMouseMove = (e: KonvaEventObject<MouseEvent>) => {
    if (isDrawing) {
      handleDrawingMove(e)
    } else if (isPanning) {
      handlePanningMove(e)
    }
  }

  const onMouseUp = (e: KonvaEventObject<MouseEvent>) => {
    if (e.evt.button === 0 && isDrawing) {
      // Left click release - end drawing
      handleDrawingEnd()
    } else if (e.evt.button === 1 && isPanning) {
      // Middle click release - end panning
      handlePanningEnd()
    }
  }

  const handleWheel = (e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault()
    
    const stage = e.target.getStage()
    const pointer = stage?.getPointerPosition()
    if (!stage || !pointer) return
    
    const oldScale = stage.scaleX()
    
    const scaleBy = 1.1
    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy
    
    // Limit zoom range
    const clampedScale = Math.max(0.01, Math.min(5, newScale))
    
    setStageScale(clampedScale)
    
    // Zoom towards pointer position
    const newPos = {
      x: pointer.x - (pointer.x - stagePos.x) * (clampedScale / oldScale),
      y: pointer.y - (pointer.y - stagePos.y) * (clampedScale / oldScale)
    }
    setStagePos(newPos)
  }

  console.log('localPaths', localPaths)

  const allPaths = [...remotePaths, ...localPaths, currentPath].filter(Boolean) as PathInstance[]

  console.log('allPaths', allPaths)

  return <Konva.Stage 
    width={window.innerWidth} 
    height={window.innerHeight}
    scaleX={stageScale}
    scaleY={stageScale}
    x={stagePos.x}
    y={stagePos.y}
    onMouseDown={onMouseDown}
    onMouseMove={onMouseMove}
    onMouseUp={onMouseUp}
    onWheel={handleWheel}
    >
    <Konva.Layer>
      {allPaths.map((path) => (
        <Konva.Path
          key={path.id}
          data={path.beautified().renderToSVGPath()}
          fill={path.color ?? myWorkspace?.color ?? '#000000'}
        />
      ))}
    </Konva.Layer>
  </Konva.Stage>
}

export default Canvas;