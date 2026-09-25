# medcad Windows desktop packaging review

Reviewed 2026-09-25 on the local `codex/rename-medcad` branch. This record concerns local packaging and dependency behavior only; it is not a security certification or a medical-device release review.

## Desktop host

- Electron main process opens the packaged static app through the existing Node HTTP server on loopback `127.0.0.1:4174`. The stable port preserves browser storage across launches; a single-instance lock prevents two copies from competing for that port. The separate command-line preview remains `127.0.0.1:4173`.
- The main process owns and closes the local server. It exposes no renderer Node integration or preload bridge. Renderer settings enable context isolation, sandboxing, and web security; local-server responses have a restrictive content-security policy; permission requests are denied; navigation stays on the app origin; only explicit HTTPS links are opened in the system browser.
- Fonts and atlas images no longer load from remote hosts. The core workspace, library catalog, and scan import work offline. External research links require operator action and an internet connection.
- The renderer does not persist imported surface geometry. Saved study snapshots omit imported filenames/source metadata; exported manifests omit raw filenames and include mesh format, source units and scale, size/type, SHA-256 (when Web Crypto is available), bounds, and check outcomes. Operators must de-identify source files and filenames; this app does not inspect data for identifiers.

## Exact dependency audit

- Direct development dependencies are exactly `electron@44.4.5` and `electron-builder@26.15.3`; both lock metadata and npm registry metadata report MIT. Electron 44.4.5 was the latest stable version returned by npm on the review date. Builder remains pinned at 26.15.3.
- `package-lock.json` was generated with `npm install --package-lock-only --ignore-scripts --no-audit --no-fund`. It contains 285 package records. Each record has lockfile license metadata: 213 MIT, 36 ISC, 9 BSD-3-Clause, 6 BSD-2-Clause, 6 Apache-2.0, 8 BlueOak-1.0.0, and one each for Python-2.0, WTFPL OR ISC, WTFPL, 0BSD, MIT OR CC0-1.0, and WTFPL OR MIT. No locked record lacked a license field, and none listed GPL/LGPL. This is a metadata inventory, not legal advice or a substitute for reviewing the actual distribution payload.
- Only one locked package sets `hasInstallScript`: `electron-winstaller@5.4.0` (MIT; exact registry tarball SRI matches the lock). Its reviewed `install` script is `node ./script/select-7z-arch.js`; that script copies the bundled `vendor/7z-<host-arch>.exe` and `.dll` to `vendor/7z.exe` and `.dll` inside the dev dependency. It does not spawn a process, access the network, or write outside that package directory. Electron and electron-builder have no lifecycle script in this lock.
- `npm audit --package-lock-only --audit-level=high` reported zero vulnerabilities on the review date. npm metadata and exact tarball contents for the lifecycle-script package were inspected before dependency restoration.
- Electron's packaged Windows runtime and electron-builder's Windows portable packaging tools are downloaded during build from Electron/electron-builder release infrastructure; those binaries are not npm lifecycle side effects. This build therefore requires network access. The official documentation describes Electron's platform binary download and the no-install Windows `portable` target: [Electron installation](https://www.electronjs.org/docs/latest/tutorial/installation), [Electron security guidance](https://www.electronjs.org/docs/latest/tutorial/security), [electron-builder Windows targets](https://www.electron.build/v26/docs/win/), [target selection](https://www.electron.build/v26/docs/targets/).

## Build and verification commands

From the `medcad` repository root on Windows x64 with Node.js 20+:

```powershell
npm ci --no-audit --no-fund
npm test
npm run desktop:pack
```

The packaging script is `electron-builder --win portable --x64`; the expected artifact is `exports/desktop/medcad-0.1.0-portable.exe`. Output is ignored by Git. A Windows x64 portable build was smoke-launched: the Electron window title was `medcad · design workstation`; its main process opened `127.0.0.1:4174`; HTTP GET `/`, `/app.js`, `/mesh-import.mjs`, and the medical reference notebook all returned 200. `CloseMainWindow()` returned true and the listener exited. This proves packaged startup, local static serving, and clean shutdown only. File-picker import, actual viewport rendering, export/manifest, and offline behavior were not manually exercised in the packaged window. Record the final binary digest in release metadata kept outside the package itself.

## Remaining release gates

- Build output is unsigned. SmartScreen reputation, signing identity, install/update strategy, supported Windows versions/architectures, crash diagnostics, and distribution channel remain undecided.
- Inspect the exact produced executable/payload and retained Electron/Chromium/7-Zip/toolset notices before redistribution; dependency metadata alone is not a final bundled-artifact SBOM.
- `medcad` remains a limited mesh-review prototype: no DICOM/NIfTI, segmentation, coordinate registration, fitting, repair, self-intersection/vertex-manifold proof, clinical assessment, or manufacturing qualification. The installer-free `.exe` changes its delivery form, not those capabilities.
- Imported topology is an edge-incidence-only screen. The UI text states winding, self-intersection, fit and solid validity are not assessed, and the imported status is never green/pass. A reversed-face tetrahedron fixture confirms that the undirected edge counts can still report all edges with two faces despite inconsistent winding.
