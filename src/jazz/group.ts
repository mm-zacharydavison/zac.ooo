import { type Account, Group, type ID } from "jazz-tools";

/**
 * Creates a new root group.
 * 
 * There should only be one root group.
 * 
 * TODO: Write a script to create this group and emit the ID when provisioning a new Jazz backend.
 * 
 * @param me - The account of the current user.
 * @returns The group.
 */
function createRootGroup(me: Account) {
  const group = Group.create({
    owner: me,
  });
  group.addMember("everyone", "writer");
  console.log(`Created group '${group.id}'.`);
  console.log(`Add "VITE_GROUP_ID=${group.id}" to your .env file.`);
  return group;
}

/**
 * Loads (or creates) a new root group.
 * @param me - The account of the current user.
 * @param groupID - The group ID, should be the contents of VITE_GROUP_ID .env
 * @returns The group.
 */
export async function loadRootGroup(me: Account, groupID?: ID<Group>) {
  if (groupID === undefined) {
    console.log("No group ID found, creating group...");
    return createRootGroup(me);
  }
  const group = await Group.load(groupID, {});
  if (group === null || group === undefined) {
    console.log("Group not found, creating group...");
    return createRootGroup(me);
  }
  console.log(`Loaded group '${group.id}'.`)
  return group;
}