# [zac.ooo](zac.ooo)

fun multiplayer whiteboard app

# features

- draw on the whiteboard
- all drawings are visible to everyone
- each browser session is a new user
- each user gets limited ink
- click `↻` to delete your paths and get your ink back
- zoom / pan

# tech

- `jazz`: crdt sync backend
- `react`: ui
- `konva`: html canvas

# deployment

this is a little manual for now, I may automate it in future.

1. deploy the project anywhere you choose (e.g. `vercel`)
2. visit the site, check the Chrome Console, and record the `VITE_GROUP_ID` value.
3. also set `VITE_JAZZ_API_KEY` to your email address.
4. add this value as an environment variable to your deployment.
5. restart / re-deploy.