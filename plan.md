# Refactoring Plan for Tracheal Intubation Simulation

The plan lays out the steps to clean up state management with the following goals:

- maintain and enhance a clean separation between the anatomic geometry model and the UI-related
- not add extra dependencies that will make tweaking the code by other amateur devs
- improve code readability and maintainability

## Steps

Each small step should leave the code in a fully functional state.

## Detailed Steps

### Step 2: Create a `state.js` module

1.  **Create `state.js`:** Create a new file named `state.js`.
2.  **Move State Variables:** Identify all variables in `main.js` that represent the application's state (e.g., `draggingObject`, `dragStart`, `scale`). Move these variables to `state.js`.
3.  **Encapsulate State:** Wrap these variables inside a `state` object within `state.js`.
4.  **Create Getters/Setters:** For each state variable, create getter and setter functions within `state.js`. For example:

    ```javascript
    // state.js
    let draggingObject = false;

    export function isDraggingObject() {
        return draggingObject;
    }

    export function setDraggingObject(value) {
        draggingObject = value;
    }
    ```
5.  **Import/Export:** Export these getter and setter functions from `state.js` and import them into `main.js`.
6.  **Refactor `main.js`:** Replace direct access to the state variables in `main.js` with calls to the getter and setter functions. For example, replace `draggingObject = true` with `setDraggingObject(true)`.

### Step 3: Decouple UI and Geometry Data

1.  **Identify UI-Related State:** In `ui.js`, identify state variables that are purely related to the UI (e.g., visibility of help, labels).
2.  **Move to `state.js`:** Move these UI-related state variables and their corresponding getter/setter functions to `state.js`.
3.  **Update References:** Update any references to these variables in `ui.js` to use the new getter/setter functions imported from `state.js`.
4.  **Modify `readParams`:** Update the `readParams` function in `ui.js` to only read UI parameters and not geometry parameters.

### Step 4: Centralize Geometry Data

1.  **Create `geometryData.js`:** Create a new file named `geometryData.js`.
2.  **Move Geometry Parameters:** Move the `defaultGeometry` and `presets` objects from `geometry.js` to `geometryData.js`.
3.  **Export Data:** Export `defaultGeometry` and `presets` from `geometryData.js`.
4.  **Import Data:** Import `defaultGeometry` and `presets` into `geometry.js`.
5.  **Update `resetToDefaults` and `loadPreset`:** Modify `resetToDefaults` in `ui.js` and `loadPreset` to use the imported `defaultGeometry` and `presets` from `geometryData.js`.

### Step 5: Decouple Event Handling

1.  **Create `events.js`:** Create a new file named `events.js`.
2.  **Move Event Handlers:** Move the functions `onMouseDown`, `onMouseUp`, `onMouseMove`, `onTouchStart`, `onTouchEnd`, and `onTouchMove` from `main.js` to `events.js`.
3.  **Import Functions:** Import necessary functions (e.g., `touchEventToMouseEvent`, `updateValues`, `redraw`) into `events.js`.
4.  **Export and Import:** Export the event handling functions from `events.js` and import them into `main.js`.
5.  **Update Event Listeners:** In `main.js`, update the event listeners to use the imported event handling functions.

### Step 6: Refactor `calculateGeometry`

1.  **Create `geometryHelpers.js`:** Create a new file named `geometryHelpers.js`.
2.  **Move Helper Functions:** Move the functions `findIntersection` and `tangentAngle` from `geometry.js` to `geometryHelpers.js`.
3.  **Import Functions:** Import necessary functions into `geometryHelpers.js`.
4.  **Export and Import:** Export the helper functions from `geometryHelpers.js` and import them into `geometry.js`.
5.  **Simplify `calculateGeometry`:** Refactor the `calculateGeometry` function in `geometry.js` to improve readability and maintainability.
