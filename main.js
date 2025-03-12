import { e, ev, evd, toRadians, toDegrees, midpoint, distanceBetween, calculateBearing, arcRadians, touchEventToMouseEvent, translate } from './utils.js';
import { readParams, updateValues, sliders, resetToDefaults, saveConfiguration, loadConfiguration, loadPreset, handleKeyDown, showNotification } from './ui.js';
import { calculateGeometry, findIntersection, tangentAngle } from './geometry.js';
import { draw } from './drawing.js';
import { onMouseDown, onMouseUp, onMouseMove, onTouchStart, onTouchEnd, onTouchMove } from './event_handling.js';

// Canvas setup and utility functions
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// Adjust canvas size for mobile devices
function adjustCanvasForMobile() {
  if (window.innerWidth <= 768) {
    canvas.width = window.innerWidth * 0.9;
    canvas.height = window.innerWidth * 0.9;
  }
}

// Call on page load and resize
adjustCanvasForMobile(); // Call on page load and resize
window.addEventListener("resize", function () {
  adjustCanvasForMobile();
  redraw();
});



// Canvas scaling parameters
const scale = { factor: 5, xOffset: -100, yOffset: -100 };

// URL parameters for configuration
const urlParams = new URLSearchParams(window.location.search);

// Interaction state
let draggingObject = false;
let dragStart = { x: 0, y: 0 };

/**
 * Initialize the application
 * Sets up event listeners and initial state
 */
function init() {
  // Apply layout based on URL parameters
  const layout = urlParams.get("layout");
  // No need for manual adjustments with Bootstrap
  // Bootstrap handles the layout with the grid system

  // Set up mouse event listeners
  canvas.addEventListener("mousedown", (e) => onMouseDown(e, ctx, redraw));
  canvas.addEventListener("mouseup", onMouseUp);
  canvas.addEventListener("mousemove", (e) => onMouseMove(e, redraw));

  // Set up touch event listeners for mobile support
  canvas.addEventListener("touchstart", (e) => onTouchStart(e, ctx, redraw), { passive: false });
  canvas.addEventListener("touchend", onTouchEnd, { passive: false });
  canvas.addEventListener("touchmove", (e) => onTouchMove(e, redraw), { passive: false });

  // Show mobile instructions if on a small screen
  if (window.innerWidth <= 768) {
    showNotification(
      "Tap and drag to interact with the simulation",
      "info",
      5000,
    );
  }

  // Set up slider event listeners
  sliders.forEach((slider) => e(slider).addEventListener("input", redraw));

  // Initialize toggle buttons
  const toggleButtons = ["showHelp", "showLabels"];
  toggleButtons.forEach(id => {
    const button = e(id);
    button.classList.add("active"); // Start enabled
    button.addEventListener("click", () => {
      button.classList.toggle("active");
      redraw();
    });
  });

  // Add button functionality
  const resetButton = e("resetButton");
  if (resetButton) {
    resetButton.addEventListener("click", resetToDefaults);
  }

  const saveButton = e("saveButton");
  if (saveButton) {
    saveButton.addEventListener("click", saveConfiguration);
  }

  const loadButton = e("loadButton");
  if (loadButton) {
    loadButton.addEventListener("click", loadConfiguration);
  }

  // Add preset button functionality
  const presetButtons = document.querySelectorAll(".preset-button");
  presetButtons.forEach((button) => {
    button.addEventListener("click", () => {
      loadPreset(button.dataset.preset);
    });
  });

  // Add keyboard navigation
  document.addEventListener("keydown", handleKeyDown);

  // Initial draw
  redraw();
}






function redraw() {
  updateValues();
  const { appearance, airwayParams } = readParams();
  const state = calculateGeometry(airwayParams);
  draw(state, appearance, ctx);
}

// cartesian translation

/**
 * Handle mouse up event
 * Stops the dragging operation
 */


// get the cordinates of the tip of an arc
function arcTip(params) {
  return translate({ ...params, angle: params.endAngle });
}






// Initialize the application
init();
