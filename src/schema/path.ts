
/**
 * A 2D point in space.
 */
export type Point = [x: number, y: number]

/**
 * An SVG path string.
 *
 * Can be used to construct a Path2D object.
 *
 * @see https://css-tricks.com/svg-path-syntax-illustrated-guide/
 */
export type SVGPathString = string

/**
 * A list of points to be drawn.
 */
export interface Path {
  /**
   * The points that make up this path.
   */
  points: Point[]
}