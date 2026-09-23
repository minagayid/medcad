# Pro-esthetic red-team review

Status: prototype review complete; not a clinical or manufacturing release.

## Decision

The product is a dependency-light review workstation for synthetic starter geometry and research references. It is not a patient-specific prosthesis generator and it does not claim to reconstruct a missing organ from an image. The UI now makes that boundary explicit:

- Template mode is the only mode that generates starter meshes.
- Research references can be catalogued or queued locally, but are not parsed or segmented by this prototype.
- Patient-specific design, anatomy fitting, clinical approval, and manufacturing qualification remain unavailable.
- Export is preview-only and requires a geometry check plus an explicit acknowledgment.

## Critic findings and responses

| Finding | Priority | Response |
| --- | --- | --- |
| Green validation implied clinical readiness | P0 | Validation is now neutral until run, reports closed topology/finite coordinates/envelope/wall checks, and leaves source/design intent in review. |
| Viewport and exported geometry could diverge | P0 | One `mesh-core.mjs` is used by the viewport, checks, and preview exporter. |
| Blend radius was metadata only | P1 | Radius now changes each starter family and has a regression assertion. |
| Dense inspector clipped the viewport at smaller widths | P1 | The inspector becomes an overlay with an explicit toggle; the library hides only at phone width. |
| Medical-looking names implied validated anatomy | P1 | Entries are named as contour, rim, joint, interface, or blank studies and are labelled templates. |
| “Import” suggested a working DICOM/ML pipeline | P1 | Import is labelled as a local queue; parsing, segmentation, and review are explicitly not implemented. |
| Reference libraries were not separated by role | P1 | The catalog distinguishes standards/provenance, segmentation, viewers, anatomy atlases, ML annotation, and research fixtures. |

## Library roles

The catalog is deliberately layered instead of presenting a single undifferentiated “medical library”.

1. **Source and provenance:** DICOM/DICOMweb, including frame-of-reference and segmentation/surface-segmentation concepts.
2. **Segmentation and review:** 3D Slicer, Segment Editor, OHIF/Cornerstone3D.
3. **Research annotation:** MONAI Label, with model terms and human review still required.
4. **Anatomical context:** Open Anatomy and Z-Anatomy/BodyParts3D; these are references, not device templates.
5. **Research fixtures:** TCIA and other collection-specific, de-identified datasets; use their own terms and provenance.

The next safe extension is a provenance-first case schema carrying source identifiers, coordinate frame, hashes, segmentation representation, model/version, uncertainty, and reviewer state. It should be added before any image-to-mesh or ML-assisted fitting feature.

## Evidence base

- 3D Slicer documents segmentation as a workflow for visualization, quantification, and 3D-printing preparation, with representations that require review: <https://slicer.readthedocs.io/en/latest/user_guide/image_segmentation.html>
- DICOM defines storage classes for CT/MR, segmentation, surface segmentation, surface scan mesh, and registration objects: <https://dicom.nema.org/medical/dicom/current/output/chtml/part04/sect_b.5.html>
- Open Anatomy is an atlas/reference project: <https://www.openanatomy.org/>
- Z-Anatomy publishes Blender-oriented anatomical models with project-specific license and attribution requirements: <https://github.com/Z-Anatomy/Models-of-human-anatomy>
- OHIF provides a web imaging-viewer reference architecture: <https://docs.ohif.org/>
- TCIA provides research imaging collections with collection-specific access and usage terms: <https://www.cancerimagingarchive.net/>

## Release gate

Before adding any patient-specific or ML-assisted workflow, require: de-identification handling, DICOM/DICOMweb provenance, explicit coordinate transforms, segmentation review state, uncertainty display, deterministic export manifests, mesh-kernel validation, process/material constraints, and qualified clinical/manufacturing review. Until those exist, the app should remain a transparent design-study tool.
