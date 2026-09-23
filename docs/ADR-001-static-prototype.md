# ADR-001: Dependency-light static workstation for the first release

**Status:** Accepted  
**Date:** 2026-09-23  
**Deciders:** pro-esthetic prototype

## Context

The first delivery needs to communicate a Blender-like prosthetic design workflow and make the high-value interactions observable: browse a starting geometry, adjust dimensions, inspect an orbitable model, run starter checks, and export a mesh. The workspace is empty and no clinical data pipeline or geometry kernel has been provided.

## Decision

Build the first release as a static HTML/CSS/JavaScript application with a small Node HTTP server for local preview. Use a 2D canvas renderer for the illustrative viewport and emit simple ASCII STL/OBJ starter meshes. Keep the UI and exported assets visibly labeled as non-clinical prototypes.

## Options considered

### Three.js or another 3D runtime

**Pros:** real 3D camera and mesh operations; easier path to richer rendering.  
**Cons:** introduces runtime/dependency/version concerns before the interaction model is validated; a renderer does not supply medical image segmentation or manufacturing validation.

### Blender add-on

**Pros:** native modeling tools, established mesh operators, and a direct `.blend` workflow.  
**Cons:** requires Blender installation and a more involved distribution path; the product brief describes a program with Blender-like settings, not necessarily a Blender plug-in.

### Static canvas prototype (chosen)

**Pros:** portable, fast to inspect, no install step beyond Node, easy to replace with a geometry kernel later.  
**Cons:** viewport geometry is illustrative and exports are intentionally simple; not suitable for patient-ready output.

## Consequences

- The product vocabulary and interaction model can be reviewed before committing to a geometry kernel.
- The next production slice should replace the illustrative mesh with a real B-rep/mesh pipeline, add robust import/segmentation provenance, and introduce manufacturing validation.
- The reference notebook can evolve into a reviewed, versioned design library without hiding provenance in the UI.
