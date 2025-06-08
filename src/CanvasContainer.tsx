import { useAccount } from "jazz-react";
import { useEffect, useState } from "react";
import Canvas from "./Canvas";
import { AppAccount } from "./jazz/account";
import type { JazzId } from "./jazz/aliases";
import { loadRoot } from "./jazz/workspace-map";

/**
 * Wraps the `Canvas` and loads the global CanvasFeed from Jazz.
 *
 * Renders the `Canvas` when loaded.
 */
export function CanvasContainer() {
	const { me } = useAccount(AppAccount, { resolve: true });

	const [loaded, setLoaded] = useState<boolean>(false);
	const [globalContainerId, setGlobalContainerId] = useState<
		JazzId | undefined
	>(undefined);

	useEffect(() => {
		const load = async () => {
			const id = await loadRoot(me);
			setLoaded(true);
			setGlobalContainerId(id);
		};
		load();
	}, [me]);

	return (
		<>
			{loaded && globalContainerId ? (
				<Canvas globalContainerId={globalContainerId} />
			) : (
				<div>Loading...</div>
			)}
		</>
	);
}
