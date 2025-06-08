import { co, type Account } from "jazz-tools";
import type { JazzId } from "./aliases";
import { loadRootGroup } from "./group";
import { AccountRoot, Path, Workspace, WorkspaceMap } from "./account";

const GLOBAL_GROUP_ID = import.meta.env.VITE_GROUP_ID
const GLOBAL_WORKSPACE_MAP_ID = '20250608164852_global-workspace-map'

export async function loadWorkspaceMap(me: Account | undefined | null): Promise<JazzId | undefined> {
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
}