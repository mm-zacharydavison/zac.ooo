import type { KonvaEventObject } from "konva/lib/Node"
import type { Stage } from "konva/lib/Stage"
import { useEffect, useState } from "react"
import type { Point } from "../../drawing/path"

const MIDDLE_CLICK_BUTTON_ID = 1

/**
 * Install pan and zoom functionality into a Konva.Stage.
 * Supports both mouse (middle-click pan, wheel zoom) and touch (drag pan, pinch zoom) interactions.
 */
export function usePanAndZoom(stage: Stage | null): [position: Point, scale: number] {
	const [stageScale, setStageScale] = useState(1)
	const [stagePos, setStagePos] = useState<Point>([0, 0])
	const [lastPanPoint, setLastPanPoint] = useState<{
		x: number
		y: number
	} | null>(null)
	const [lastDist, setLastDist] = useState<number | null>(null)

	useEffect(() => {
		if (!stage) return

		function getDistance(p1: { x: number, y: number }, p2: { x: number, y: number }) {
			return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2)
		}

		function handleMouseDown(e: KonvaEventObject<MouseEvent>) {
			if (e.evt.button !== MIDDLE_CLICK_BUTTON_ID) return

			const position = e.target.getStage()?.getPointerPosition()
			if (!position) return

			setLastPanPoint({ x: position.x, y: position.y })
			e.evt.preventDefault()
		}

		function handleMouseMove(e: KonvaEventObject<MouseEvent>) {
			if (!lastPanPoint) return

			const position = e.target.getStage()?.getPointerPosition()
			if (!position) return

			const deltaX = position.x - lastPanPoint.x
			const deltaY = position.y - lastPanPoint.y

			setStagePos([stagePos[0] + deltaX, stagePos[1] + deltaY])
			setLastPanPoint({ x: position.x, y: position.y })
		}

		function handleMouseUp(e: KonvaEventObject<MouseEvent>) {
			if (e.evt.button !== MIDDLE_CLICK_BUTTON_ID) return
			setLastPanPoint(null)
		}

		function handleWheel(e: KonvaEventObject<WheelEvent>) {
			e.evt.preventDefault()

			const stage = e.target.getStage()
			const pointer = stage?.getPointerPosition()
			if (!stage || !pointer) return

			const oldScale = stage.scaleX()

			const scaleBy = 1.1
			const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy
			const clampedScale = Math.max(0.01, Math.min(5, newScale))

			setStageScale(clampedScale)

			const newPos: Point = [
				pointer.x - (pointer.x - stagePos[0]) * (clampedScale / oldScale),
				pointer.y - (pointer.y - stagePos[1]) * (clampedScale / oldScale),
			]
			setStagePos(newPos)
		}

		function handleTouchStart(e: KonvaEventObject<TouchEvent>) {
			e.evt.preventDefault()
			
			const touches = e.evt.touches
			if (touches.length === 2) {
				// Store initial position for panning
				setLastPanPoint({
					x: (touches[0].clientX + touches[1].clientX) / 2,
					y: (touches[0].clientY + touches[1].clientY) / 2
				})
				// Store initial distance for zooming
				setLastDist(getDistance(
					{ x: touches[0].clientX, y: touches[0].clientY },
					{ x: touches[1].clientX, y: touches[1].clientY }
				))
			}
		}

		function handleTouchMove(e: KonvaEventObject<TouchEvent>) {
			e.evt.preventDefault()
			
			const touches = e.evt.touches
			if (touches.length === 2 && lastDist && lastPanPoint) {
				// Handle zooming
				const dist = getDistance(
					{ x: touches[0].clientX, y: touches[0].clientY },
					{ x: touches[1].clientX, y: touches[1].clientY }
				)
				const center = {
					x: (touches[0].clientX + touches[1].clientX) / 2,
					y: (touches[0].clientY + touches[1].clientY) / 2
				}
				const oldScale = stageScale
				const newScale = oldScale * (dist / lastDist)
				const clampedScale = Math.max(0.01, Math.min(5, newScale))

				// Calculate new position to zoom towards fingers
				let newPos: Point = [
					center.x - (center.x - stagePos[0]) * (clampedScale / oldScale),
					center.y - (center.y - stagePos[1]) * (clampedScale / oldScale),
				]

				// Add panning offset
				const deltaX = center.x - lastPanPoint.x
				const deltaY = center.y - lastPanPoint.y
				newPos = [newPos[0] + deltaX, newPos[1] + deltaY]

				setStageScale(clampedScale)
				setStagePos(newPos)
				setLastDist(dist)
				setLastPanPoint(center)
			}
		}

		function handleTouchEnd() {
			setLastPanPoint(null)
			setLastDist(null)
		}

		stage.on("mousedown", handleMouseDown)
		stage.on("mousemove", handleMouseMove)
		stage.on("mouseup", handleMouseUp)
		stage.on("wheel", handleWheel)
		stage.on("touchstart", handleTouchStart)
		stage.on("touchmove", handleTouchMove)
		stage.on("touchend", handleTouchEnd)

		return () => {
			stage.off("mousedown", handleMouseDown)
			stage.off("mousemove", handleMouseMove)
			stage.off("mouseup", handleMouseUp)
			stage.off("wheel", handleWheel)
			stage.off("touchstart", handleTouchStart)
			stage.off("touchmove", handleTouchMove)
			stage.off("touchend", handleTouchEnd)
		}
	}, [stage, stagePos, lastPanPoint, stageScale, lastDist])

	return [stagePos, stageScale]
}
