# Refactoring Plan for Tracheal Intubation Simulation

This plan outlines the steps to refactor the monolithic `main.js` file into a modular architecture,
addressing several issues related to code structure, maintainability, and testability.

## Goals for final state:
**1. Module Separation:**
   - **utils.js:** Contains utility functions (e.g., `toRadians`, `toDegrees`, 
   `midpoint`, `calculateBearing`, `arcRadians`).

   - **geometry.js:** Contains all functions related to geometry calculations (e.g., `calculateGeometry`
`translate`, `distanceBetween`, `findIntersection`).
   - **drawing.js:** Contains all functions related to drawing on the canvas (e.g., `draw`,
   `rescale`, `scalePointList`, `quickScalePoint`, 
`drawPatientProfile`, `drawArc`, `drawTooth`, `label`, `closestObject`).
   - **event_handling.js:** Contains all functions related to event handling (e.g., `onMouseDown`,
`onMouseUp`, `onMouseMove`, `onTouchStart`, `onTouchMove`, `onTouchEnd`).
   - **ui.js:** Contains all functions related to UI elements and interactions (e.g., `init`,
`updateValues`, `resetToDefaults`, `saveConfiguration`, `loadConfiguration`, `loadPreset`, `adjustSlider
`showNotification`).
**2. Dependency Management:**
   - Use import/export statements to manage dependencies between modules.
   - Create a central state management system to share data between modules.

## Steps

Each small step should leave the code in a fully functional state.

## Detailed Steps

### Step 1: Extract utils.js
- Move all utility functions to new file
- Add export statements
- Update imports in main.js

### Step 3: Extract ui.js
- Move all UI-related functions
- Move slider configuration
- Move notification system
- Add export/import statements

### Step 5: Extract geometry.js
- Move geometry calculations
- Move coordinate transformation functions
- Add export/import statements

### Step 7: Extract drawing.js
- Move all drawing functions
- Move canvas setup
- Add export/import statements

### Step 9: Extract event_handling.js
- Move all event handlers
- Move touch/mouse event logic
- Add export/import statements

### Step 11: Create state management
- Create central state object
- Move shared variables to state
- Implement state update system

### Step 13: Update index.html
- Add type="module" to script tag
- Update script imports
- Verify module loading

### Step 15: Add module bundler (optional)
- Add Webpack or similar
- Configure for production
- Add build scripts

### Step 17: Add unit tests
- Add test framework (Jest)
- Create test files for each module
- Add CI integration

### Step 19: Add documentation
- Add JSDoc comments
- Create README.md for each module
- Add usage examples

### Step 20: Final testing
- Test all functionality
- Verify mobile support
- Check performance



