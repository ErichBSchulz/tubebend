import { e, ev, evd, toRadians, toDegrees, midpoint, distanceBetween, calculateBearing, arcRadians, touchEventToMouseEvent, translate, scalePointList, quickScalePoint, rescale } from './utils.js';
import { readParams, updateValues, sliders } from './ui.js';
import { calculateGeometry, findIntersection, tangentAngle } from './geometry.js';

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
  canvas.addEventListener("mousedown", onMouseDown);
  canvas.addEventListener("mouseup", onMouseUp);
  canvas.addEventListener("mousemove", onMouseMove);

  // Set up touch event listeners for mobile support
  canvas.addEventListener("touchstart", onTouchStart, { passive: false });
  canvas.addEventListener("touchend", onTouchEnd, { passive: false });
  canvas.addEventListener("touchmove", onTouchMove, { passive: false });

  // Show mobile instructions if on a small screen
  if (window.innerWidth <= 768) {
    showNotification(
      "Tap and drag to interact with the simulation",
      "info",
      5000,
    );
  }

  // Set up slider and checkbox event listeners
  sliders.forEach((slider) => e(slider).addEventListener("input", redraw));
  ["showLabels", "showHelp"].forEach((input) =>
    e(input).addEventListener("change", redraw),
  );

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

function onTouchStart(event) {
  event.preventDefault();
  onMouseDown(touchEventToMouseEvent(event.touches[0]));
}

function onTouchMove(event) {
  event.preventDefault();
  if (!draggingObject) return;
  onMouseMove(touchEventToMouseEvent(event.touches[0]));
}

function onTouchEnd(event) {
  event.preventDefault();
  onMouseUp();
}




function draw(state, appearance) {
  ctx.geometry = state;
  ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
  const profile = {
    upperIncisor: {
      x: state.upperIncisorX,
      y: state.upperIncisorY,
    },
    lowerIncisor: {
      x: state.lowerIncisorX,
      y: state.lowerIncisorY,
    },
    thyroid: state.glottis.start,
    pronathism: 100,
    bladeTip: state.bladeTip,
    bladeRadius: state.blade.radius,
    bladeCentre: state.bladeCentre,
  };
  drawPatientProfile(profile);

  // save state to drawing context

  // teeth
  const dentalDamage = state.bladeUpperIncisorDistance < 0;
  drawTooth({
    x: state.upperIncisorX,
    y: state.upperIncisorY,
    height: 10,
    lineWidth: 1,
    strokeStyle: dentalDamage ? "red" : "grey",
  });
  drawTooth({
    x: state.lowerIncisorX,
    y: state.lowerIncisorY,
    height: -10,
    lineWidth: 1,
  });
  // blade
  drawArc({ ...state.blade, style: "metal" });

  drawDot({ ...state.bladeTip, style: "gray" });
  // glottis
  drawGlottis(state.glottis);
  // tube
  drawArc({ ...state.tube2, style: "tube" });
  if (state.tube3) {
    drawArc({ ...state.tube3, style: "tube" });
    drawDot({ ...state.intersection, style: "red" }); // TODO: make parametisable
  }
  if (state.tube1) {
    drawArc({ ...state.tube1, style: "tube" });
  }
  // fiducial
  drawArc(state.fiducial);
  // labels
  if (appearance.showLabels) {
    label({
      x: state.lowerIncisorX,
      y: state.lowerIncisorY,
      text: "Lower Incisor",
      alignment: "left",
    });
    label({
      x: state.upperIncisorX,
      y: state.upperIncisorY,
      text: (dentalDamage ? "Damaged " : "") + " Upper Incisor",
      alignment: "right",
    });
    label({
      x: state.bladeTip.x,
      y: state.bladeTip.y,
      text: "Blade",
      alignment: "above",
    });
    label({
      x: state.glottis.start.x,
      y: state.glottis.start.y,
      text: "Glottis",
      alignment: "left",
      offset: 5,
    });
    label({
      x: state.tubeTip.x,
      y: state.tubeTip.y,
      text: "Tube",
      alignment: "below",
    });
  }

  if (appearance.showHelp) {
    // draw left-right arrow labeled with 'rotate tube' at the upperincisor (+50, -50)
    drawArrow({
      x: state.upperIncisorX + 70,
      y: state.upperIncisorY - 70,
      text: "Rotate tube",
      labelAllignment: "above",
      labelOffset: 10,
      orientation: "horizontal",
    });
    drawArrow({
      x: state.upperIncisorX - 70,
      y: state.upperIncisorY - 70,
      text: "Advance-withdraw blade",
      labelAllignment: "above",
      labelOffset: 25,
      orientation: "vertical",
    });
    drawArrow({
      x: state.upperIncisorX - 70,
      y: state.upperIncisorY - 70,
      text: "Rotate blade",
      labelAllignment: "left",
      labelOffset: 25,
      orientation: "horizontal",
    });
    const bx = -20;
    drawArrow({
      x: state.upperIncisorX + bx,
      y: state.upperIncisorY + 75,
      text: "Jaw thrust",
      labelAllignment: "below",
      labelOffset: 25,
      orientation: "vertical",
    });
    drawArrow({
      x: state.upperIncisorX + bx,
      y: state.upperIncisorY + 75,
      text: "Mouth opening",
      labelAllignment: "right",
      labelOffset: 25,
      orientation: "horizontal",
    });
  }
}

