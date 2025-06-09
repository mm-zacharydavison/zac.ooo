import type { KonvaEventObject } from "konva/lib/Node";
import type { Stage } from "konva/lib/Stage";
import { useState, useEffect } from "react";
import { PathInstance, type Point } from "../../drawing/path";

const LEFT_CLICK_BUTTON_ID = 0;

interface UseFreehandDraw {
	paths: PathInstance[];
	currentPath: PathInstance | null;
	clearPaths: () => void;
}

interface UseFreehandDrawProps {
	ink?: {
		remaining: number;
		maximum: number;
    onInkChange: (newInk: number) => void;
	};
	onPathCommitted?: (path: PathInstance) => void;
}

/**
 * Installs freehand drawing functionality into a Konva.Stage.
 * @param stage
 */
export function useFreehandDraw(
	stage: Stage | null,
	props: UseFreehandDrawProps,
): UseFreehandDraw {
	// Path state
	const [paths, setPaths] = useState<PathInstance[]>([]);
	const [currentPath, setCurrentPath] = useState<PathInstance | null>(null);
	// Ink state
	const [initialInkForCurrentPath, setInitialInkForCurrentPath] = useState(
		props.ink?.remaining ?? null,
	);

	const clearPaths = () => {
		setPaths([]);
		setCurrentPath(null);
	};

	useEffect(() => {
		if (!stage) return;

		/**
		 * Converts the position of a mouse event to a relative position on the Konva.Canvas
		 * @param e - The mouse event.
		 * @returns A point within the Konva.Canvas (or null if the position was outside the stage)
		 */
		function convertMousePositionToCanvasPosition(
			e: KonvaEventObject<MouseEvent>,
		): Point | null {
			const position = e.target.getStage()?.getPointerPosition();
			if (!position) return null;

			const stage = e.target.getStage();
			if (!stage) return null;

			const transform = stage.getAbsoluteTransform().copy().invert();
			const canvasPos = transform.point(position);
			return [canvasPos.x, canvasPos.y];
		}

		function handleMouseDown(e: KonvaEventObject<MouseEvent>) {
      if (!stage) return
			if (e.evt.button !== LEFT_CLICK_BUTTON_ID) return;
			if (currentPath) return;

			const position = convertMousePositionToCanvasPosition(e);
			if (!position) return;

			const path = new PathInstance(
				[position],
				"raw",
				undefined,
				stage.scale().x, // x.y scale are identical
			);
			setCurrentPath(path);
			setInitialInkForCurrentPath(props.ink?.remaining ?? 0);
		}

		function handleMouseMove(e: KonvaEventObject<MouseEvent>) {
      if (!stage) return
			if (!currentPath) return;

			const position = convertMousePositionToCanvasPosition(e);
			if (!position) return;

			const updatedPath = currentPath.appended(position);
			setCurrentPath(updatedPath);

			// Don't measure ink unless we're configured to.
			if (!props.ink || initialInkForCurrentPath === null) return;

			// Calculate ink usage in real-time
			const pathLength = updatedPath.points.reduce((acc, point, index) => {
				if (index === 0) return acc;
				const prevPoint = updatedPath.points[index - 1];
				const distance = Math.sqrt(
					(point[0] - prevPoint[0]) ** 2 + (point[1] - prevPoint[1]) ** 2,
				);
				return acc + distance;
			}, 0);

			const inkUsed = Math.min(
				pathLength / props.ink?.maximum,
				initialInkForCurrentPath,
			);
			const newInkLevel = Math.max(0, initialInkForCurrentPath - inkUsed);
			props.ink.onInkChange(newInkLevel);
		}

		function handleMouseUp(e: KonvaEventObject<MouseEvent>) {
      if (!stage) return
			if (e.evt.button !== LEFT_CLICK_BUTTON_ID) return;
			if (!currentPath) return;

			// We want to commit the currentPath as simplified, for performance / data size.
			const currentPathSimplified = currentPath.simplified();
			setCurrentPath(null);

			if (props.ink && initialInkForCurrentPath) {
				if (props.ink.remaining <= 0) {
					// If no ink left, restore the initial ink level since path won't be saved.
          props.ink.onInkChange(initialInkForCurrentPath);
					return;
				}
			}

			setPaths([...paths, currentPathSimplified]);
			props.onPathCommitted?.(currentPathSimplified);
		}

		stage.on("mousedown", handleMouseDown);
		stage.on("mousemove", handleMouseMove);
		stage.on("mouseup", handleMouseUp);

    // Cleanup
		return () => {
			stage.off("mousedown", handleMouseDown);
			stage.off("mousemove", handleMouseMove);
			stage.off("mouseup", handleMouseUp);
		};
	}, [stage, currentPath, paths, initialInkForCurrentPath, props.ink, props.onPathCommitted]);

	return {
		paths,
		currentPath,
		clearPaths,
	};
}
