import { co, z, Group } from 'jazz-tools'
import { uuidv7 } from 'uuidv7'
/**
 * A 2D point in space.
 */
export const Point = z.tuple([z.number(), z.number()])

/**
 * A 2D path (x,y).
 */
export const Path = z.object({
  /** The points of the path. */
  points: z.array(Point),
  /** The scale this path should be drawn at. */
  scale: z.number()
})

/**
 * A workspace that can contain drawings and other assets for rendering.
 */
export const Workspace = co.map({
  /**
   * The color used for all of this workspace content.
   */
  color: z.string(),
  /**
   * Paths to be drawn.
   */
  paths: co.list(Path),
  /**
   * Amount of ink remaining in this workspace for drawing.
   * 
   * When it is 0, no more can be drawn until ink is re-claimed.
   */
  remainingInk: z.number()
})

/**
 * List of all workspaces.
 */
export const WorkspaceList = co.list(Workspace)

/**
 * All globally available data that all users can access.
 */
export const GlobalContainer = co.map({
  /**
   * All of the workspaces that exist, for all users.
   */
  workspaces: WorkspaceList
})

/**
 * Account root that contains user-specific data
 */
export const AccountRoot = co.map({
  /** Reference to the global workspace list. */
  global: GlobalContainer,
  /** This users workspace. */
  myWorkspace: Workspace
})

/**
 * Main account schema for the app.
 */
export const AppAccount = co.account({
  root: AccountRoot,
  profile: co.profile({
    name: z.string()
  })
}).withMigration((account) => {
  // Initialize profile if it doesn't exist
  if (account.profile === undefined) {
    const profileGroup = Group.create()
    profileGroup.addMember("everyone", "reader") // Profile visible to everyone
    
    account.profile = co.profile({
      name: z.string()
    }).create({
      name: uuidv7()
    }, profileGroup)
  }
})