import { co, type Account } from "jazz-tools";
import type { JazzId } from "./aliases";
import { loadRootGroup } from "./group";
import { AccountRoot, GlobalContainer, Path, Workspace, WorkspaceList } from "./account";
import randomColor from "randomcolor";

const GLOBAL_GROUP_ID = import.meta.env.VITE_GROUP_ID
const GLOBAL_CONTAINER_ID = '20250608175507_global-container'

export async function loadGlobalContainer(me: Account | undefined | null): Promise<JazzId | undefined> {
  if(!me) return
  const group = await loadRootGroup(me, GLOBAL_GROUP_ID)

  // Find existing global container.
  const globalContainerId = await GlobalContainer.findUnique(
    GLOBAL_CONTAINER_ID,
    group.id
  )

  console.log(`Existing GlobalContainer: ${globalContainerId}.`)

  // Fetch the existing global container, if one exists.
  let globalContainer = await GlobalContainer.load(globalContainerId, { resolve: { workspaces: true } })

  console.log(`Loaded GlobalContainer: ${globalContainer?.id}.`)

  if(!globalContainer) {
    // Create a new global container.
    globalContainer = GlobalContainer.create({
      workspaces: WorkspaceList.create([], { owner: group })
    }, { owner: group, unique: GLOBAL_CONTAINER_ID })
    console.log(`Created new GlobalContainer ${globalContainer.id}.`)
  }

  // Initialize the account root if it doesn't exist and link to global container.
  if (me.root === undefined) {
    const myWorkspace = Workspace.create(
      { 
        color: randomColor(),
        paths: co.list(Path).create([],{ owner: group }),
      },
      { owner: group }
    )
    // Create this users root.
    me.root = AccountRoot.create({
      global: globalContainer,
      myWorkspace
    })
    // Push their workspace onto the global workspaces list.
    globalContainer.workspaces.push(myWorkspace)
    console.log(`Created new root for user: '${me.id}'.`)
  }

  return globalContainer.id
}