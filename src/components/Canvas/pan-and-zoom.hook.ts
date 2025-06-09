import type { Stage } from "konva/lib/Stage";
import { useState, useEffect } from "react";
import type { Point } from "../../drawing/path";
import type { KonvaEventObject } from "konva/lib/Node";

const MIDDLE_CLICK_BUTTON_ID = 1;

/**
 * Install middle-click panning functionality into a Konva.Stage.
 * @param stage
 * @return position: The x.y co-ordinates you should provide to your Konva.Stage element.
 *         scale: The scaleX.scaleY value you should provide to your Konva.Stage element.
 */
export function usePanAndZoom(
	stage: Stage | null,
): [position: Point, scale: number] {
	const [stageScale, setStageScale] = useState(1);
	const [stagePos, setStagePos] = useState<Point>([0, 0]);
	const [lastPanPoint, setLastPanPoint] = useState<{
		x: number;
		y: number;
	} | null>(null);

	useEffect(() => {
		if (!stage) return;

		function handleMouseDown(e: KonvaEventObject<MouseEvent>) {
			if (e.evt.button !== MIDDLE_CLICK_BUTTON_ID) return;

			const position = e.target.getStage()?.getPointerPosition();
			if (!position) return;

			setLastPanPoint({ x: position.x, y: position.y });
			e.evt.preventDefault();
		}

		function handleMouseMove(e: KonvaEventObject<MouseEvent>) {
			if (!lastPanPoint) return;

			const position = e.target.getStage()?.getPointerPosition();
			if (!position) return;

			const deltaX = position.x - lastPanPoint.x;
			const deltaY = position.y - lastPanPoint.y;

			setStagePos([stagePos[0] + deltaX, stagePos[1] + deltaY]);
			setLastPanPoint({ x: position.x, y: position.y });
		}

		function handleMouseUp(e: KonvaEventObject<MouseEvent>) {
			if (e.evt.button !== MIDDLE_CLICK_BUTTON_ID) return;
			setLastPanPoint(null);
		}

		function handleWheel(e: KonvaEventObject<WheelEvent>) {
			e.evt.preventDefault();

			const stage = e.target.getStage();
			const pointer = stage?.getPointerPosition();
			if (!stage || !pointer) return;

			const oldScale = stage.scaleX();

			const scaleBy = 1.1;
			const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;

			// Limit zoom range
			const clampedScale = Math.max(0.01, Math.min(5, newScale));

			setStageScale(clampedScale);

			// Zoom towards pointer position
			const newPos: Point = [
				pointer.x - (pointer.x - stagePos[0]) * (clampedScale / oldScale),
				pointer.y - (pointer.y - stagePos[1]) * (clampedScale / oldScale),
			];
			setStagePos(newPos);
		}

		stage.on("mousedown", handleMouseDown);
		stage.on("mousemove", handleMouseMove);
		stage.on("mouseup", handleMouseUp);
		stage.on("wheel", handleWheel);

		// Cleanup
		return () => {
			stage.off("mousedown", handleMouseDown);
			stage.off("mousemove", handleMouseMove);
			stage.off("mouseup", handleMouseUp);
			stage.off("wheel", handleWheel);
		};
	}, [stage, stagePos, lastPanPoint]);

	return [stagePos, stageScale];
}
