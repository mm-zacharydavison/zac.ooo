import { useAccount } from "jazz-react";
import { JazzAccount } from "./schema.ts";

function App() {
	const { me } = useAccount(JazzAccount, {
		resolve: { profile: true, root: true },
	});

	return (
		<>
			<main className="max-w-2xl mx-auto px-3 mt-16 flex flex-col gap-8"></main>
		</>
	);
}

export default App;
