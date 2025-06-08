import { Simplify } from "simplify-ts"
import * as perfect from "perfect-freehand"
import { uuidv7 } from "uuidv7";
import type { HexColorString } from "../jazz/aliases";

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
 * - raw: A set of raw points that haven't been modified in any way.
 * - simplified: A simplified set of points, most suitable for storage.
 * - beautified: A complex, 'filled' path of points, generated from perfect-freehand, most suitable for rendering to look good.
 */
export type PathType = 'raw' | 'simplified' | 'beautified'

const average = (a: number, b: number) => (a + b) / 2

/**
 * A path in zac.ooo.
 * 
 * Has utility functions for rendering different versions of itself for different usages.
 * 
 * All functions return a new path, and do not modify in place.
 */
export class PathInstance {

  /**
   * Provides a unique ID for this path.
   * 
   * Useful for rendering.
   */
  public readonly id = uuidv7()
  public readonly points: Point[]

  /**
   * A desired color for this path, if any.
   */
  public readonly color?: HexColorString
  public type: PathType

  /**
   * The scale at which this path was drawn.
   * Used to maintain constant stroke width regardless of zoom level.
   */
  public readonly scale: number

  constructor(points: Point[] = [], type: PathType = 'raw', color?: HexColorString, scale = 1)  {
    this.points = points
    this.type = type
    this.color = color
    this.scale = scale
  }

  /**
   * Create a new path by appending `point`.
   * @param point
   * @returns A new path object with the point appended.
   */
  appended(point: Point): PathInstance {
    return new PathInstance(
      [...this.points, point],
      this.type,
      this.color,
      this.scale
    )
  }

  /**
   * Uses `simplify-ts` to simplify the path.
   * @returns A new, simplified path.
   */
  simplified(): PathInstance {

    const tolerance = 0.3

    return new PathInstance(
      Simplify(
        this.points.map(p => ({x: p[0], y: p[1]})), 
        tolerance, 
        true
      ).map(p => [p.x, p.y]),
      'simplified',
      this.color,
      this.scale
    )
  }

  /**
   * Uses perfect-freehand to simulate pressure and create an outline, for a more realistic looking path.
   * 
   * The stroke size is adjusted based on the scale to maintain constant visual width.
   * 
   * Note: The resulting path should be filled, not stroked.
   * 
   * @returns A new, beautified path.
   */
  beautified(): PathInstance {
    const baseSize = 4 // Base stroke width in pixels
    const adjustedSize = baseSize / this.scale // Adjust size inversely to scale
    
    return new PathInstance(
      perfect.getStroke(this.points, {
        size: adjustedSize,
        thinning: 0.5,
        smoothing: 0.5,
        streamline: 0.5,
      }) as Point[],
      'beautified',
      this.color,
      this.scale
    )
  }

  /**
   * Renders an SVG path string suitable for drawing in HTML Canvas or as an <svg/> element.
   * @returns A string representing the path as SVG.
   */
  renderToSVGPath(): SVGPathString {
    const len = this.points.length

    if (len < 4) {
      return ''
    }
  
    let a = this.points[0]
    let b = this.points[1]
    const c = this.points[2]
  
    let result = `M${a[0].toFixed(2)},${a[1].toFixed(2)} Q${b[0].toFixed(
      2
    )},${b[1].toFixed(2)} ${average(b[0], c[0]).toFixed(2)},${average(
      b[1],
      c[1]
    ).toFixed(2)} T`
  
    for (let i = 2, max = len - 1; i < max; i++) {
      a = this.points[i]
      b = this.points[i + 1]
      result += `${average(a[0], b[0]).toFixed(2)},${average(a[1], b[1]).toFixed(
        2
      )} `
    }

  
    return result
  }
}