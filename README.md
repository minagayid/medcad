# medcad

medcad is a dependency-light, Blender-inspired workstation for exploring prosthetic-part geometry and preparing starter meshes for downstream milling or 3D-printing workflows.

> **Safety boundary:** this is a non-clinical design and visualization prototype. It does not diagnose, prescribe, fit, validate, or manufacture patient-ready medical devices. Any patient-specific design must be created from verified imaging and anatomy, reviewed by qualified clinical and manufacturing professionals, and validated against the intended material/process and applicable regulations.

The current prototype covers external prosthetic components and reconstruction-study geometry. It does not design living organs, biological tissue, or clinically approved implants.

## Included in this prototype

- Dark, Blender-like workspace with tool rail, central orbitable viewport, library, properties, and fabrication panels.
- Starter library for transtibial sockets, cranial plates, finger phalanx studies, orbital-rim supports, and custom blanks.
- Parametric controls for overall length, wall thickness, blend radius, symmetry, and reference plane.
- Solid / wire / X-ray viewport modes with construction grid, measurement badge, callouts, axis gizmo, orbit, zoom, fit, and reset controls.
- Starter validation checks for thickness and geometry envelope.
- STL and OBJ triangle-surface import with declared mm/cm/in units, conversion to mm, measured bounds, vertex/index/degenerate-face checks, and a limited indexed edge-count screen. The parsed input mesh is what the viewport and preview exporter use; it is not fitted or modified.
- Local snapshot persistence, viewport capture, and ASCII STL/OBJ preview export with an input hash/units/bounds manifest when a surface is loaded.
- Reference notebook in [`docs/medical-reference-notebook.md`](docs/medical-reference-notebook.md) with source-linked design cues and an ML-ready annotation schema.
- Provenance-aware catalog in [`docs/library-catalog.md`](docs/library-catalog.md) and [`data/library-catalog.json`](data/library-catalog.json), covering DICOM/DICOMweb, 3D Slicer, Open Anatomy, Z-Anatomy, OHIF/Cornerstone3D, MONAI Label, ITK, VTK, Open3D, CGAL, Open CASCADE, Gmsh, SlicerCMF, TCIA, and NIH 3D.
- Red-team decision record in [`docs/red-team-review.md`](docs/red-team-review.md), including the medical-library roles, release boundary, and deferred patient-specific work.

## Run locally

The app is static. Any local HTTP server can serve this folder. For example, with Node.js:

```powershell
node server.mjs
```

Then open `http://127.0.0.1:4173`.

## Windows desktop build

The repository includes a Windows x64 portable Electron target. On Windows with Node.js 20 or later, run `npm ci`, `npm test`, and `npm run desktop:pack`. The output is `exports/desktop/medcad-0.1.0-portable.exe`. The app bundles its Electron runtime and starts a loopback-only server on port 4174; it does not require a separate Node installation after packaging. Close another app using port 4174 before launching medcad. The local app works without a network connection; catalog links open only when selected by the operator.

Review dependency download behavior, third-party licensing, build output, and launch checks in [`docs/desktop-packaging.md`](docs/desktop-packaging.md). The local portable build is not signed and is not a reviewed clinical release.

Run the mesh import, starter geometry, and DOM contract smoke tests with:

```powershell
node tests/mesh-import.test.mjs
node tests/mesh-core.test.mjs
node tests/dom-contract.test.mjs
node tests/server.test.mjs
node tests/desktop-contract.test.mjs
```

## Export notes

Imported scan surfaces are capped at 25 MB, 60,000 vertices, and 20,000 triangles for the current canvas renderer. Source units must be declared because STL and OBJ do not reliably carry them. The UI labels its limited screen “edge incidence only”: it reports edges used by one face or by more than two faces, while winding, self-intersection, fit and solid validity are not assessed. A deliberately reversed tetrahedron face still passes that undirected edge-count screen. It does not prove vertex-manifoldness or an orientable watertight solid. DICOM and NIfTI are not parsed. There is no segmentation, scan registration, fit surface, clearance calculation, pressure/load model, surface repair, or anatomy-linked design operation. Export remains the unchanged input mesh (converted to mm) or a template preview, with clinical fit and manufacturing qualification explicitly unassessed. The application does not validate de-identification; operators must de-identify source data and filenames before import. Raw imported filenames are shown only in the active session and are omitted from saved snapshots and exports.

Template exports use the parametric mesh core and a limited gate for closed edge counts, finite coordinates, starter-envelope bounds, and a process-specific wall heuristic. Neither template nor imported-surface checks substitute for watertightness review in a production kernel, tolerance, orientation, support, sterilization, fatigue, biocompatibility, or regulatory review.

## Project decisions

See [`docs/ADR-001-static-prototype.md`](docs/ADR-001-static-prototype.md) for the initial architecture decision.