function redraw() {
  updateValues();
  const { appearance, airwayParams } = readParams();
  const state = calculateGeometry(airwayParams);
  draw(state, appearance);
}

// cartesian translation

/**
 * Handle mouse up event
 * Stops the dragging operation
 */
function onMouseUp() {
  draggingObject = false;
}

/**
 * Convert mouse event coordinates to canvas coordinates
 * @param {HTMLCanvasElement} canvas - The canvas element
 * @param {MouseEvent} event - The mouse event
 * @returns {Object} The x,y coordinates in canvas space
 */
function getMousePos(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * (canvas.width / rect.width),
    y: (event.clientY - rect.top) * (canvas.height / rect.height),
  };
}

/**
 * Handle mouse down event
 * Starts dragging the closest interactive object
 * @param {MouseEvent} event - The mouse event
 */
function onMouseDown(event) {
  const p = getMousePos(canvas, event);
  const o = closestObject(p);
  if (o) {
    draggingObject = o;
    dragStart = p;
  }
}

function onMouseMove(event) {
  if (!draggingObject) return;
  const p = getMousePos(canvas, event);
  const dx = p.x - dragStart.x;
  const dy = p.y - dragStart.y;
  dragStart = p;

  switch (draggingObject) {
    case "lowerIncisor":
      e("lowerIncisorX").value = ev("lowerIncisorX") + dx / scale.factor;
      e("lowerIncisorY").value = ev("lowerIncisorY") + dy / scale.factor;
      break;
    case "tube":
      e("tubeAngle").value = ev("tubeAngle") + dx / (2 * scale.factor);
      break;
    case "blade":
      e("bladeAngle").value = ev("bladeAngle") + dx / scale.factor;
      e("bladeInsertion").value = ev("bladeInsertion") + dy / scale.factor;
      break;
    case "glottis":
      break;
    default: // 'left'
      break;
  }

  redraw();
}

// determine which type of drag mode we should do on the ui.
// This currently isn't optimal for users.
function closestObject(point) {
  // TODO store a tooth centre coord in global space
  const scaledLowerIncisor = rescale({
    x: ctx.geometry.lowerIncisorX,
    y: ctx.geometry.lowerIncisorY,
  });
  const scaledUpperIncisor = rescale({
    x: ctx.geometry.upperIncisorX,
    y: ctx.geometry.upperIncisorY,
  });
  // Check distance to interactive elements
  if (distanceBetween(point, scaledLowerIncisor) < 50) {
    return "lowerIncisor";
  } else if (point.y < scaledUpperIncisor.y) {
    if (point.x < (scaledLowerIncisor.x + scaledUpperIncisor.x) / 2) {
      return "blade";
    } else {
      return "tube";
    }
  } else {
    return "lowerIncisor";
  }
}


// get the cordinates of the tip of an arc
function arcTip(params) {
  return translate({ ...params, angle: params.endAngle });
}



function label(p) {
  const { x, y, text, alignment, fontsize, color, offset } = rescale({
    alignment: "left", // default alignment
    fontsize: 4,
    color: "darkgrey",
    offset: 15,
    ...p,
  });
  ctx.font = `${fontsize}px Arial`;
  ctx.fillStyle = color;
  let textX = x,
    textY = y;
  switch (alignment) {
    case "right":
      textX += offset;
      textY += fontsize / 2;
      break;
    case "above":
      textX -= ctx.measureText(text).width / 2;
      textY -= offset;
      break;
    case "below":
      textX -= ctx.measureText(text).width / 2;
      textY += offset + fontsize;
      break;
    default: // 'left'
      textX -= offset + ctx.measureText(text).width;
      textY += fontsize / 2;
      break;
  }
  ctx.fillText(text, textX, textY);
}

