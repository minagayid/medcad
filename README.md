# pro-esthetic

pro-esthetic is a dependency-light, Blender-inspired workstation for exploring prosthetic-part geometry and preparing starter meshes for downstream milling or 3D-printing workflows.

> **Safety boundary:** this is a non-clinical design and visualization prototype. It does not diagnose, prescribe, fit, validate, or manufacture patient-ready medical devices. Any patient-specific design must be created from verified imaging and anatomy, reviewed by qualified clinical and manufacturing professionals, and validated against the intended material/process and applicable regulations.

The current prototype covers external prosthetic components and reconstruction-study geometry. It does not design living organs, biological tissue, or clinically approved implants.

## Included in this prototype

- Dark, Blender-like workspace with tool rail, central orbitable viewport, library, properties, and fabrication panels.
- Starter library for transtibial sockets, cranial plates, finger phalanx studies, orbital-rim supports, and custom blanks.
- Parametric controls for overall length, wall thickness, blend radius, symmetry, and reference plane.
- Solid / wire / X-ray viewport modes with construction grid, measurement badge, callouts, axis gizmo, orbit, zoom, fit, and reset controls.
- Starter validation checks for thickness and geometry envelope.
- Local snapshot persistence, reference-image import queue, viewport capture, and ASCII STL/OBJ export.
- Reference notebook in [`docs/medical-reference-notebook.md`](docs/medical-reference-notebook.md) with source-linked design cues and an ML-ready annotation schema.

## Run locally

The app is static. Any local HTTP server can serve this folder. For example, with Node.js:

```powershell
node server.mjs
```

Then open `http://127.0.0.1:4173`.

## Export notes

The exporter currently emits deliberately simple starter geometry so the workflow can be tested without pretending to produce a validated clinical mesh. The validation panel is a UI affordance, not a substitute for watertightness, tolerance, orientation, support, sterilization, fatigue, biocompatibility, or regulatory review.

## Project decisions

See [`docs/ADR-001-static-prototype.md`](docs/ADR-001-static-prototype.md) for the initial architecture decision.
