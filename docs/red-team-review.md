# medcad red-team review

Status: prototype review complete; not a clinical or manufacturing release.

## Decision

The product is a dependency-light review workstation for synthetic starter geometry and bounded STL/OBJ surface inspection. It is not a patient-specific prosthesis generator and it does not claim to reconstruct anatomy from an image. The UI now makes that boundary explicit:

- Template mode is the only mode that generates starter meshes.
- STL/OBJ input is parsed with a declared unit scale, bounds and limited mesh-integrity checks; the input mesh itself is shown and exported as a preview. DICOM/NIfTI are unsupported, and no scan is segmented, registered, fitted, repaired, or modified.
- Patient-specific design, anatomy fitting, clinical approval, and manufacturing qualification remain unavailable.
- Export is preview-only and requires a geometry check plus an explicit acknowledgment.

## Critic findings and responses

| Finding | Priority | Response |
| --- | --- | --- |
| Green validation implied clinical readiness | P0 | Validation is now neutral until run, reports closed topology/finite coordinates/envelope/wall checks, and leaves source/design intent in review. |
| Viewport and exported geometry could diverge | P0 | Template previews share the starter mesh; imported-surface preview and export use the parsed input mesh in mm without a fit transformation. |
| Blend radius was metadata only | P1 | Radius now changes each starter family and has a regression assertion. |
| Dense inspector clipped the viewport at smaller widths | P1 | The inspector becomes an overlay with an explicit toggle; the library hides only at phone width. |
| Medical-looking names implied validated anatomy | P1 | Entries are named as contour, rim, joint, interface, or blank studies and are labelled templates. |
| “Import” suggested a working DICOM/ML pipeline | P1 | UI accepts only STL/OBJ triangle surfaces; DICOM/NIfTI are explicitly unsupported. The UI labels source units and the preview-only, no-fit state. |
| Reference libraries were not separated by role | P1 | The catalog distinguishes standards/provenance, segmentation, viewers, anatomy atlases, ML annotation, and research fixtures. |

## Library roles

The catalog is deliberately layered instead of presenting a single undifferentiated “medical library”.

1. **Source and provenance:** DICOM/DICOMweb, including frame-of-reference and segmentation/surface-segmentation concepts.
2. **Segmentation and review:** 3D Slicer, Segment Editor, OHIF/Cornerstone3D.
3. **Research annotation:** MONAI Label, with model terms and human review still required.
4. **Anatomical context:** Open Anatomy and Z-Anatomy/BodyParts3D; these are references, not device templates.
5. **Research fixtures:** TCIA and other collection-specific, de-identified datasets; use their own terms and provenance.

The current surface manifest carries a SHA-256 when Web Crypto is available, source format/units/scale, measured bounds and check outcomes. It does not yet carry DICOM identifiers, a coordinate frame, transform/registration evidence, segmentation representation, model/version, uncertainty, or reviewer identity. Those remain prerequisites before any image-to-mesh or ML-assisted fitting feature.

The indexed edge-incidence screen detects edges used by one face (boundary) or more than two faces. Its displayed status explicitly says “winding, self-intersection, fit and solid validity not assessed”; a contradictory-winding tetrahedron demonstrates that all undirected edges can have two incident faces while winding remains wrong. Therefore this screen never yields a green/pass result for imported geometry and does not establish vertex-manifoldness, normal consistency, self-intersection absence, fit, or a valid solid. The canvas renderer is a lightweight 2D projection with limits of 25 MB, 60,000 vertices, and 20,000 triangles. The exact input triangle ordering is preserved on export; only coordinates are unit-scaled to mm.

The original source filename is transiently shown in the active session, but is omitted from local snapshots and export filenames/manifests. The mesh SHA-256 and byte size remain in the manifest for provenance. The app does not detect identifying content in source geometry; operators remain responsible for de-identifying files before import.

## Evidence base

- 3D Slicer documents segmentation as a workflow for visualization, quantification, and 3D-printing preparation, with representations that require review: <https://slicer.readthedocs.io/en/latest/user_guide/image_segmentation.html>
- DICOM defines storage classes for CT/MR, segmentation, surface segmentation, surface scan mesh, and registration objects: <https://dicom.nema.org/medical/dicom/current/output/chtml/part04/sect_b.5.html>
- Open Anatomy is an atlas/reference project: <https://www.openanatomy.org/>
- Z-Anatomy publishes Blender-oriented anatomical models with project-specific license and attribution requirements: <https://github.com/Z-Anatomy/Models-of-human-anatomy>
- OHIF provides a web imaging-viewer reference architecture: <https://docs.ohif.org/>
- TCIA provides research imaging collections with collection-specific access and usage terms: <https://www.cancerimagingarchive.net/>

## Release gate

Before adding any patient-specific or ML-assisted workflow, require: de-identification handling, DICOM/DICOMweb provenance, explicit coordinate transforms, segmentation review state, uncertainty display, deterministic export manifests, a robust mesh-kernel review (including manifoldness, orientation and self-intersection checks), process/material constraints, and qualified clinical/manufacturing review. Until those exist, the app should remain a transparent design-study tool.
