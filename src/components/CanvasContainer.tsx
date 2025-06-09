import { useAccount } from "jazz-react"
import { useEffect, useState } from "react"
import { AppAccount } from "../jazz/account"
import type { JazzId } from "../jazz/aliases"
import { loadRoot } from "../jazz/global-container"
import Canvas from "./Canvas/Canvas"

/**
 * Wraps the `Canvas` and loads the global CanvasFeed from Jazz.
 *
 * Renders the `Canvas` when loaded.
 */
export function CanvasContainer() {
	const { me } = useAccount(AppAccount, { resolve: true })

	const [loaded, setLoaded] = useState<boolean>(false)
	const [globalContainerId, setGlobalContainerId] = useState<JazzId | undefined>(undefined)

	useEffect(() => {
		const load = async () => {
			if (!me?.id) return
			if (globalContainerId) return
			const id = await loadRoot(me)
			if (id) {
				setLoaded(true)
				setGlobalContainerId(id)
			}
		}
		load()
	}, [me, globalContainerId])

	return (
		<>
			{loaded && globalContainerId ? (
				<Canvas globalContainerId={globalContainerId} />
			) : (
				<div>Loading...</div>
			)}
		</>
	)
}
