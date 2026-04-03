Deploy this project to GitHub Pages as a static frontend. Follow these steps exactly:

## Step 1 — Check prerequisites
Run the following checks in parallel:
- `gh --version` to confirm GitHub CLI is installed. If missing, tell the user to install it from https://cli.github.com and stop.
- `gh auth status` to confirm they are logged in. If not, tell the user to run `gh auth login` and stop.
- `git rev-parse --is-inside-work-tree 2>/dev/null || echo "not-a-repo"` to check git status.

## Step 2 — Initialize git repo (if needed)
If the directory is not a git repo:
```bash
git init
git add .
git commit -m "Initial commit"
```

## Step 3 — Create GitHub repo (if no remote exists)
Check for a remote: `git remote -v`

If no remote is set:
1. Get the GitHub username: `gh api user --jq .login`
2. Derive a repo name from the project folder name (lowercase, hyphens instead of spaces).
3. Create the repo and push:
```bash
gh repo create <REPO_NAME> --public --source=. --remote=origin --push
```

If a remote already exists, just make sure the current branch is pushed:
```bash
git push -u origin HEAD
```

## Step 4 — Patch vite.config.ts for GitHub Pages base path
GitHub Pages serves the site under `/<repo-name>/`, so assets must use that base.

Read `vite.config.ts`. In the `defineConfig({...})` object, set or update the `base` field to `/<REPO_NAME>/`.

Example — add `base` inside the existing config object:
```ts
export default defineConfig({
  base: '/my-repo-name/',
  plugins: [react()],
  // ...rest unchanged
});
```

Only change the `base` field — do not touch anything else.

## Step 5 — Build
```bash
npm run build
```

Confirm it exits 0. If it fails, show the error and stop.

## Step 6 — Deploy build/ to gh-pages branch
Use the `gh-pages` npm package to push the `build/` directory:

```bash
npx gh-pages -d build
```

This creates/updates the `gh-pages` branch and pushes it to origin automatically.

## Step 7 — Enable GitHub Pages (if first deploy)
Run:
```bash
gh api repos/{owner}/{repo} --jq '.name' 2>/dev/null
gh api -X PUT repos/{owner}/{repo}/pages -f source[branch]=gh-pages -f source[path]=/ 2>/dev/null || true
```
Ignore errors here — Pages may already be enabled from a prior deploy.

## Step 8 — Restore vite.config.ts base (optional cleanup)
If the user is also running the app locally and needs `base` removed (it breaks the Vite dev proxy), revert the `base` field back after deployment:
- Remove the `base: '/...',` line you added in Step 4.

Ask the user: "Should I remove the base path from vite.config.ts now so local dev still works?"

## Step 9 — Print the live URL
Construct and display the URL:
```
https://<GITHUB_USERNAME>.github.io/<REPO_NAME>/
```

Tell the user:
- The site will be live within ~1 minute (GitHub Pages takes a moment to build).
- The backend (auth + score history) is not available on GitHub Pages — guest mode works fully, but sign-in requires the Express server.
