import { useAccount } from "jazz-react";
import Canvas from "./Canvas";
import { AppAccount } from "./jazz/account";
import { useEffect, useState } from "react";
import { loadWorkspaceMap } from "./jazz/workspace-map";

/**
 * Wraps the `Canvas` and loads the global CanvasFeed from Jazz.
 * 
 * Renders the `Canvas` when loaded.
 */
export function CanvasContainer() {
  const { me } = useAccount(AppAccount, { resolve: true })

  const [loaded, setLoaded] = useState<boolean>(false)

  useEffect(() => {
    const load = async () => {
      await loadWorkspaceMap(me)
      setLoaded(true)      
    }
    load()
  }, [me])

  return (
    <>
    {loaded && me?.root?.globalWorkspaceMap?.id 
      ? (<Canvas workspaceMapId={me.root.globalWorkspaceMap.id}/>)
      : (<div>Loading...</div>)
    }
    </>
  )
}