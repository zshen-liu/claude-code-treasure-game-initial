Deploy this project to GitHub Pages as a static frontend. Follow these steps exactly:

## Step 1 — Check prerequisites
Run the following checks in parallel:
- `gh --version` — if missing, tell the user to install from https://cli.github.com and stop.
- `gh auth status 2>&1` — if not logged in, tell the user to run `! gh auth login` and stop.
- `git rev-parse --is-inside-work-tree 2>/dev/null || echo "not-a-repo"` — capture git status.

## Step 2 — Initialize git repo (if needed)
If not inside a git repo:
```bash
git init
```
Then check whether a `.gitignore` exists. If it does not, warn the user that sensitive files (`.env`, `server/game.db`) may be committed. Add only source files explicitly:
```bash
git add src/ public/ index.html package.json package-lock.json vite.config.ts tsconfig*.json
git commit -m "Initial commit"
```

## Step 3 — Create GitHub repo (if no remote exists)
Run: `git remote -v`

If no remote is set:
1. Get the GitHub username: `gh api user --jq .login`
2. Derive a repo name from the project folder name (lowercase, hyphens instead of spaces/underscores).
3. Create the repo and push:
```bash
gh repo create <REPO_NAME> --public --source=. --remote=origin --push
```

If a remote already exists, ensure the current branch is pushed:
```bash
git push -u origin HEAD
```

## Step 4 — Patch vite.config.ts for GitHub Pages base path
GitHub Pages serves under `/<repo-name>/`, so all asset paths must include that prefix.

Read `vite.config.ts`. Add or update the `base` field at the top of `defineConfig({...})`:
```ts
export default defineConfig({
  base: '/<REPO_NAME>/',
  plugins: [react()],
  // ...rest unchanged
});
```
Only change the `base` field — do not touch anything else.

Then commit this change:
```bash
git add vite.config.ts
git commit -m "Set base path for GitHub Pages"
git push
```

## Step 5 — Build
```bash
npm run build
```
If the build fails, show the full error and stop.

## Step 6 — Deploy build/ to gh-pages branch
```bash
npx gh-pages -d build
```
This publishes the `build/` directory to the `gh-pages` branch on origin.

## Step 7 — Enable GitHub Pages (if first deploy)
Use `--field` (not `-f`) to avoid zsh glob expansion issues:
```bash
gh api -X PUT "repos/<GITHUB_USERNAME>/<REPO_NAME>/pages" \
  --field "source[branch]=gh-pages" \
  --field "source[path]=/" 2>&1 || true
```
Ignore errors — Pages may already be enabled from a prior deploy.

## Step 8 — Revert vite.config.ts base path
The `base` setting breaks the local Vite dev server proxy. Always revert it after deploying:
- Remove the `base: '/...',` line added in Step 4.

Commit the revert so the repo stays runnable locally:
```bash
git add vite.config.ts
git commit -m "Revert base path (dev only)"
git push
```

## Step 9 — Print the live URL
Display:
```
https://<GITHUB_USERNAME>.github.io/<REPO_NAME>/
```

Remind the user:
- The site goes live within ~1 minute (GitHub Pages needs a moment to deploy).
- Guest mode works fully. Sign-in and score history require the Express backend (`node server/index.js`) running locally — they are not available on GitHub Pages.
