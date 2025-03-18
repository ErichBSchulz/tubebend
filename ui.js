import { e, ev, evd } from "./utils.js";
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
import {
  setShowHelp,
  setShowLabels,
  getShowHelp,
  getShowLabels,
} from "./state.js";
import { defaultGeometry, presets } from "./geometryData.js";

export const sliderConfig = {
  tubeAngle: { isDegrees: true },
  tubeRadius: { isDegrees: false },
  tubeOD: { isDegrees: false },
  glotticPlaneX: { isDegrees: false },
  tubeLength: { isDegrees: false },
  bladeLength: { isDegrees: false },
  bladeThickness: { isDegrees: false },
  bladeInsertion: { isDegrees: false },
  bladeRadius: { isDegrees: false },
  bladeAngle: { isDegrees: true },
  lowerIncisorX: { isDegrees: false },
  lowerIncisorY: { isDegrees: false },
  fiducialStartAngle: { isDegrees: true },
  fiducialEndAngle: { isDegrees: true },
  fiducialThickness: { isDegrees: false },
  fiducialX: { isDegrees: false },
  fiducialY: { isDegrees: false },
};

export const sliders = Object.keys(sliderConfig);

export function readParams() {
  const airwayParams = {
    upperIncisorX: 300,
    upperIncisorY: 200,
  };

  // Populate slider values
  for (const [param, config] of Object.entries(sliderConfig)) {
    airwayParams[param] = config.isDegrees ? evd(param) : ev(param);
  }

  return {
    appearance: {
      showLabels: getShowLabels(),
      showHelp: getShowHelp(),
    },
    airwayParams,
  };
}

export function updateValues() {
  sliders.forEach((slider) => {
    const value = e(slider).value;
    if (slider === "tubeAngle") {
      e(`${slider}Value`).textContent = parseFloat(value).toFixed(1);
    } else {
      e(`${slider}Value`).textContent = value;
    }
  });
}

export function resetToDefaults(redraw) {
  Object.entries(defaultGeometry).forEach(([id, value]) => {
    const slider = e(id);
    if (slider) {
      slider.value = value;
    }
  });

  updateValues();
  if (redraw) redraw();
}

export function saveConfiguration(redraw) {
  const config = {};

  sliders.forEach((slider) => {
    config[slider] = e(slider).value;
  });

  config.showLabels = getShowLabels();
  config.showHelp = getShowHelp();

  localStorage.setItem("intubationConfig", JSON.stringify(config));

  showNotification("Configuration saved successfully!");
  if (redraw) redraw();
}

export function loadConfiguration(redraw) {
  const savedConfig = localStorage.getItem("intubationConfig");

  if (!savedConfig) {
    showNotification("No saved configuration found.", "error");
    return;
  }

  const config = JSON.parse(savedConfig);

  sliders.forEach((slider) => {
    if (config[slider] !== undefined) {
      e(slider).value = config[slider];
    }
  });

  setShowLabels(config.showLabels);
  setShowHelp(config.showHelp);
  e("showLabels").classList.toggle("active", config.showLabels);
  e("showHelp").classList.toggle("active", config.showHelp);

  updateValues();
  if (redraw) redraw();
}

export function loadPreset(presetName, redraw) {
  const preset = presets[presetName];

  if (!preset) {
    showNotification("Preset not found!", "error");
    return;
  }

  const combined = { ...defaultGeometry, ...preset };

  showNotification(
    `Loaded preset: ${presetName.charAt(0).toUpperCase() + presetName.slice(1)}`,
    "info",
  );

  Object.entries(combined).forEach(([id, value]) => {
    const slider = e(id);
    if (slider) {
      slider.value = value;
    }
  });

  updateValues();
  if (redraw) redraw();
}

export function adjustSlider(sliderId, amount, redraw) {
  const slider = e(sliderId);
  if (!slider) return;

  const step = parseFloat(slider.step) || 1;
  const newValue = parseFloat(slider.value) + amount * step;

  const min = parseFloat(slider.min);
  const max = parseFloat(slider.max);
  slider.value = Math.min(max, Math.max(min, newValue));

  updateValues();
  if (redraw) redraw();
}

export function handleKeyDown(event, redraw) {
  const key = event.key;
  const activeElement = document.activeElement;

  if (activeElement.tagName === "INPUT" || activeElement.tagName === "BUTTON") {
    return;
  }

  switch (key) {
    case "ArrowUp":
      adjustSlider("tubeAngle", 1);
      event.preventDefault();
      break;
    case "ArrowDown":
      adjustSlider("tubeAngle", -1);
      event.preventDefault();
      break;
    case "ArrowLeft":
      adjustSlider("bladeInsertion", -1);
      event.preventDefault();
      break;
    case "ArrowRight":
      adjustSlider("bladeInsertion", 1);
      event.preventDefault();
      break;
    case "r":
      resetToDefaults();
      event.preventDefault();
      break;
    case "s":
      if (event.ctrlKey) {
        saveConfiguration();
        event.preventDefault();
      }
      break;
    case "l":
      if (event.ctrlKey) {
        loadConfiguration();
        event.preventDefault();
      }
      break;
    case "1":
    case "2":
    case "3":
    case "4":
      const presetIndex = parseInt(key) - 1;
      const presetNames = ["normal", "difficult", "optimal"];
      if (presetIndex >= 0 && presetIndex < presetNames.length) {
        loadPreset(presetNames[presetIndex], redraw);
      }
      event.preventDefault();
      break;
  }
}

export function showNotification(message, type = "success", duration = 3000) {
  const notification = document.getElementById("notification");
  if (!notification) return;

  notification.className =
    "position-fixed top-0 end-0 m-3 p-3 rounded shadow-lg z-3 text-white";

  if (type === "error") {
    notification.classList.add("bg-danger");
  } else if (type === "info") {
    notification.classList.add("bg-info");
  } else {
    notification.classList.add("bg-success");
  }

  notification.textContent = message;
  notification.style.display = "block";

  if (window.innerWidth <= 768) {
    notification.classList.add(
      "w-75",
      "start-50",
      "translate-middle-x",
      "text-center",
    );
  }

  setTimeout(() => {
    notification.style.display = "none";
  }, duration);
}

// Canvas setup and utility functions
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// Call on page load and resize
window.addEventListener("resize", function () {
  redraw();
});

const urlParams = new URLSearchParams(window.location.search);
const debug = urlParams.get("debug");
if (debug) {
  log("debubbing");
}

export function init() {
  // Apply layout based on URL parameters
  // No need for manual adjustments with Bootstrap
  // Bootstrap handles the layout with the grid system

  // Call on page load and resize
  window.addEventListener("resize", function () {
    redraw();
  });
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

export function redraw() {
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

export function log(message, object) {
  if (debug !== null && debug !== "") {
    const debugDiv = document.getElementById("debug");
    if (debugDiv) {
      let output = `${message}<br>`;
      if (object) {
        output += `${JSON.stringify(object, null, 2)}<br>`;
      }
      debugDiv.innerHTML = output + debugDiv.innerHTML;
    }
  }
}
