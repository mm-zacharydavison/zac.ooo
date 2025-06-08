import { co, z, Group } from 'jazz-tools'
import { uuidv7 } from 'uuidv7'
/**
 * A 2D point in space.
 */
export const Point = z.tuple([z.number(), z.number()])

/**
 * A 2D path (x,y).
 */
export const Path = z.array(Point)

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
  paths: co.list(Path)
})

/**
 * Map of user ID to their workspace.
 */
export const WorkspaceMap = co.record(z.string(), Workspace)

/**
 * Account root that contains user-specific data
 */
export const AccountRoot = co.map({
  /** Reference to the global workspace map. */
  globalWorkspaceMap: WorkspaceMap
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