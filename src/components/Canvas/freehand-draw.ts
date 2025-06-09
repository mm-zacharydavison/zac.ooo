import type { KonvaEventObject } from "konva/lib/Node"
import type { Stage } from "konva/lib/Stage"
import { useEffect, useState } from "react"
import { PathInstance, type Point } from "../../drawing/path"

const LEFT_CLICK_BUTTON_ID = 0

interface UseFreehandDraw {
	paths: PathInstance[]
	currentPath: PathInstance | null
	clearPaths: () => void
}

interface UseFreehandDrawProps {
	ink?: {
		remaining: number
		maximum: number
		onInkChange: (newInk: number) => void
	}
	onPathCommitted?: (path: PathInstance) => void
}

/**
 * Installs freehand drawing functionality into a Konva.Stage.
 * Supports both mouse and touch input.
 */
export function useFreehandDraw(stage: Stage | null, props: UseFreehandDrawProps): UseFreehandDraw {
	// Path state
	const [paths, setPaths] = useState<PathInstance[]>([])
	const [currentPath, setCurrentPath] = useState<PathInstance | null>(null)
	// Ink state
	const [initialInkForCurrentPath, setInitialInkForCurrentPath] = useState(
		props.ink?.remaining ?? null,
	)

	const clearPaths = () => {
		setPaths([])
		setCurrentPath(null)
	}

	useEffect(() => {
		if (!stage) return

    /**
     * Convert a mouse or touch position to a canvas relative position.
     * @param pos - The mouse or touch position.
     * @returns A Point [x: number, y: number]
     */
		function convertPositionToCanvasPosition(pos: { x: number, y: number }): Point | null {
			if (!stage) return null

			const transform = stage.getAbsoluteTransform().copy().invert()
			const canvasPos = transform.point(pos)
			return [canvasPos.x, canvasPos.y]
		}

		function startDrawing(position: Point) {
			console.debug('[FreehandDraw] Starting new path')
			const startTime = performance.now()
      if (!stage) return
			if (currentPath) return

			const path = new PathInstance(
        null,
				[position],
				"raw",
				undefined,
				stage.scale().x
			)
			setCurrentPath(path)
			setInitialInkForCurrentPath(props.ink?.remaining ?? 0)
			console.debug(`[FreehandDraw] Path creation took ${performance.now() - startTime}ms`)
		}

		function continueDrawing(position: Point) {
			const startTime = performance.now()
			if (!currentPath) return

			const updatedPath = currentPath.appended(position)
			setCurrentPath(updatedPath)
			console.debug(`[FreehandDraw] Path update took ${performance.now() - startTime}ms`)

			if (!props.ink || initialInkForCurrentPath === null) return

			const inkCalcStart = performance.now()
			const pathLength = updatedPath.points.reduce((acc, point, index) => {
				if (index === 0) return acc
				const prevPoint = updatedPath.points[index - 1]
				const distance = Math.sqrt((point[0] - prevPoint[0]) ** 2 + (point[1] - prevPoint[1]) ** 2)
				return acc + distance
			}, 0)

			const inkUsed = Math.min(pathLength / props.ink?.maximum, initialInkForCurrentPath)
			const newInkLevel = Math.max(0, initialInkForCurrentPath - inkUsed)
			props.ink.onInkChange(newInkLevel)
			console.debug(`[FreehandDraw] Ink calculation took ${performance.now() - inkCalcStart}ms`)
		}

		function finishDrawing() {
			const startTime = performance.now()
			if (!currentPath) return

			const simplifyStart = performance.now()
			const currentPathSimplified = currentPath.simplified()
			console.debug(`[FreehandDraw] Path simplification took ${performance.now() - simplifyStart}ms`)
			
			setCurrentPath(null)

			if (props.ink && initialInkForCurrentPath) {
				if (props.ink.remaining <= 0) {
					props.ink.onInkChange(initialInkForCurrentPath)
					return
				}
			}

      // To avoid noisy accidental taps on mobile, don't commit paths with less than 2 points.
      if (currentPathSimplified.points.length < 2) return

			setPaths([...paths, currentPathSimplified])
			props.onPathCommitted?.(currentPathSimplified)
			console.debug(`[FreehandDraw] Total path completion took ${performance.now() - startTime}ms`)
		}

		function handleMouseDown(e: KonvaEventObject<MouseEvent>) {
			if (e.evt.button !== LEFT_CLICK_BUTTON_ID) return

      const stage = e.target.getStage()
      if(!stage) return

			const position = stage.getPointerPosition()
			if (!position) return

			const canvasPos = convertPositionToCanvasPosition(position)
			if (!canvasPos) return

			startDrawing(canvasPos)
		}

		function handleMouseMove(e: KonvaEventObject<MouseEvent>) {
      const stage = e.target.getStage()
      if(!stage) return

			const position = stage.getPointerPosition()
			if (!position) return

			const canvasPos = convertPositionToCanvasPosition(position)
			if (!canvasPos) return

			continueDrawing(canvasPos)
		}

		function handleMouseUp(e: KonvaEventObject<MouseEvent>) {
			if (e.evt.button !== LEFT_CLICK_BUTTON_ID) return
			finishDrawing()
		}

		function handleTouchStart(e: KonvaEventObject<TouchEvent>) {
			e.evt.preventDefault()
			
      const stage = e.target.getStage()
			const touch = e.evt.touches[0]
			if (!stage || !touch) return

			const position = stage.getPointerPosition()
			if (!position) return

			const canvasPos = convertPositionToCanvasPosition(position)
			if (!canvasPos) return

			startDrawing(canvasPos)
		}

		function handleTouchMove(e: KonvaEventObject<TouchEvent>) {
			e.evt.preventDefault()

      // Since 2 fingers are used for pan/zoom, do nothing if we have more than 1 touch.
      if(e.evt.touches.length > 1) return

      const stage = e.target.getStage()
      if(!stage) return

			const position = stage.getPointerPosition()
			if (!position) return

			const canvasPos = convertPositionToCanvasPosition(position)
			if (!canvasPos) return

			continueDrawing(canvasPos)
		}

		function handleTouchEnd(e: KonvaEventObject<TouchEvent>) {
			e.evt.preventDefault()
			finishDrawing()
		}

		stage.on("mousedown", handleMouseDown)
		stage.on("mousemove", handleMouseMove)
		stage.on("mouseup", handleMouseUp)
		stage.on("touchstart", handleTouchStart)
		stage.on("touchmove", handleTouchMove)
		stage.on("touchend", handleTouchEnd)

    // Prevent default scrolling on mobile
    const container = stage.container()
    container.style.touchAction = 'none'
    
    const preventScroll = (e: TouchEvent) => {
      e.preventDefault()
    }
    
    container.addEventListener('touchstart', preventScroll, { passive: false })
    container.addEventListener('touchmove', preventScroll, { passive: false })
    container.addEventListener('touchend', preventScroll, { passive: false })

		return () => {
			stage.off("mousedown", handleMouseDown)
			stage.off("mousemove", handleMouseMove)
			stage.off("mouseup", handleMouseUp)
			stage.off("touchstart", handleTouchStart)
			stage.off("touchmove", handleTouchMove)
			stage.off("touchend", handleTouchEnd)
      container.removeEventListener('touchstart', preventScroll)
      container.removeEventListener('touchmove', preventScroll)
      container.removeEventListener('touchend', preventScroll)
		}
	}, [stage, currentPath, paths, initialInkForCurrentPath, props.ink, props.onPathCommitted])

	return {
		paths,
		currentPath,
		clearPaths,
	}
}
