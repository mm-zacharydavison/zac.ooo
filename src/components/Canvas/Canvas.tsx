import { useAccount, useCoState } from "jazz-react";
import type { Stage } from "konva/lib/Stage";
import { useRef, useMemo } from "react";
import * as Konva from "react-konva";
import { MAX_INK } from "../../drawing/constants";
import { PathInstance } from "../../drawing/path";
import { AppAccount, GlobalContainer } from "../../jazz/account";
import type { JazzId } from "../../jazz/aliases";
import InkBar from "../InkBar";
import { useFreehandDraw } from "./freehand-draw";
import { usePanAndZoom } from "./pan-and-zoom.hook";

export interface CanvasProps {
	/**
	 * The ID of the `GlobalContainer` that should be used to render all data.
	 *
	 * Will be loaded by the Canvas.
	 */
	globalContainerId: JazzId;
}

/**
 * The live, multiplayer drawing canvas.
 *
 * - Allows user to draw and commit their canvas.
 * - Renders all other user canvases.
 */
function Canvas(props: CanvasProps) {
	const konvaStage = useRef<Stage>(null);

	const { me } = useAccount(AppAccount, {
		resolve: { root: { myWorkspace: true } },
	});

	// Get the global container state (including all other user paths).
	const globalContainer = useCoState(GlobalContainer, props.globalContainerId, {
		resolve: { workspaces: { $each: { paths: true } } },
	});

	// Canvas features
	const [stagePos, stageScale] = usePanAndZoom(konvaStage.current);
	const { paths: localPaths, currentPath, clearPaths } = useFreehandDraw(
		konvaStage.current,
		{
			ink: {
				remaining: me?.root.myWorkspace.remainingInk ?? 0,
				maximum: MAX_INK,
        onInkChange: (newInk) => {
          if (myWorkspace) {
            myWorkspace.remainingInk = newInk
          }
        }
			},
			onPathCommitted: (path) => {
        console.log('path committed', path.id, myWorkspace?.id)
				myWorkspace?.paths?.push({
					points: path.points,
					scale: stageScale,
				});
			},
		},
	);

	const myWorkspace = me?.root?.myWorkspace;

	// Remote paths
	const remotePaths = (globalContainer?.workspaces ?? [])?.flatMap(
		(workspace) => {
			return (workspace?.paths ?? []).map(
				(jazzPath) =>
					new PathInstance(
						jazzPath.points,
						"simplified", 
						workspace.color,
						jazzPath.scale,
					),
			);
		},
	);

  console.log('remotePaths', remotePaths)

	// All SVG paths (memoized)
	const renderedPaths = useMemo(() => {
		const allPaths = [...remotePaths, ...localPaths, currentPath].filter(
			Boolean,
		) as PathInstance[];
		
		return allPaths.map(path => ({
			id: path.id,
			svg: path.beautified().renderToSVGPath(),
			fill: path.color ?? myWorkspace?.color ?? "#000000"
		}));
	}, [remotePaths, localPaths, currentPath, myWorkspace?.color]);

	const onResetInk = () => {
		if (!myWorkspace) return;
		// Remote state
		myWorkspace.paths?.splice(0, myWorkspace.paths.length);
		myWorkspace.remainingInk = MAX_INK;
		// Local state
		clearPaths();
	};

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
					{renderedPaths.map(({ id, svg, fill }) => (
						<Konva.Path
							key={id}
							data={svg}
							fill={fill}
						/>
					))}
				</Konva.Layer>
			</Konva.Stage>
		</div>
	);
}

export default Canvas;
