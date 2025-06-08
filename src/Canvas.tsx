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
        .map(jazzPath => new PathInstance(jazzPath, 'simplified', workspace.color)) // We store paths as 'simplified'.
    })

  console.log('remotePaths', remotePaths)

  const [localPaths, setLocalPaths] = useState<PathInstance[]>([])
  const [currentPath, setCurrentPath] = useState<PathInstance | null>(null)

  const onMouseDown = (e: KonvaEventObject<MouseEvent>) => {
    const position = e.target.getStage()?.getPointerPosition()
    if (!position) { return }

    const path = new PathInstance([[position.x, position.y]])
    setCurrentPath(path)
  }

  const onMouseMove = (e: KonvaEventObject<MouseEvent>) => {
    const position = e.target.getStage()?.getPointerPosition()
    if (!currentPath || !position) { return }
    setCurrentPath(currentPath.appended([position.x, position.y]))
  }

  const onMouseUp = (e: KonvaEventObject<MouseEvent>) => {
    if(!currentPath) { return }

    const currentPathSimplified = currentPath.simplified()
    myWorkspace?.paths?.push(currentPathSimplified.points)
    setLocalPaths([...localPaths, currentPathSimplified])
    setCurrentPath(null)
  }

  console.log('localPaths', localPaths)

  const allPaths = [...remotePaths, ...localPaths, currentPath].filter(Boolean) as PathInstance[]

  console.log('allPaths', allPaths)

  return <Konva.Stage 
    width={window.innerWidth} 
    height={window.innerHeight}
    onMouseDown={onMouseDown}
    onMouseMove={onMouseMove}
    onMouseUp={onMouseUp}
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