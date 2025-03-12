# Refactoring Plan for Tracheal Intubation Simulation

This plan outlines the steps to refactor the monolithic `main.js` file into a modular architecture, addressing several issues related to code structure, maintainability, and testability.

**1. Module Separation:**
   - **geometry.js:** Contains all functions related to geometry calculations (e.g., `calculateGeometry`, `translate`, `distanceBetween`, `findIntersection`).
   - **drawing.js:** Contains all functions related to drawing on the canvas (e.g., `draw`, `drawPatientProfile`, `drawArc`, `drawTooth`, `label`).
   - **event_handling.js:** Contains all functions related to event handling (e.g., `onMouseDown`, `onMouseUp`, `onMouseMove`, `onTouchStart`, `onTouchMove`, `onTouchEnd`, `closestObject`).
   - **ui.js:** Contains all functions related to UI elements and interactions (e.g., `init`, `updateValues`, `resetToDefaults`, `saveConfiguration`, `loadConfiguration`, `loadPreset`, `adjustSlider`, `showNotification`).
   - **utils.js:** Contains utility functions (e.g., `toRadians`, `toDegrees`, `rescale`, `scalePointList`, `quickScalePoint`, `midpoint`, `calculateBearing`, `arcRadians`).

**2. Dependency Management:**
   - Use import/export statements to manage dependencies between modules.

# Issues and Improvements for Tracheal Intubation Simulation

## Critical Issues

3. **Inconsistent variable naming**: Mixing camelCase and snake_case in JavaScript functions.
4. **Debug console logs**: Multiple `console.log` statements left in production code.
5. **Missing error handling**: No handling for edge cases in geometry calculations.

## Code Structure Issues

1. **Monolithic JavaScript file**: All functionality is in a single file with no modular organization.
2. **Mixed concerns**: UI code, geometry calculations, and drawing logic are intermingled.
3. **Global variables**: Excessive use of global scope for variables and functions.
4. **Long functions**: Several functions exceed reasonable length (e.g., `calculateGeometry`, `drawPatientProfile`).
5. **Duplicate event handling code**: Mouse and touch event handlers contain similar logic.
6. **Direct DOM manipulation**: Frequent direct DOM access instead of state management.

## UI/UX Issues

1. **Limited mobile support**: Basic touch events implemented but UI not fully responsive.
2. **No loading indicator**: No feedback during initial load or calculations.
3. **Hidden functionality**: Some interactive features not clearly indicated to users.
4. **Accessibility issues**: No keyboard navigation or ARIA attributes for screen readers.
5. **No reset button**: Users can't easily return to default settings.
6. **No save/load functionality**: Users can't save interesting configurations.

## Performance Issues

1. **Inefficient DOM queries**: Repeated calls to `document.getElementById`.
2. **Unnecessary redraws**: The entire canvas is redrawn on minor changes.
3. **Unoptimized calculations**: Some geometry calculations could be cached.
4. **Large canvas size**: Fixed 1500x1500 canvas size is excessive for most displays.

## Suggested Improvements

1. **Modular architecture**: Refactor into modules for:
   - Geometry calculations
   - Drawing utilities
   - Event handling
   - UI controls

2. **State management**: Implement proper state management instead of reading DOM values directly.

3. **Performance optimizations**:
   - Cache DOM elements
   - Use requestAnimationFrame for animations

5. **Accessibility**:
   - Add keyboard navigation
   - Include ARIA attributes
   - Improve color contrast

6. **Documentation**:
   - Add JSDoc comments
   - Create user documentation
   - Document the mathematical model

# Wont Fix

7. **Testing**:
   - Add unit tests for geometry calculations
   - Add integration tests for UI interactions
