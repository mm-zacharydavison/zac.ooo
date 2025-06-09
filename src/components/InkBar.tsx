import type { HexColorString } from "../jazz/aliases"

interface InkBarProps {
	/**
	 * Current amount of ink.
	 */
	currentInk: number
	/**
	 * Maximum ink.
	 */
	maxInk: number
	/**
	 * The color of the ink.
	 */
	inkColor: HexColorString
	/**
	 * Callback for when the reset button is clicked.
	 * @returns
	 */
	onResetInk: () => void
}

/**
 * Displays the current amount of ink available for drawing.
 *
 * Provides a 'reset' button to draw again.
 */
function InkBar({ currentInk, maxInk, inkColor, onResetInk }: InkBarProps) {
	return (
		<div
			style={{
				position: "absolute",
				top: "20px",
				left: "20px",
				zIndex: 1000,
				pointerEvents: "none",
			}}
		>
			{/* Ink bar background */}
			<div
				style={{
					width: "30px",
					height: "200px",
					backgroundColor: "#333333",
					border: "2px solid #666666",
					position: "relative",
				}}
			>
				{/* Ink bar fill */}
				<div
					style={{
						position: "absolute",
						bottom: "0",
						left: "0",
						width: "100%",
						height: `${(currentInk / maxInk) * 100}%`,
						backgroundColor: inkColor,
						transition: "height 0.2s ease",
					}}
				/>
			</div>
			{/* Reset button */}
			<button
				type={"button"}
				onClick={onResetInk}
				style={{
					width: "30px",
					height: "20px",
					marginTop: "2px",
					backgroundColor: "#666666",
					border: "1px solid #333333",
					color: "#ffffff",
					fontSize: "10px",
					cursor: "pointer",
					pointerEvents: "auto",
					padding: "0",
				}}
				title="Reset Ink"
			>
				↻
			</button>
		</div>
	)
}

export default InkBar
