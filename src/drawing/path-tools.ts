import type { Point } from "../schema/path"

const average = (a: number, b: number) => (a + b) / 2

/**
 * Renders a set of points to an SVG Path object, so it can be rendered to canvas.
 * @see https://www.npmjs.com/package/perfect-freehand#rendering
 * @param points - The points to render.
 * @param closed - If the path should be closed (e.g. the last point connects to the first).
 * @returns - An SVG Path object.
 */
export function getSvgPathFromStroke(points: Point[], closed = true): string {
  const len = points.length

  if (len < 4) {
    return ''
  }

  let a = points[0]
  let b = points[1]
  const c = points[2]

  let result = `M${a[0].toFixed(2)},${a[1].toFixed(2)} Q${b[0].toFixed(
    2
  )},${b[1].toFixed(2)} ${average(b[0], c[0]).toFixed(2)},${average(
    b[1],
    c[1]
  ).toFixed(2)} T`

  for (let i = 2, max = len - 1; i < max; i++) {
    a = points[i]
    b = points[i + 1]
    result += `${average(a[0], b[0]).toFixed(2)},${average(a[1], b[1]).toFixed(
      2
    )} `
  }

  if (closed) {
    result += 'Z'
  }

  return result
}