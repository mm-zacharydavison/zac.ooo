import { JazzProvider } from "jazz-react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { apiKey } from "./apiKey.ts";
import { AppAccount } from "./jazz/account.ts";
import { JazzInspector } from "jazz-inspector";

// This identifies the app in the passkey auth
export const APPLICATION_NAME = "zac.ooo";

// biome-ignore lint/style/noNonNullAssertion: Root element is guaranteed to exist.
createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<JazzProvider
			sync={{
				peer: `wss://cloud.jazz.tools/?key=${apiKey}`,
				when: "always",
			}}
			AccountSchema={AppAccount}
		>
			<App />
			<JazzInspector />
		</JazzProvider>
	</StrictMode>,
);
