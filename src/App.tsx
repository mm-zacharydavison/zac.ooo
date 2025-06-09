import { CanvasContainer } from "./components/CanvasContainer";
import { ErrorBoundary } from "./components/ErrorBoundary";

function App() {
	return (
		<ErrorBoundary>
			<CanvasContainer />
		</ErrorBoundary>
	);
}

export default App;
