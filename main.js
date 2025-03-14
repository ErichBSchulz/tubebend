import { e, translate } from "./utils.js";
import {
  readParams,
  updateValues,
  sliders,
  resetToDefaults,
  saveConfiguration,
  loadConfiguration,
  loadPreset,
  handleKeyDown,
  showNotification,
} from "./ui.js";
import { setShowHelp, setShowLabels } from "./state.js";
import { calculateGeometry } from "./geometry.js";
import { draw } from "./drawing.js";
import {
  onMouseDown,
  onMouseUp,
  onMouseMove,
  onTouchStart,
  onTouchEnd,
  onTouchMove,
} from "./event_handling.js";
import { setScale } from "./state.js";

// Canvas setup and utility functions
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// Call on page load and resize
window.addEventListener("resize", function () {
  redraw();
});

// Canvas scaling parameters
const scale = { factor: 5, xOffset: -100, yOffset: -100 };
setScale(scale);

// URL parameters for configuration
const urlParams = new URLSearchParams(window.location.search);

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
  canvas.addEventListener("touchstart", (e) => onTouchStart(e, ctx, redraw), {
    passive: false,
  });
  canvas.addEventListener("touchend", onTouchEnd, { passive: false });
  canvas.addEventListener("touchmove", (e) => onTouchMove(e, redraw), {
    passive: false,
  });

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

  // Fullscreen button functionality
  const fullscreenButton = e("fullscreenButton");
  fullscreenButton.addEventListener("click", toggleFullscreen);

  // Initialize toggle buttons
  const toggleButtons = ["showHelp", "showLabels"];
  toggleButtons.forEach((id) => {
    const button = e(id);
    button.classList.add("active"); // Start enabled
    button.addEventListener("click", () => {
      button.classList.toggle("active");
      const isActive = button.classList.contains("active");
      if (id === "showHelp") {
        setShowHelp(isActive);
      } else if (id === "showLabels") {
        setShowLabels(isActive);
      }
      redraw();
    });
  });

  const resetButton = e("resetButton");
  if (resetButton) {
    resetButton.addEventListener("click", () => resetToDefaults(redraw));
  }

  const saveButton = e("saveButton");
  if (saveButton) {
    saveButton.addEventListener("click", () => saveConfiguration(redraw));
  }

  const loadButton = e("loadButton");
  if (loadButton) {
    loadButton.addEventListener("click", () => loadConfiguration(redraw));
  }

  function toggleFullscreen() {
    const canvasWrapper = document.getElementById("canvas-wrapper");
    const fullscreenButton = e("fullscreenButton");

    if (canvasWrapper.classList.contains("fullscreen")) {
      // Exit fullscreen
      canvasWrapper.classList.remove("fullscreen");
      fullscreenButton.innerHTML = '<i class="fas fa-expand"></i>';
      fullscreenButton.title = "Enter Fullscreen";
    } else {
      // Enter fullscreen
      canvasWrapper.classList.add("fullscreen");
      fullscreenButton.innerHTML = '<i class="fas fa-compress"></i>';
      fullscreenButton.title = "Exit Fullscreen";
    }
    redraw();
  }

  // Add preset button functionality
  const presetButtons = document.querySelectorAll(".preset-button");
  presetButtons.forEach((button) => {
    button.addEventListener("click", () => {
      loadPreset(button.dataset.preset, redraw);
    });
  });

  // Add keyboard navigation
  document.addEventListener("keydown", (e) => handleKeyDown(e, redraw));

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
