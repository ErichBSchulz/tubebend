# Refactoring Plan for Tracheal Intubation Simulation

This plan outlines the steps to refactor the monolithic `main.js` file into a modular architecture, addressing several issues related to code structure, maintainability, and testability.

## Goals for final state:
**1. Module Separation:**
   - **geometry.js:** Contains all functions related to geometry calculations (e.g., `calculateGeometry`, `translate`, `distanceBetween`, `findIntersection`).
   - **drawing.js:** Contains all functions related to drawing on the canvas (e.g., `draw`, `drawPatientProfile`, `drawArc`, `drawTooth`, `label`, `closestObject`).
   - **event_handling.js:** Contains all functions related to event handling (e.g., `onMouseDown`, `onMouseUp`, `onMouseMove`, `onTouchStart`, `onTouchMove`, `onTouchEnd`).
   - **ui.js:** Contains all functions related to UI elements and interactions (e.g., `init`, `updateValues`, `resetToDefaults`, `saveConfiguration`, `loadConfiguration`, `loadPreset`, `adjustSlider`, `showNotification`).
   - **utils.js:** Contains utility functions (e.g., `toRadians`, `toDegrees`, `rescale`, `scalePointList`, `quickScalePoint`, `midpoint`, `calculateBearing`, `arcRadians`).

**2. Dependency Management:**
   - Use import/export statements to manage dependencies between modules.

## steps

Each small step should leave the code in a fully functional state.

1. extract a new utils.js
2. allowe user to test code still work
3. extract ui.js
4. allowe user to test code still work
