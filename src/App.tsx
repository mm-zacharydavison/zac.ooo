import { useAccount } from "jazz-react";
import { JazzAccount } from "./schema.ts";
import Canvas from "./Canvas.tsx";

function App() {
	const { me } = useAccount(JazzAccount, {
		resolve: { profile: true, root: true },
	});

	return (
		<>
    <Canvas/>
		</>
	);
}

export default App;
