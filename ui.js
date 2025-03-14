import { e, ev, evd } from "./utils.js";
import {
  getShowLabels,
  getShowHelp,
  setShowHelp,
  setShowLabels,
} from "./state.js";
import { defaultGeometry, presets } from "./geometryData.js";

export const sliders = [
  "tubeAngle",
  "tubeRadius",
  "tubeOD",
  "glotticPlaneX",
  "tubeLength",
  "bladeLength",
  "bladeThickness",
  "bladeInsertion",
  "bladeRadius",
  "bladeAngle",
  "lowerIncisorX",
  "lowerIncisorY",
  "fiducialStartAngle",
  "fiducialEndAngle",
  "fiducialThickness",
  "fiducialX",
  "fiducialY",
];

export function readParams() {
  return {
    appearance: {
      showLabels: getShowLabels(),
      showHelp: getShowHelp(),
    },
    airwayParams: {
      upperIncisorX: 300,
      upperIncisorY: 200,
      lowerIncisorX: ev("lowerIncisorX"),
      lowerIncisorY: ev("lowerIncisorY"),
      bladeLength: ev("bladeLength"),
      bladeThickness: ev("bladeThickness"),
      bladeInsertion: ev("bladeInsertion"),
      bladeRadius: ev("bladeRadius"),
      bladeAngle: evd("bladeAngle"),
      tubeLength: ev("tubeLength"),
      tubeRadius: ev("tubeRadius"),
      tubeOD: ev("tubeOD"),
      tubeAngle: evd("tubeAngle"),
      glotticPlaneX: ev("glotticPlaneX"),
      fiducialStartAngle: evd("fiducialStartAngle"),
      fiducialEndAngle: evd("fiducialEndAngle"),
      fiducialThickness: ev("fiducialThickness"),
      fiducialX: ev("fiducialX"),
      fiducialY: ev("fiducialY"),
    },
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

  setShowLabels(true);
  setShowHelp(true);
  e("showLabels").classList.add("active");
  e("showHelp").classList.add("active");

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
