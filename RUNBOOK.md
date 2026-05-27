# nexus-sdk-js RUNBOOK

> **Status**: in place at `packages/nexus-sdk-js/RUNBOOK.md` (added 2026-05-27).
> **Owner**: 10CG Backend / DevOps
> **Related**: sibling [`nexusm-mcp-server/RUNBOOK.md`](https://forgejo.10cg.pub/10CG/nexusm-mcp-server/src/branch/main/RUNBOOK.md) — same npm publish landmines apply to both `@nexusm/*` packages; this file is the SDK-specific copy with SDK-specific tweaks.

---

## 0. RELEASE PROCEDURE (canonical — follow in order)

> **Why this section exists**: `@nexusm/sdk@1.3.0` first publish (2026-05-24) took 5 iterations (account 2FA setup / Bitwarden passkey / scoped first-publish / `--access public` flag / etc.). This procedure consolidates every known landmine into a single sequential checklist so v1.3.1+ is a 5-minute exercise.
>
> **Architecture context**: npm publish runs from **a developer's local machine, not from Aether CI runner**. Aether `docs/guides/forgejo-ci-internal-mirror.md` (Aether #137) explicit design goal is "CI 热路径不再有任何跨境请求"; publishing to npmjs.com is cross-border and intentionally not supported on Aether runners. Future: when this package gets mirrored to `github.com/10CG/nexus-sdk-js`, `.github/workflows/publish.yml` will automate this; until then, follow this manual procedure.

### 0.1 Pre-flight (1 minute)

```bash
cd /home/dev/nexus/packages/nexus-sdk-js

# (a) On correct branch + latest main
git status                         # clean working tree expected
git log --oneline -1               # match expected release commit

# (b) Version matches intended release
node -p "require('./package.json').version"   # e.g. 1.3.1

# (c) npm authenticated as `10cg` (NOT a personal account, NOT empty)
npm whoami                         # MUST return: 10cg

# (d) Node version sane
node --version                     # ≥ 18 (engines.node in package.json)
```

**Stop here if any of (a)-(d) fails.** See landmines §0.5.

### 0.2 Install deps + build (60-90s on warm machine)

```bash
npm ci                             # installs devDeps from lockfile
                                   # ← required if running from a fresh
                                   #   checkout / different machine (Landmine D)

npm run build                      # tsup → dist/index.{js,mjs,d.ts,d.mts}
ls dist/index.js dist/index.mjs dist/index.d.ts dist/index.d.mts
                                   # ALL 4 must exist (dual ESM + CJS shipping)
```

**SDK does NOT have a `bin` field** — it's a library, not a CLI. So no execute-bit check needed (this is the main difference from `nexusm-mcp-server` §0.2 step). Landmine F (chmod) does not apply here.

### 0.3 Local publish (interactive, ~30s plus 2FA web auth)

```bash
npm publish
```

**Expected output**:

```
npm notice 📦  @nexusm/sdk@<X.Y.Z>
npm notice ... (tarball with 9 files including dist/**)
npm notice total files: 9                   ← MUST be 6+ not 4
                                            ← if 4, dist/ wasn't built — re-do §0.2
Authenticate your account at:
https://www.npmjs.com/auth/cli/<uuid>
Press ENTER to open in the browser...       ← first-publish or expired session
+ @nexusm/sdk@<X.Y.Z>
```

If browser-auth prompt appears:
1. Press ENTER (browser opens)
2. Bitwarden auto-fills passkey
3. Click "Sign in" → "Allow"
4. Terminal completes publish

### 0.4 Verify (30s)

```bash
# Registry visibility (HTTP 200 means published)
curl -sI --max-time 8 "https://registry.npmjs.org/@nexusm/sdk/<X.Y.Z>" | head -1

# Latest tag pointer (should match what you just published)
curl -s --max-time 8 "https://registry.npmjs.org/@nexusm/sdk/latest" \
  | python3 -c "import sys,json;print('latest:',json.load(sys.stdin).get('version'))"

# Smoke test: import works without resolution error
node -e "import('@nexusm/sdk').then(m => console.log('NexusClient ok:', typeof m.NexusClient))"
                                   # MUST print "NexusClient ok: function"
                                   # NOT an ERR_MODULE_NOT_FOUND
```

### 0.5 Landmines (recognized so far — each has ≥ 1 prior victim)

| # | Symptom | Root cause | Fix | Memory |
|---|---------|-----------|-----|--------|
| **A** | `E402 Payment Required - You must sign up for private packages` | First publish of new scoped package without `--access public` | Add `publishConfig.access=public` to `package.json` (already done); or pass `--access public` on CLI | [[feedback_npm_granular_token_org_scope]] |
| **B** | `E403 Forbidden - Two-factor authentication ... required to publish packages` | Account has no 2FA configured | Set up account 2FA via Bitwarden passkey on npmjs.com → Settings → Two-Factor Auth | [[feedback_npm_granular_token_org_scope]] |
| **C** | `E404 Not Found - PUT registry.npmjs.org/@nexusm%2fsdk` + `npm whoami` returns expected user | Session token from a different package's web-auth lacks first-publish rights on new package | `npm logout && npm login` to mint fresh session | [[feedback_npm_first_publish_session_token]] |
| **D** | `Tarball Details: total files: 4`, only LICENSE/README/CHANGELOG/package.json | `npm ci` not run on this machine → tsup missing → `prepublishOnly` `npm run build` silently fails → empty dist | Run `npm ci` first; verify `ls dist/index.{js,mjs,d.ts}` before re-publishing | mcp-server RUNBOOK §0.2 (witnessed there) |
| **E** | `code ENEEDAUTH` after tarball assembly | Local `~/.npmrc` has no `_authToken` (fresh machine) | `npm login` on this machine; or copy `~/.npmrc` from previously-logged-in machine | mcp-server RUNBOOK §0.3 (witnessed there) |
| **G** | `ENEEDAUTH against http://192.168.69.206:4873` (Aether Verdaccio) | Tried to publish from Aether runner — wrong fit | Publish from local dev machine, NOT Aether runner | [[feedback_align_with_platform_arch_not_workaround]] |
| **H** | `EIDLETIMEOUT for host registry.npmjs.org` during `npm ci` | Tried to do `npm ci` from Aether runner — cross-border outbound unoptimized | Same as G: do this from local dev | [[feedback_align_with_platform_arch_not_workaround]] |

> **Landmines F (chmod) and I (eslint peer dep) do NOT apply to SDK**: F is mcp-server-specific (SDK has no `bin`); I was an mcp-server-specific lockfile drift that didn't repro on SDK. If SDK hits a similar peer-dep ERESOLVE in future, copy the mcp-server fix.

### 0.6 Quarterly re-verification (every 90 days)

NPM_TOKEN was rotated for `nexusm-mcp-server` repo on Forgejo (per mcp-server RUNBOOK §2). SDK doesn't have a Forgejo `NPM_TOKEN` secret (CI publish workflow removed per project leader 2026-05-27 decision; publish goes via local CLI). When the GitHub mirror lands (FU-MCP-SERVER-GITHUB-MIRROR pattern applied to SDK), the GitHub-side `NPM_TOKEN` should be on the same 90-day rotation.

### 0.7 Future automation

When `nexus-sdk-js` gets mirrored to `github.com/10CG/nexus-sdk-js` (tracked alongside FU-MCP-SERVER-GITHUB-MIRROR in nexus phase-d-archive-checklist.md §12.B), `.github/workflows/publish.yml` on the mirror will automate §0.2-§0.4 on tag push. Until then, this section is the canonical path.

---

## 1. CHANGELOG maintenance

This package ships with a `CHANGELOG.md`. Before every release, append a section under `## [Unreleased]` → renamed to `## [X.Y.Z] - YYYY-MM-DD` at release time. Categories per Keep-A-Changelog convention:

- **Added** — new features
- **Changed** — non-breaking behaviour changes
- **Deprecated** — features still working but planned for removal
- **Removed** — features removed in this version
- **Fixed** — bug fixes
- **Security** — security-relevant fixes

CHANGELOG entries are part of the tarball (`files:` includes `README.md` + via package directory all `.md` files), so users running `npm view @nexusm/sdk` can see history.

---

## 2. See also

- Sibling RUNBOOK: [`@nexusm/mcp-server` RUNBOOK](https://forgejo.10cg.pub/10CG/nexusm-mcp-server/src/branch/main/RUNBOOK.md) — has the full token rotation runbook (§2), namespace ownership notes (§4), and CI workflow reference (§5); SDK shares the npm policies but not the bin/exec quirks
- US-037 spec: nexus `openspec/changes/us-037-mcp-server-exposure/`
- Phase D archive checklist: nexus `openspec/changes/us-037-mcp-server-exposure/phase-d-archive-checklist.md` §12.B for GitHub mirror plan
- Memory entries cross-referenced in §0.5 landmines table