function drawDot(params) {
  const p = rescale({ style: "blue", radius: 2, ...params });
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.radius, 0, 2 * Math.PI);
  ctx.fillStyle = p.style; // Set the fill color to blue
  ctx.fill();
}

function drawGlottis(params) {
  const p = rescale({ lineWidth: 4, ...params });
  // Create a linear gradient for the glottis line
  const gradient = ctx.createLinearGradient(
    p.start.x,
    p.start.y,
    p.end.x,
    p.end.y,
  );
  gradient.addColorStop(0, "#ff8888"); // Light pink color at the start
  gradient.addColorStop(1, "#ff3333"); // Darker pink color at the end
  ctx.beginPath();
  ctx.moveTo(p.start.x, p.start.y);
  ctx.lineTo(p.end.x, p.end.y);
  ctx.strokeStyle = gradient; // Set the stroke color to the gradient
  ctx.lineWidth = p.lineWidth;
  ctx.stroke();
}

function drawTooth(params) {
  const p = rescale({ lineWidth: 2, strokeStyle: "grey", ...params });
  const width = p.height / 3;
  const gradient = ctx.createLinearGradient(p.x, p.y, p.x + p.height, p.y);
  gradient.addColorStop(0, "#fff"); // White color at the start
  gradient.addColorStop(0.5, "#ddd"); // Light grey in the middle
  gradient.addColorStop(1, "#fff"); // White color at the end

  ctx.fillStyle = gradient; // Set the fill color to the gradient
  ctx.strokeStyle = p.strokeStyle; // Set the color
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  ctx.lineTo(p.x + p.height, p.y + width);
  ctx.lineTo(p.x + p.height, p.y - width);
  ctx.closePath();
  ctx.fill();
  ctx.lineWidth = p.lineWidth; // Set the line width for the triangle
  ctx.stroke();
}

function drawArrow(params) {
  const p = rescale({
    orientation: "horizontal", // might be vertical
    length: 20, // arrow head point to point distance
    shaftWidth: 25,
    arrowWidth: 15, // width of the arrow tip
    arrowLength: 10, // width of the arrow head at its widest
    lineWidth: 1,
    strokeStyle: "darkgreen",
    labelColor: "darkgreen",
    ...params,
  });
  ctx.fillStyle = p.strokeStyle; // Set the fill color to the stroke style
  ctx.strokeStyle = p.strokeStyle; // Set the stroke color
  ctx.lineWidth = p.lineWidth; // Set the line width
  const points = [
    { x: -p.length / 2, y: +p.shaftWidth / 2 }, // right lower shaft
    { x: +p.length / 2, y: +p.shaftWidth / 2 }, // right lower shaft
    { x: +p.length / 2, y: +p.arrowWidth / 2 }, // lower right barb
    { x: +p.length / 2 + p.arrowLength, y: 0 }, // right tip
    { x: +p.length / 2, y: -p.arrowWidth / 2 }, // upper left
    { x: +p.length / 2, y: -p.shaftWidth / 2 }, // right upper shaft
    { x: -p.length / 2, y: -p.shaftWidth / 2 }, // L lower shaft
    { x: -p.length / 2, y: -p.arrowWidth / 2 }, // left lower barb
    { x: -p.length / 2 - p.arrowLength, y: 0 }, // left tip
    { x: -p.length / 2, y: +p.arrowWidth / 2 }, // left upper barb
  ];
  if (p.orientation !== "horizontal") {
    // swap orientation
    points.forEach((point) => ([point.x, point.y] = [point.y, point.x]));
  }
  // draw
  ctx.beginPath();
  ctx.moveTo(p.x + points[0].x, p.y + points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(p.x + points[i].x, p.y + points[i].y);
  }
  ctx.closePath();
  ctx.stroke();
  // ctx.fill();
  // Draw the label
  label({
    ...params,
    color: p.labelColor,
    alignment: p.labelAllignment,
    offset: p.labelOffset,
  });
}

