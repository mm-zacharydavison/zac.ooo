import { useAccount } from "jazz-react";
import Canvas from "./Canvas";
import { AppAccount } from "./jazz/account";
import { useEffect, useState } from "react";
import { loadGlobalContainer } from "./jazz/workspace-map";
import type { JazzId } from "./jazz/aliases";

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
      const id = await loadGlobalContainer(me)
      setLoaded(true)
      setGlobalContainerId(id)
    }
    load()
  }, [me])

  return (
    <>
    {loaded && globalContainerId 
      ? (<Canvas globalContainerId={globalContainerId}/>)
      : (<div>Loading...</div>)
    }
    </>
  )
}