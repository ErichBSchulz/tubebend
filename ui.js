import { e, ev, evd } from './utils.js';

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
      showLabels: e("showLabels").classList.contains("active"),
      showHelp: e("showHelp").classList.contains("active"),
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

export function resetToDefaults() {
  const defaults = {
    tubeAngle: 26,
    tubeRadius: 150,
    tubeOD: 10,
    glotticPlaneX: 165,
    tubeLength: 280,
    bladeLength: 140,
    bladeThickness: 15,
    bladeInsertion: 72,
    bladeRadius: 118,
    bladeAngle: 18,
    lowerIncisorX: -25,
    lowerIncisorY: 0,
    fiducialStartAngle: 0,
    fiducialEndAngle: 360,
    fiducialThickness: 1,
    fiducialX: 0,
    fiducialY: 0,
  };

  Object.entries(defaults).forEach(([id, value]) => {
    const slider = e(id);
    if (slider) {
      slider.value = value;
    }
  });

  e("showLabels").checked = true;
  e("showHelp").checked = true;

  updateValues();
  redraw();
}

export function saveConfiguration() {
  const config = {};

  sliders.forEach((slider) => {
    config[slider] = e(slider).value;
  });

  config.showLabels = e("showLabels").checked;
  config.showHelp = e("showHelp").checked;

  localStorage.setItem("intubationConfig", JSON.stringify(config));

  showNotification("Configuration saved successfully!");
}

export function loadConfiguration() {
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

  if (config.showLabels !== undefined) {
    e("showLabels").checked = config.showLabels;
  }

  if (config.showHelp !== undefined) {
    e("showHelp").checked = config.showHelp;
  }

  updateValues();
  redraw();
}

export function loadPreset(presetName) {
  const presets = {
    normal: {
      tubeAngle: 26,
      tubeRadius: 150,
      tubeOD: 10,
      glotticPlaneX: 165,
      tubeLength: 280,
      bladeLength: 140,
      bladeThickness: 15,
      bladeInsertion: 72,
      bladeRadius: 118,
      bladeAngle: 18,
      lowerIncisorX: -25,
      lowerIncisorY: 0,
    },
    difficult: {
      tubeAngle: 35,
      tubeRadius: 150,
      tubeOD: 10,
      glotticPlaneX: 200,
      tubeLength: 280,
      bladeLength: 140,
      bladeThickness: 15,
      bladeInsertion: 65,
      bladeRadius: 118,
      bladeAngle: 25,
      lowerIncisorX: -15,
      lowerIncisorY: 10,
    },
    pediatric: {
      tubeAngle: 20,
      tubeRadius: 120,
      tubeOD: 6,
      glotticPlaneX: 130,
      tubeLength: 220,
      bladeLength: 100,
      bladeThickness: 10,
      bladeInsertion: 80,
      bladeRadius: 90,
      bladeAngle: 15,
      lowerIncisorX: -20,
      lowerIncisorY: 0,
    },
    optimal: {
      tubeAngle: 15,
      tubeRadius: 150,
      tubeOD: 10,
      glotticPlaneX: 165,
      tubeLength: 280,
      bladeLength: 140,
      bladeThickness: 15,
      bladeInsertion: 85,
      bladeRadius: 118,
      bladeAngle: 10,
      lowerIncisorX: -40,
      lowerIncisorY: -5,
    },
  };

  const preset = presets[presetName];

  if (!preset) {
    showNotification("Preset not found!", "error");
    return;
  }

  showNotification(
    `Loaded preset: ${presetName.charAt(0).toUpperCase() + presetName.slice(1)}`,
    "info",
  );

  Object.entries(preset).forEach(([id, value]) => {
    const slider = e(id);
    if (slider) {
      slider.value = value;
    }
  });

  updateValues();
  redraw();
}

export function adjustSlider(sliderId, amount) {
  const slider = e(sliderId);
  if (!slider) return;

  const step = parseFloat(slider.step) || 1;
  const newValue = parseFloat(slider.value) + amount * step;

  const min = parseFloat(slider.min);
  const max = parseFloat(slider.max);
  slider.value = Math.min(max, Math.max(min, newValue));

  updateValues();
  redraw();
}

export function handleKeyDown(event) {
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
        loadPreset(presetNames[presetIndex]);
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
