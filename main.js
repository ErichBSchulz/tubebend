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
      3000,
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

  e("resetButton").addEventListener("click", () => resetToDefaults(redraw));

  e("saveButton").addEventListener("click", () => saveConfiguration(redraw));

  e("loadButton").addEventListener("click", () => loadConfiguration(redraw));

  function toggleFullscreen() {
    const canvas = document.getElementById("canvas-wrapper");
    const heading = document.getElementById("heading");
    const controls = document.getElementById("tigsControls");
    const fullscreenButton = e("fullscreenButton");

    if (canvas.classList.contains("fullscreen")) {
      // Exit fullscreen
      heading.classList.remove("d-none");
      controls.classList.remove("d-none");
      canvas.classList.add("col-lg-8");
      canvas.classList.remove("fullscreen");
      fullscreenButton.innerHTML = '<i class="fas fa-expand"></i>';
      fullscreenButton.title = "Enter Fullscreen";
    } else {
      // Enter fullscreen
      heading.classList.add("d-none");
      controls.classList.add("d-none");
      canvas.classList.add("fullscreen");
      canvas.classList.remove("col-lg-8");
      fullscreenButton.innerHTML = '<i class="fas fa-compress"></i>';
      fullscreenButton.title = "Exit Fullscreen";
      // const size = Math.min(window.innerWidth, window.innerHeight);
      // canvas.style.width = `${size}px`;
      // canvas.style.height = `${size}px`;
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
  console.log("state", state);

  const canvasButtons = document.getElementById("canvas-buttons");
  const canvasWrapper = document.getElementById("canvas-wrapper");

  console.log(
    "window.innerWidth > window.innerHeight",
    window.innerWidth > window.innerHeight,
    window.innerWidth,
    window.innerHeight,
  );
  if (window.innerWidth > window.innerHeight) {
    canvasWrapper.height = "100vh";
    canvasWrapper.width = "";
  } else {
    canvasWrapper.width = "100vw";
    canvasWrapper.height = "";
  }

  if (canvasButtons && canvasWrapper) {
    if (window.innerWidth <= 768) {
      // Mobile layout - buttons above canvas
      canvasButtons.classList.remove("position-absolute", "top-0", "start-0");
      canvasButtons.classList.add(
        "d-flex",
        "flex-row",
        "flex-wrap",
        "gap-2",
        "mb-2",
      );
      canvasWrapper.insertBefore(canvasButtons, canvasWrapper.firstChild);
    } else {
      // Desktop layout - buttons overlay canvas
      canvasButtons.classList.remove(
        "d-flex",
        "flex-row",
        "flex-wrap",
        "gap-2",
        "mb-2",
      );
      canvasButtons.classList.add(
        "position-absolute",
        "top-0",
        "start-0",
        "m-2",
      );
      canvasWrapper.appendChild(canvasButtons);
    }
  }
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