function drawArc(params) {
  const p = rescale({ style: "blue", radius: 5, thickness: 4, ...params });
  if (p.style === "tube") {
    p.style = ctx.createRadialGradient(
      p.x,
      p.y,
      p.radius - p.thickness,
      p.x,
      p.y,
      p.radius + p.thickness,
    );
    p.style.addColorStop(0, "rgba(255, 255, 255, 0.5)"); // Inner color (transparent white)
    p.style.addColorStop(1, "rgba(0, 0, 255, 0.5)"); // Outer color (transparent blue)
  } else if (p.style === "metal") {
    p.style = ctx.createRadialGradient(
      p.x,
      p.y,
      p.radius - p.thickness,
      p.x,
      p.y,
      p.radius + p.thickness,
    );
    p.style.addColorStop(0, "rgb(192, 192, 192)"); // Inner color (light grey)
    p.style.addColorStop(1, "rgb(128, 128, 128)"); // Outer color (darker grey)
  }
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.radius, p.startAngle, p.endAngle);
  ctx.lineWidth = p.thickness;
  ctx.strokeStyle = p.style; // Set the color for the bounding box
  ctx.stroke();
}

/**
 * Draws the outline of the patient's profile for a medical intubation simulation.
 * The patient is lying down, viewed from the left side (x increases toward the head,
 * y increases posteriorly). The scale is 1 unit = 1 mm.
 * The upper section includes the nose, upper lip, hard palate, and uvula.
 * The lower section includes the lower lip, chin, undersurface of jaw, and anterior neck.
 *
 * @param {Object} upperIncisor - Coordinates of the upper incisor tip {x, y}.
 * @param {Object} lowerIncisor - Coordinates of the lower incisor tip {x, y}.
 * @param {Object} thyroid - Coordinates of the laryngeal prominence {x, y}.
 * @param {number} pronathism - Jaw shape, from -100 (micrognathic) to 100 (prognathic).
 * @param {Object} bladeTip - Coordinates of the laryngoscope blade tip {x, y}.
 * @param {number} bladeRadius - Radius of the blade arc in mm.
 * @param {Object} [bladeCentre] - Optional: Center of the blade arc {x, y}.
 */
