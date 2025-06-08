import { useAccount } from "jazz-react";
import Canvas from "./Canvas";
import { co } from "jazz-tools";
import { AppAccount, Path, Workspace, WorkspaceMap, AccountRoot } from "./jazz/account";
import { useEffect, useState } from "react";
import { loadRootGroup } from "./jazz/group";

const GLOBAL_GROUP_ID = import.meta.env.VITE_GROUP_ID
const GLOBAL_WORKSPACE_MAP_ID = '20250608164852_global-workspace-map'

/**
 * Wraps the `Canvas` and loads the global CanvasFeed from Jazz.
 * 
 * Renders the `Canvas` when loaded.
 */
export function CanvasContainer() {
  const { me } = useAccount(AppAccount, { resolve: true })

  const [loaded, setLoaded] = useState<boolean>(false)

  useEffect(() => {
    const loadWorkspaceMap = async () => {
      if(!me) return
      const group = await loadRootGroup(me, GLOBAL_GROUP_ID)

      // Find existing workspace map ID.
      const workspaceMapId = await WorkspaceMap.findUnique(
        GLOBAL_WORKSPACE_MAP_ID,
        group.id
      )

      // Fetch the existing workspace map, if one exists.
      let workspaceMap = await WorkspaceMap.load(workspaceMapId)

      if(!workspaceMap) {
        // Create a new root workspace map.
        workspaceMap = WorkspaceMap.create({}, { owner: group, unique: GLOBAL_WORKSPACE_MAP_ID })
      }

      // Ensure the workspace map is fully loaded before checking
      try {
        await workspaceMap.ensureLoaded({ 
          resolve: { [me.id]: true } 
        })
      } catch (error) {
        console.log(`Workspace for ${me.id} could not be loaded from WorkspaceMap, it will be created.`)
      }

      // Check if workspace exists more reliably
      const existingWorkspace = workspaceMap[me.id]
      if (!existingWorkspace || existingWorkspace === null) {
        workspaceMap[me.id] = Workspace.create(
          { paths: co.list(Path).create([]) },
          { owner: group }
        )
      }

      // Initialize the account root if it doesn't exist and link to global workspace map
      if (me.root === undefined) {
        me.root = AccountRoot.create({
          globalWorkspaceMap: workspaceMap
        })
      }

      setLoaded(true)
    }
    loadWorkspaceMap()
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