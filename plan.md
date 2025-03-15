# Refactoring Plan for Tracheal Intubation Simulation

The page should have the following layout:
1. A title
2. Canvas the existing 4 buttons `tigsCanvas`
3. A slider and control panel to the right `tigsControls`
4. A block of text at the bottom. `tigsNotes`

When the full screen button is pushed only the canvas should be visible.

approach:

- strip out some of the custom css and rely on bootstrap conventions
- make minimal changes to the html

