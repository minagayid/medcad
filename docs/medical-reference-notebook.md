# medcad · medical reference notebook

**Notebook status:** design-context only  
**Prepared:** 2026-09-23  
**Interpretation of “ML them as markdown”:** this notebook uses an ML-ready Markdown schema for image provenance, anatomical tags, geometry cues, and confidence/review fields. It does **not** claim that a trained medical model inferred these labels, and it must not be used to make a diagnosis or select a patient treatment.

## Safety and provenance

- No patient images are bundled in this repository.
- The reference images below are public documentation assets or source-page links chosen to illustrate workflow patterns, not patient-specific design templates.
- Any real imaging workflow should preserve the original study, modality, acquisition context, segmentation version, operator/model provenance, and reviewer sign-off.
- A medical image can support visualization or measurement, but it does not by itself define a safe implant, socket, organ substitute, material, tolerance, or manufacturing process.

## Image references

### REF-001 · segmentation as an explicit design input

![3D Slicer image segmentation views with 2D slices and a 3D reconstruction](https://github.com/Slicer/Slicer/releases/download/docs-resources/image_segmentation_views.png)

- **Source:** [3D Slicer — Image Segmentation](https://slicer.readthedocs.io/en/v4.11/user_guide/image_segmentation.html)
- **Modality/context:** documentation example; modality and patient context are not asserted here.
- **Design cues:** keep axial/coronal/sagittal views connected to the 3D result; show segmentation layers as inspectable objects; treat the reference plane and the reconstructed mesh as separate but linked states.
- **Product mapping:** the viewport’s reference plane toggle, reference atlas, and future image-to-mesh provenance panel.
- **Do not infer:** no anatomy, defect boundary, or clinical measurement should be inferred from this screenshot.

### REF-002 · explicit annotation and segment editing

![3D Slicer Segment Editor documentation image](https://github.com/Slicer/Slicer/releases/download/docs-resources/image_segmentation_segment_editor_module.png)

- **Source:** [3D Slicer — Image Segmentation](https://slicer.readthedocs.io/en/v4.11/user_guide/image_segmentation.html)
- **Design cues:** make annotation operations visible; preserve a distinction between source image, segmentation, and derived surface; allow manual review even when an automatic or semi-automatic method is available.
- **Product mapping:** the proposed `reference`, `measure`, and `mirror` tools and the import queue.
- **Evidence limit:** Slicer documentation describes segmentation as useful for visualization, quantification, 3D printing, and masking; it does not establish a clinical design or manufacturing specification for this app.

### REF-003 · transtibial socket interface and pressure distribution

- **Source:** [Review of the socket design and interface pressure measurement for transtibial prosthesis (PubMed)](https://pubmed.ncbi.nlm.nih.gov/25197716/)
- **Design cues:** treat the socket as an interface between residual limb and prosthetic components; make load/pressure study an explicit future layer rather than a hidden visual assumption.
- **Product mapping:** the starter note “posterior relief follows load path” is a design-study placeholder only; a future implementation should accept pressure maps or clinician-authored regions and show their provenance.
- **Evidence limit:** interface biomechanics and quantitative pressure findings are heterogeneous; the review does not provide a universal relief pattern.

### REF-004 · load-bearing additive manufacturing workflow

- **Source:** [Essential Requirements and Relevant Technologies for Load-Bearing 3D-Printed Transtibial Prosthetic Sockets and Their Components (PubMed)](https://pubmed.ncbi.nlm.nih.gov/41406382/)
- **Design cues:** separate geometry editing from process qualification; record intended process, material, orientation, and test standard; keep a visible “review before manufacture” gate.
- **Product mapping:** the Fabrication panel, process/material/layer controls, validation card, and non-clinical export warning.
- **Evidence limit:** the review discusses load-bearing socket requirements and manufacturing/testing considerations; it does not validate medcad’s starter meshes.

### REF-005 · patient-specific cranial and orbital reconstruction

- **Sources:** [Next-generation personalized cranioplasty treatment (PubMed)](https://pubmed.ncbi.nlm.nih.gov/36272686/) and [Is the Pre-Shaping of an Orbital Implant on a Patient-Specific 3D-Printed Model Advantageous? (PubMed)](https://pubmed.ncbi.nlm.nih.gov/37240532/)
- **Design cues:** cranial and orbital entries should be modeled as contour/fit studies tied to imaging, defect boundaries, and reviewable fixation/clearance annotations—not as universal shapes.
- **Product mapping:** Cranial plate and Orbital rim starter cards, with future region tags for defect boundary, fixation zone, keep-out zone, and bilateral symmetry.
- **Evidence limit:** reviews report heterogeneous indications, designs, materials, and evidence quality; no single best design or material follows from these sources.

### REF-006 · additive-manufacturing design and quality gates

- **Sources:** [FDA Technical Considerations for Additive Manufactured Medical Devices](https://www.fda.gov/regulatory-information/search-fda-guidance-documents/technical-considerations-additive-manufactured-medical-devices), [FDA Process of 3D Printing Medical Devices](https://www.fda.gov/medical-devices/3d-printing-medical-devices/process-3d-printing-medical-devices), and [FDA Medical Applications of 3D Printing](https://www.fda.gov/medical-devices/3d-printing-medical-devices/medical-applications-3d-printing)
- **Design cues:** define a performance envelope before patient matching; carry the digital design into a buildable workflow; control material and process; test the finished device according to intended use and applicable requirements.
- **Product mapping:** the UI intentionally labels its checks “starter checks,” exposes material/process/layer settings, and makes the export warning visible.
- **Evidence limit:** FDA pages are regulatory guidance and educational material, not a certification of this prototype or a substitute for device-specific regulatory review.

## ML-ready annotation records

The following records are a format proposal for a future reviewed dataset. Fields are intentionally explicit so that a model can be evaluated against human-reviewed labels rather than treated as an authority.

```yaml
schema: medcad.medical-reference.v0
review_policy: human_review_required
records:
  - id: REF-001
    source_kind: documentation_screenshot
    modality: unknown
    anatomical_targets: [segmentation, reconstructed_surface]
    geometry_cues: [linked_multiplanar_views, inspectable_segments, surface_provenance]
    suggested_regions: [reference_plane, derived_mesh]
    model_inference: none
    reviewer_status: contextual_only
  - id: MC-101
    source_kind: patient_specific_imaging
    modality: CT_or_3D_scan
    anatomical_targets: [residual_limb, socket_interface]
    geometry_cues: [load_path, pressure_relief, trim_line, suspension_interface]
    suggested_regions: [relief_zone, sensitive_zone, measurement_landmark]
    model_inference: not_implemented
    reviewer_status: requires_clinician_and_prosthetist_review
  - id: CF-204
    source_kind: patient_specific_imaging
    modality: CT
    anatomical_targets: [cranial_defect, surrounding_bone]
    geometry_cues: [defect_boundary, contour_continuity, fixation_zone, clearance]
    suggested_regions: [defect_boundary, fixation_zone, keep_out_zone, symmetry_axis]
    model_inference: not_implemented
    reviewer_status: requires_surgeon_and_manufacturer_review
```

## Proposed image-to-mesh handoff

```text
source study → provenance record → segmentation / annotation → reviewed surface
     → parametric design envelope → process-aware validation → qualified manufacturing review
```

The current prototype intentionally stops before patient-specific segmentation, automated landmark inference, finite-element analysis, and manufacturing qualification. Those are the next engineering and clinical-governance workstreams, not features to simulate with a visual placeholder.