function drawPatientProfile(params) {
  const {
    upperIncisor,
    lowerIncisor,
    thyroid,
    pronathism,
    bladeTip,
    bladeRadius,
    bladeCentre,
  } = params;

  // Clear previous drawings (optional, uncomment if needed)
  // ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // Begin a new path for drawing
  ctx.beginPath();

  // --- Upper Section: From nose to uvula ---
  const upperSection = [];

  const subnasale = {
    name: "subnasale",
    x: upperIncisor.x + 30,
    y: upperIncisor.y - 20,
  };

  upperSection.push({
    name: "forehead",
    x: subnasale.x + 100,
    y: subnasale.y - 20,
  });

  upperSection.push({
    name: "lower forhead",
    x: subnasale.x + 65,
    y: subnasale.y,
  });
  upperSection.push({
    name: "nasion",
    x: subnasale.x + 60,
    y: subnasale.y,
  });
  upperSection.push({
    name: "pronasale",
    x: subnasale.x + 15,
    y: subnasale.y - 30,
  });
  upperSection.push({
    name: "nasal tip",
    x: subnasale.x + 7,
    y: subnasale.y - 25,
  });

  upperSection.push(subnasale);
  upperSection.push({
    name: "top of top lip",
    x: subnasale.x - 1,
    y: subnasale.y - 1,
  });
  const upperLip = {
    name: "upperLip",
    x: upperIncisor.x + 5,
    y: upperIncisor.y - 20,
  };
  upperSection.push(upperLip);
  upperSection.push({
    name: "inner upperLip",
    x: upperLip.x - 5,
    y: upperLip.y + 16,
  });

  upperSection.push({
    name: "upperLip nasal reflection",
    x: upperIncisor.x + 30,
    y: upperIncisor.y - 6,
  });
  upperSection.push({
    name: "upperLip reflextion1",
    x: upperIncisor.x + 10,
    y: upperIncisor.y - 6,
  });
  upperSection.push({
    name: "upperLip reflextion2",
    x: upperIncisor.x + 10,
    y: upperIncisor.y + 4,
  });

  const hardPalate = {
    name: "hardPalate",
    x: upperIncisor.x + 0,
    y: upperIncisor.y + 70,
  };
  upperSection.push(hardPalate);

  const uvula = {
    name: "uvula",
    x: hardPalate.x - 20,
    y: hardPalate.y + 10,
  };
  upperSection.push(uvula);

  var lowerSection = [];
  const lowerLip = {
    name: "lowerLip",
    x: lowerIncisor.x + 5,
    y: lowerIncisor.y - 24,
  };
  const sublabiale = {
    name: "lowerLip",
    x: lowerIncisor.x + 5,
    y: lowerIncisor.y - 24,
  };
  lowerSection.push({
    name: "lowerLip reflextion2",
    x: lowerIncisor.x - 10,
    y: lowerIncisor.y + 4,
  });
  lowerSection.push({
    name: "lowerLip reflextion1",
    x: lowerIncisor.x - 10,
    y: lowerIncisor.y - 6,
  });
  lowerSection.push({
    name: "lowerLip nasal reflection",
    x: lowerIncisor.x - 30,
    y: lowerIncisor.y - 6,
  });
  lowerSection.push({
    name: "inner lowerLip",
    x: lowerLip.x,
    y: lowerLip.y + 16,
  });
  lowerSection.push(lowerLip);
  lowerSection.push({
    name: "bottom of bottom lip",
    x: sublabiale.x + 1,
    y: sublabiale.y - 1,
  });
  lowerSection.push(sublabiale);
  // Estimate chin (below lower lip, adjusted by pronathism)
  const gnathio = {
    name: "gnathio",
    x: lowerIncisor.x - 40,
    y: lowerIncisor.y - 20 - pronathism * 0.1, // Protrudes more for prognathic
  };
  lowerSection.push(gnathio);
  lowerSection.push({
    name: "menton",
    x: gnathio.x - 10,
    y: gnathio.y + 10,
  });

  // Add lowerIncisor
  //  lowerSection.push({ ...lowerIncisor, name: "lowerIncisor" });

  // Estimate bladeCentre if not provided
  const effectiveBladeCentre = bladeCentre || {
    x: bladeTip.x,
    y: bladeTip.y - bladeRadius, // Assume blade is anterior (negative y direction)
  };

  // Add control points to curve around the blade and undersurface of jaw
  // Avoid the area between lowerIncisor and bladeTip
  lowerSection.push({
    name: "bladeAvoidancePoint",
    x: bladeTip.x,
    y: bladeTip.y - 20,
  });

  // End at thyroid
  lowerSection.push({ x: thyroid.x, y: thyroid.y - 10, name: "thyroid" });

  lowerSection.push({
    name: "subthyroid",
    x: thyroid.x - 10,
    y: thyroid.y - 4,
  });
  lowerSection.push({
    name: "anteriorNeck",
    x: thyroid.x - 50,
    y: thyroid.y - 4,
  });

  [lowerSection, upperSection].forEach((curve) => {
    drawCurve(curve);
  });
}
function drawCurve(points) {
  const debug = urlParams.get("debugcurve");
  const scaled = scalePointList(points);
  ctx.moveTo(scaled[0].x, scaled[0].y);
  for (let i = 1; i < scaled.length - 1; i++) {
    const cp1 = scaled[i];
    const cp2 = midpoint(scaled[i], scaled[i + 1]);
    ctx.quadraticCurveTo(cp1.x, cp1.y, cp2.x, cp2.y);
  }
  ctx.strokeStyle = "rgba(139, 69, 19, 0.6)"; // Darker brown with some transparency
  ctx.lineWidth = 8; // Customize as needed
  ctx.stroke();
  if (debug) {
    points.forEach((point, i) => {
      const curveLabel = {
        x: point.x,
        y: point.y,
        offset: 3,
        text: `${point.name} ${i}`,
        alignment: "left",
        color: "blue",
      };
      label(curveLabel);
      drawDot(point);
    });
  }
}


/**
 * Reset all controls to their default values
 */
function resetToDefaults() {
  // Default values for all sliders
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

  // Reset each slider to its default value
  Object.entries(defaults).forEach(([id, value]) => {
    const slider = e(id);
    if (slider) {
      slider.value = value;
    }
  });

  // Reset checkboxes
  e("showLabels").checked = true;
  e("showHelp").checked = true;

  // Update the UI and redraw
  updateValues();
  redraw();
}

/**
 * Save the current configuration to localStorage
 */
function saveConfiguration() {
  const config = {};

  // Save all slider values
  sliders.forEach((slider) => {
    config[slider] = e(slider).value;
  });

  // Save checkbox states
  config.showLabels = e("showLabels").checked;
  config.showHelp = e("showHelp").checked;

  // Save to localStorage
  localStorage.setItem("intubationConfig", JSON.stringify(config));

  // Show confirmation
  showNotification("Configuration saved successfully!");
}

/**
 * Load configuration from localStorage
 */
