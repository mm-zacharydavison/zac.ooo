import { useState } from "react"
import { PathInstance } from "./drawing/path"
import * as Konva from "react-konva"
import type { KonvaEventObject } from "konva/lib/Node"
import type { JazzId } from "./jazz/aliases"
import { useAccount, useCoState } from "jazz-react"
import { AppAccount, GlobalContainer } from "./jazz/account"
import { MAX_INK } from "./drawing/constants"
import InkBar from "./components/InkBar"

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

  const [localPaths, setLocalPaths] = useState<PathInstance[]>([])
  const [currentPath, setCurrentPath] = useState<PathInstance | null>(null)
  
  // Pan and zoom state
  const [stageScale, setStageScale] = useState(1)
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 })
  const [isDrawing, setIsDrawing] = useState(false)
  const [isPanning, setIsPanning] = useState(false)
  const [lastPanPoint, setLastPanPoint] = useState<{ x: number, y: number } | null>(null)

  // Ink state
  const [currentInk, setCurrentInk] = useState(100)
  const [initialInkForCurrentPath, setInitialInkForCurrentPath] = useState(100)
  const maxInk = 100

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
    setInitialInkForCurrentPath(currentInk)
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
    
    const updatedPath = currentPath.appended([canvasPos.x, canvasPos.y])
    setCurrentPath(updatedPath)
    
    // Calculate ink usage in real-time
    const pathLength = updatedPath.points.reduce((acc, point, index) => {
      if (index === 0) return acc
      const prevPoint = updatedPath.points[index - 1]
      const distance = Math.sqrt(
        (point[0] - prevPoint[0]) ** 2 + (point[1] - prevPoint[1]) ** 2
      )
      return acc + distance
    }, 0)
    
    const inkUsed = Math.min(pathLength / MAX_INK, initialInkForCurrentPath)
    const newInkLevel = Math.max(0, initialInkForCurrentPath - inkUsed)
    setCurrentInk(newInkLevel)
  }

  const handleDrawingEnd = () => {
    if (!currentPath) return

    const currentPathSimplified = currentPath.simplified()
    
    // Only save the path if we have enough ink remaining
    if (currentInk > 0) {
      myWorkspace?.paths?.push({ points: currentPathSimplified.points, scale: stageScale })
      setLocalPaths([...localPaths, currentPathSimplified])
    } else {
      // If no ink left, restore the initial ink level since path won't be saved
      setCurrentInk(initialInkForCurrentPath)
    }
    
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
    switch (e.evt.button) {
      case 0: // Left click
        handleDrawingStart(e)
        break
      case 1: // Middle click
        handlePanningStart(e)
        break
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
      // Left click release
      handleDrawingEnd()
    } else if (e.evt.button === 1 && isPanning) {
      // Middle click release
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

  const onResetInk = () => {
    if(!myWorkspace) return
    // Remote state
    myWorkspace.paths?.splice(0, myWorkspace.paths.length)
    myWorkspace.remainingInk = MAX_INK
    // Local state
    setCurrentInk(MAX_INK)
    setLocalPaths([])
  }

  const allPaths = [...remotePaths, ...localPaths, currentPath].filter(Boolean) as PathInstance[]

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <InkBar currentInk={currentInk} maxInk={maxInk} inkColor={myWorkspace?.color ?? '#000000'} onResetInk={onResetInk} />
      <Konva.Stage 
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
        </Konva.Layer>
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
    </div>
  )
}

export default Canvas;