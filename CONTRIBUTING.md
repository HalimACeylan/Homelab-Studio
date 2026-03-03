# Contributing to HomeLab Studio

Thank you for your interest in contributing! Please read these guidelines before opening issues or pull requests.

## Branch Structure

| Branch      | Purpose                | Who can push                      |
| ----------- | ---------------------- | --------------------------------- |
| `main`      | Stable codebase        | Owner only (via PR merge)         |
| `release`   | Live deployment source | Owner only                        |
| `feature/*` | Feature development    | Anyone — then open a PR to `main` |
| `fix/*`     | Bug fixes              | Anyone — then open a PR to `main` |

> **Never push directly to `main` or `release`.** These branches are protected.

## How to Contribute

1. **Fork** the repository
2. Create a branch off `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Make your changes and commit with a clear message
4. Open a **Pull Request** targeting `main`
5. A maintainer (@HalimACeylan) will review and merge

## Branch Protection (Owner Setup)

To enforce the rules above, enable branch protection on GitHub:

**Settings → Branches → Add rule** for both `main` and `release`:

- [x] Require a pull request before merging
- [x] Require approvals: **1** (yourself)
- [x] Dismiss stale pull request approvals when new commits are pushed
- [x] Require status checks to pass before merging → select **Build Check** (the CI workflow)
- [x] Require branches to be up to date before merging
- [x] Do not allow bypassing the above settings
- [x] Restrict who can push to matching branches → add only `HalimACeylan`

## What We Accept

- 🐛 Bug fixes
- 🎨 New node/application icons (SVG in `public/icons/<category>/`)
- ✨ New features — please open an issue first to discuss
- 📖 Documentation improvements

## Adding a New Node or Application

1. Add an SVG icon to `public/icons/applications/your-app.svg`
2. Register it in `src/modules/nodeTypes.js` under `APPLICATION_TYPES`:
   ```js
   "your-app": {
     name: "Your App",
     icon: "your-app",
     color: "#hexcolor",
     description: "Short description",
   },
   ```
3. The palette and properties panel will pick it up automatically.

## Code Style

- Vanilla JS (ES Modules) — no frameworks
- Keep modules focused on a single responsibility
- Add JSDoc comments to public methods
