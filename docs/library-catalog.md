# medcad library catalog

The serious version of medcad should not ship anonymous “medical prosthetic” meshes. It should maintain a provenance-aware catalog that separates anatomical context, source imaging, segmentation, design kits, and manufacturing references.

## Recommended stack

| Layer | Candidate library / standard | Why it belongs | Boundary |
|---|---|---|---|
| Source imaging | [DICOM/DICOMweb](https://dicom.nema.org/medical/dicom/current/output/chtml/part18/ps3.18.html) | Study, series, instance, frame-of-reference, and web-service provenance | Do not flatten a study into a filename |
| Segmentation | [3D Slicer](https://www.slicer.org/) + Segmentations | Labelmaps, closed surfaces, segment terminology, statistics, export | Human review remains required |
| Surface representation | [DICOM Surface Segmentation](https://dicom.nema.org/medical/dicom/2023d/output/chtml/part03/sect_A.57.html) | Standardized polygonal surfaces tied to a coordinate system | Surface data may need the source images for context |
| Viewer | [OHIF](https://docs.ohif.org/) + Cornerstone3D | Web-native DICOMweb viewing, measurements, labelmaps, task-based modes | Viewer annotations are derived data, not truth |
| Image processing | [ITK](https://docs.itk.org/en/latest/) | Registration, segmentation, and N-dimensional image processing | Not a complete design or manufacturing system |
| Anatomy context | [Open Anatomy Project](https://www.openanatomy.org/) | Open atlas work across MRI, CT, and named anatomical structures | Atlas geometry is not a patient-matched device |
| Blender anatomy | [Z-Anatomy](https://github.com/Z-Anatomy/Models-of-human-anatomy) | Blender-native reference meshes and labels | CC BY-SA and upstream attribution must be preserved |
| ML annotation | [MONAI Label](https://docs.monai.io/projects/label/en/latest/) | Human-in-the-loop interactive labeling and active learning | Model version, uncertainty, edits, and reviewers are mandatory |
| Image / mesh processing | [ITK](https://docs.itk.org/), [VTK](https://vtk.org/), [Open3D](https://www.open3d.org/) | Registration, transforms, polydata, point clouds, and surface inspection | Preserve coordinate frames, parameters, and registration error |
| Robust geometry | [CGAL](https://www.cgal.org/) | Candidate predicates, mesh generation, and polygon-mesh operations | A future kernel still needs tolerance and watertightness tests |
| CAD / milling handoff | [Open CASCADE](https://dev.opencascade.org/) | Candidate STEP/BREP solids, booleans, and fillets | A preview surface is not a CAD solid or verified toolpath |
| Volumetric meshing | [Gmsh](https://gmsh.info/) | Research reference for remeshing and finite-element preparation | Simulation meshes are not clinical device approval evidence |
| Craniofacial research | [SlicerCMF](https://github.com/DCBIA-OrthoLab/SlicerCMF) | Domain-specific registration and dental/craniofacial workflows | Use for method discovery and review; check extension terms |
| Research test data | [TCIA](https://www.cancerimagingarchive.net/) and [NIH 3D](https://3d.nih.gov/) | De-identified imaging and biomedical model references | Collection and asset terms vary |

## Data contract

```text
Case
 ├─ SourceStudy
 │   ├─ DICOM identifiers / FrameOfReferenceUID
 │   ├─ modality / spacing / orientation
 │   └─ de-identification + usage terms
 ├─ Segmentation
 │   ├─ source representation: labelmap | surface | contours
 │   ├─ segment terminology + display color
 │   ├─ algorithm/model version + uncertainty
 │   └─ reviewer actions
 ├─ DesignIntent
 │   ├─ anatomy-specific required inputs
 │   ├─ landmarks / keep-outs / relief zones
 │   ├─ laterality / symmetry / registration
 │   └─ evidence level
 ├─ MeshRevision
 │   ├─ source segmentation hash
 │   ├─ topology and geometry checks
 │   └─ reviewer status
 └─ ManufacturingPlan
     ├─ material / process / orientation
     ├─ post-processing
     ├─ test plan
     └─ release decision
```

The current app implements this contract as an inspectable template-state model, not as a clinical pipeline. The next production slice would connect it to a real DICOMweb archive, an approved segmentation workflow, a mesh kernel, and a qualified manufacturing quality system.
