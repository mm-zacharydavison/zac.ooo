import { useAccount, useCoState } from "jazz-react"
import type { Stage } from "konva/lib/Stage"
import { useMemo, useRef, useEffect } from "react"
import * as Konva from "react-konva"
import { MAX_INK } from "../../drawing/constants"
import { PathInstance } from "../../drawing/path"
import { AppAccount, GlobalContainer } from "../../jazz/account"
import type { JazzId } from "../../jazz/aliases"
import InkBar from "../InkBar"
import { useFreehandDraw } from "./freehand-draw"
import { usePanAndZoom } from "./pan-and-zoom.hook"

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
	const konvaStage = useRef<Stage>(null)

	const { me } = useAccount(AppAccount, {
		resolve: { root: { myWorkspace: true } },
	})

	// Get the global container state (including all other user paths).
	const globalContainer = useCoState(GlobalContainer, props.globalContainerId, {
		resolve: { workspaces: { $each: { paths: true } } },
	})

	// Canvas features
	const [stagePos, stageScale] = usePanAndZoom(konvaStage.current)
	const {
		paths: localPaths,
		currentPath,
		clearPaths,
	} = useFreehandDraw(konvaStage.current, {
		ink: {
			remaining: me?.root.myWorkspace.remainingInk ?? 0,
			maximum: MAX_INK,
			onInkChange: (newInk) => {
				if (myWorkspace) {
					myWorkspace.remainingInk = newInk
				}
			},
		},
		onPathCommitted: (path) => {
			myWorkspace?.paths?.push({
        id: path.id,
				points: path.points,
				scale: stageScale,
			})
		},
	})

	const myWorkspace = me?.root?.myWorkspace

	// Remote paths
	const remotePaths = (globalContainer?.workspaces ?? [])?.flatMap((workspace) => {
		return (workspace?.paths ?? []).map(
			(jazzPath) =>
				new PathInstance(jazzPath.id, jazzPath.points, "simplified", workspace.color, jazzPath.scale),
		)
	})

	// All SVG paths (memoized)
  // ⚠️ NOTE: We memo-ize based on remotePaths.length, because remotePaths are immutable.
  //          The correct solution for this is to memo-ize `remotePaths` above, 
  //          but I don't really grok how memoization works with Jazz CoValues.
	// biome-ignore lint/correctness/useExhaustiveDependencies: @see above.\
	const existingRenderedPaths = useMemo(() => {
		const startTime = performance.now()
    // Unique all paths, so we don't have duplicates between remote and local state.
		const allPaths = [...new Map([...remotePaths, ...localPaths].map(path => [path.id, path])).values()]

		const paths = allPaths.map((path) => ({
			id: path.id,
			svg: path.beautified().renderToSVGPath(),
			fill: path.color ?? myWorkspace?.color ?? "#000000",
		}))
		console.debug(`[Canvas] SVG path rendering took ${performance.now() - startTime}ms for ${paths.length} paths`)
		return paths
	}, [remotePaths.length, localPaths, myWorkspace?.color])

	const renderedCurrentPath = currentPath ? {
		id: currentPath.id,
		svg: currentPath.beautified().renderToSVGPath(),
		fill: myWorkspace?.color ?? "#000000"
	} : null

	const onResetInk = () => {
		console.debug('[Canvas] Resetting ink')
		const startTime = performance.now()
		if (!myWorkspace) return
		// Remote state
		myWorkspace.paths?.splice(0, myWorkspace.paths.length)
		myWorkspace.remainingInk = MAX_INK
		// Local state
		clearPaths()
		console.debug(`[Canvas] Ink reset took ${performance.now() - startTime}ms`)
	}

	return (
		<div style={{ position: "relative", width: "100vw", height: "100vh" }}>
			<InkBar
				currentInk={myWorkspace?.remainingInk ?? 0}
				maxInk={MAX_INK}
				inkColor={myWorkspace?.color ?? "#000000"}
				onResetInk={onResetInk}
			/>
			<Konva.Stage
				ref={konvaStage}
				width={window.innerWidth}
				height={window.innerHeight}
				scaleX={stageScale}
				scaleY={stageScale}
				x={stagePos[0]}
				y={stagePos[1]}
			>
				<Konva.Layer>
					{existingRenderedPaths.map(({ id, svg, fill }) => (
						<Konva.Path key={id} data={svg} fill={fill} />
					))}
					{renderedCurrentPath && (
						<Konva.Path 
							key={renderedCurrentPath.id} 
							data={renderedCurrentPath.svg} 
							fill={renderedCurrentPath.fill} 
						/>
					)}
				</Konva.Layer>
			</Konva.Stage>
		</div>
	)
}

Canvas.whyDidYouRender = true

export default Canvas
