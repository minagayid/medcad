# Contralateral surface-proposal research

Research-only geometry proposals. No clinical fit, load-bearing prosthesis, implant interface, or CAM toolpath is validated.

## Working implementation

This separate Node.js 22 module reflects an already cropped, millimetre-normalized triangle surface across an operator-defined plane. It corrects triangle winding after reflection, checks finite coordinates and nonzero triangle area, rejects surfaces that cross the selected plane beyond the operator tolerance, and reports boundary, non-manifold and inconsistent shared edges. The source is not mutated. A proposal manifest hashes the exact source JSON bytes and records the plane, side, study region and explicit non-clinical status.

It is a research utility, not a new feature in the main graphical editor. Existing template kits, imports and exports are preserved. There is no automatic crop, segmentation, photo-to-3D reconstruction, bilateral registration, tissue interface, retention, pressure map, socket fit, mold construction, load model, implant design or CAM generation. A mirrored external surface is not a completed prosthesis. Labels such as `leg` and `orbit` are study metadata, not validated device coverage.

`surface-proposal.mjs` exports `planeFromLandmarks`, `mirrorSurface`, `inspectProposalMesh` and `proposeMirror`. Three reviewed non-collinear landmarks can define the plane, or an explicit origin/normal can be supplied. The normal is normalized internally. Reflection reverses orientation, so the output reverses every triangle's winding. The edge screen does not establish absence of self-intersection, vertex manifoldness, solid validity, anatomy or fit.

## Run

From the repo root, with Node.js 22:

```sh
node --test research/surface-proposal.test.mjs
node research/mirror-surface.mjs /private/study/job.json /private/study/proposal.json
```

The output must not exist. The CLI refuses to overwrite it. Keep patient-derived files outside the repository. File paths are resolved relative to the job file. The input surface is UTF-8 JSON with `vertices: [[x,y,z], ...]` and zero-based `triangles: [[a,b,c], ...]`. Convert STL/OBJ through the existing importer or a reviewed external tool before this step; this CLI does not parse those formats directly. The surface must already be cropped to one side and normalized to millimetres. Declaring `mm` does not verify the scanner calibration or conversion.

A job file:

```json
{
  "surfaceFile": "authorized-cropped-surface.json",
  "units": "mm",
  "region": "ear",
  "plane": {"origin": [0,0,0], "normal": [1,0,0]},
  "sourceSide": "positive",
  "planeToleranceMm": 0.01
}
```

Source-side values are `positive` or `negative` relative to the plane normal. Supported study labels are `ear`, `nose`, `orbit`, `hand`, `leg` and `external-cleft-study`. The plane tolerance is an operator-selected software threshold, not a clinically established tolerance. Inputs are limited to 25 MiB, 60,000 vertices and 20,000 triangles. No sample patient data or third-party prosthetic geometry is bundled.

## Region-specific development requirements

| Region | Potential starting resource or method | Missing before a device claim |
|---|---|---|
| External ear | Reviewed contralateral surface reflection; research review below | Facial registration, asymmetry assessment, margins, retention, molds/material behavior, color matching and clinician/anaplastologist review |
| Nose | Rights-cleared reference or prior patient surface with reviewed landmarks | Do not simply mirror half a nose and call it restoration; airway, soft-tissue movement, margins, retention and appearance need a separate workflow |
| Orbit / ocular | Separate external orbital and ocular cases | A mirrored face surface does not reconstruct a safe ocular prosthesis or living eye; socket, eyelid interaction and specialist fitting remain outside scope |
| Hand | e-NABLE device-specific CAD, sizing and safety guidance | Source license for each design, recipient eligibility, motion, joint/cable/hardware design, function and durability testing |
| Leg / socket | Specialist CAD and measured residual-limb studies | Tissue loading, pressure, alignment, gait, fatigue and structural qualification; never infer a load-bearing socket from a mirrored mesh |
| Cleft-related external study | Clinician-defined anatomy and intended device class first | External study geometry must not be confused with surgical planning, infant molding appliances, obturators or clinical treatment |

## Verified resources

Reviewed 21 November 2026:

- [NIH 3D e-NABLE collection](https://3d.nih.gov/collections/prosthetics): discover community assistive-device models. Review each model's actual license and safety documentation. Collection membership is not approval for a patient or a blanket redistribution license.
- [e-NABLE CAD files](https://hub.e-nable.org/p/devices?p=CAD+Files+for+e-NABLE+Designs): source CAD can be available for specific designs; availability and links vary. The page itself records access problems and alternative locations. No asset has been downloaded or incorporated here.
- [e-NABLE sizing guidance](https://hub.e-nable.org/p/devices?p=e-NABLE+Device+Sizing): emphasizes geometry-aware virtual fitting and cautions that basic measurements can size poorly. Generic scale-to-bounding-box is therefore not presented as fitting.
- [e-NABLE generation script](https://github.com/AriKorpus/enable-generation-script/tree/main): an MIT-licensed automation-script example for measurement-driven OpenSCAD rendering. Its script license must not be confused with the licenses of the underlying device designs. Not integrated or copied.
- [Auricular CAD/CAM systematic review, 2023](https://pmc.ncbi.nlm.nih.gov/articles/PMC10532239/): describes contralateral-ear mirroring as one part of a multi-step clinical workflow, alongside molds, retention and material processing. This supports investigating reflection, not clinical validity of this implementation.
- [3D Slicer](https://www.slicer.org/): a BSD-style open-source segmentation/registration workstation, with extension-specific terms to check. Suitable external preparation candidate, not embedded here.
- [Open3D ICP documentation](https://www.open3d.org/docs/release/tutorial/pipelines/icp_registration.html): candidate for evaluated registration work. This implementation does not run ICP.
- [MeshLib](https://github.com/meshinspector/meshlib): current upstream describes source-available non-commercial/educational use and commercial licensing. Do not assume it is unrestricted commercial open source. Not added as a dependency.

## Roadmap and release gates

1. Add a reviewed crop/plane/landmark editor and preserve scan-frame/units provenance through import, proposal and saves. Quantify sensitivity to plane error.
2. Add rights-cleared, versioned, per-region asset manifests, with exact file hashes and clinical-versus-educational roles. Do not turn anatomy-atlas meshes into device libraries by renaming them.
3. Evaluate registration against independent landmarks and controlled synthetic cases before patient datasets. No unauthorised patient scans or photos in the public repo.
4. Implement separate specialist workflows for external cosmetic surfaces, upper-limb mechanisms, sockets and ocular devices. Do not use one template-fitting algorithm for all four.
5. Require clinical, materials, manufacturing, privacy and regulatory review appropriate to the intended device before any clinical or manufacturing claim. Unit tests establish only the tested mathematical/software behavior.