function loadConfiguration() {
  const savedConfig = localStorage.getItem("intubationConfig");

  if (!savedConfig) {
    showNotification("No saved configuration found.", "error");
    return;
  }

  const config = JSON.parse(savedConfig);

  // Apply slider values
  sliders.forEach((slider) => {
    if (config[slider] !== undefined) {
      e(slider).value = config[slider];
    }
  });

  // Apply checkbox states
  if (config.showLabels !== undefined) {
    e("showLabels").checked = config.showLabels;
  }

  if (config.showHelp !== undefined) {
    e("showHelp").checked = config.showHelp;
  }

  // Update UI and redraw
  updateValues();
  redraw();
}

/**
 * Load a preset configuration
 * @param {string} presetName - The name of the preset to load
 */
function loadPreset(presetName) {
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

  // Show which preset was loaded
  showNotification(
    `Loaded preset: ${presetName.charAt(0).toUpperCase() + presetName.slice(1)}`,
    "info",
  );

  // Apply preset values
  Object.entries(preset).forEach(([id, value]) => {
    const slider = e(id);
    if (slider) {
      slider.value = value;
    }
  });

  // Update UI and redraw
  updateValues();
  redraw();
}

/**
 * Handle keyboard navigation
 * @param {KeyboardEvent} event - The keyboard event
 */
function handleKeyDown(event) {
  const key = event.key;
  const activeElement = document.activeElement;

  // Only handle keyboard navigation when not in an input field
  if (activeElement.tagName === "INPUT" || activeElement.tagName === "BUTTON") {
    return;
  }

  switch (key) {
    case "ArrowUp":
      // Increase tube angle
      adjustSlider("tubeAngle", 1);
      event.preventDefault();
      break;
    case "ArrowDown":
      // Decrease tube angle
      adjustSlider("tubeAngle", -1);
      event.preventDefault();
      break;
    case "ArrowLeft":
      // Decrease blade insertion
      adjustSlider("bladeInsertion", -1);
      event.preventDefault();
      break;
    case "ArrowRight":
      // Increase blade insertion
      adjustSlider("bladeInsertion", 1);
      event.preventDefault();
      break;
    case "r":
      // Reset to defaults
      resetToDefaults();
      event.preventDefault();
      break;
    case "s":
      // Save configuration
      if (event.ctrlKey) {
        saveConfiguration();
        event.preventDefault();
      }
      break;
    case "l":
      // Load configuration
      if (event.ctrlKey) {
        loadConfiguration();
        event.preventDefault();
      }
      break;
    case "1":
    case "2":
    case "3":
    case "4":
      // Load presets 1-3
      const presetIndex = parseInt(key) - 1;
      const presetNames = ["normal", "difficult", "optimal"];
      if (presetIndex >= 0 && presetIndex < presetNames.length) {
        loadPreset(presetNames[presetIndex]);
      }
      event.preventDefault();
      break;
  }
}

/**
 * Adjust a slider by a given amount
 * @param {string} sliderId - The ID of the slider to adjust
 * @param {number} amount - The amount to adjust by
 */
function adjustSlider(sliderId, amount) {
  const slider = e(sliderId);
  if (!slider) return;

  const step = parseFloat(slider.step) || 1;
  const newValue = parseFloat(slider.value) + amount * step;

  // Ensure the new value is within the slider's min and max
  const min = parseFloat(slider.min);
  const max = parseFloat(slider.max);
  slider.value = Math.min(max, Math.max(min, newValue));

  // Update UI and redraw
  updateValues();
  redraw();
}

/**
 * Show a notification message
 * @param {string} message - The message to display
 * @param {string} [type='success'] - The type of notification (success, error, info)
 * @param {number} [duration=3000] - How long to show the notification in ms
 */
function showNotification(message, type = "success", duration = 3000) {
  const notification = document.getElementById("notification");
  if (!notification) return;

  // Clear any existing classes
  notification.className =
    "position-fixed top-0 end-0 m-3 p-3 rounded shadow-lg z-3 text-white";

  // Add Bootstrap background class based on type
  if (type === "error") {
    notification.classList.add("bg-danger");
  } else if (type === "info") {
    notification.classList.add("bg-info");
  } else {
    notification.classList.add("bg-success");
  }

  notification.textContent = message;
  notification.style.display = "block";

  // Make notification more visible on mobile
  if (window.innerWidth <= 768) {
    notification.classList.add(
      "w-75",
      "start-50",
      "translate-middle-x",
      "text-center",
    );
  }

  // Hide after duration
  setTimeout(() => {
    notification.style.display = "none";
  }, duration);
}

// Initialize the application
init();
