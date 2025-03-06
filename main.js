const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const sliders = [
  "tubeAngle",
  "tubeRadius",
  "glotticPlaneX",
  "tubeLength",
  "bladeLength",
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
// shortcut function
const e = document.getElementById.bind(document);
// shortcut to read value
const ev = (id) => +e(id).value;
// read degrees and convirt to radians
const toRadians = (degrees) => (degrees * Math.PI) / 180;
const toDegrees = (radians) => (radians / Math.PI) * 180;
const evd = (id) => toRadians(ev(id));
const scale = { f: 5, xo: -100, yo: -100 };

function init() {
  const urlParams = new URLSearchParams(window.location.search);
  const layout = urlParams.get("layout");

  if (layout === "twocol") {
    document.querySelector(".left-column").style.width = "50%";
    document.querySelector(".right-column").style.width = "50%";
    document.querySelector("#canvas").style.width = "100%";
    document.querySelector("#canvas").style.height = "auto";
  }
  canvas.addEventListener("mousedown", onMouseDown);
  canvas.addEventListener("mouseup", onMouseUp);
  canvas.addEventListener("mousemove", onMouseMove);
  // Add touch event listeners for mobile support
  canvas.addEventListener("touchstart", onTouchStart, { passive: false });
  canvas.addEventListener("touchend", onTouchEnd, { passive: false });
  canvas.addEventListener("touchmove", onTouchMove, { passive: false });

  sliders.forEach((slider) => e(slider).addEventListener("input", redraw));
  e("showLabels").addEventListener("change", redraw);
  redraw();
}

function onTouchStart(event) {
  event.preventDefault();
  onMouseDown(event.touches[0]);
}

function onTouchMove(event) {
  event.preventDefault();
  onMouseMove(event.touches[0]);
}

function onTouchEnd(event) {
  event.preventDefault();
  onMouseUp(event.changedTouches[0]);
}

function readParams() {
  return {
    appearance: {
      showLabels: e("showLabels").checked,
    },
    airwayParams: {
      upperIncisorX: 300,
      upperIncisorY: 200,
      lowerIncisorX: ev("lowerIncisorX"),
      lowerIncisorY: ev("lowerIncisorY"),
      bladeLength: ev("bladeLength"),
      bladeInsertion: ev("bladeInsertion"),
      bladeRadius: ev("bladeRadius"),
      bladeAngle: evd("bladeAngle"),
      tubeLength: ev("tubeLength"),
      tubeRadius: ev("tubeRadius"),
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

function calculateGeometry(params) {
  const state = {};

  // start with the teeth:
  state.upperIncisorX = params.upperIncisorX;
  state.upperIncisorY = params.upperIncisorY;
  state.lowerIncisorX = params.upperIncisorX + params.lowerIncisorX;

  state.lowerIncisorY = params.upperIncisorY + params.lowerIncisorY;
  // place blade against lower incisors
  const bladeRadians =
    Math.asin(params.bladeLength / (params.bladeRadius * 2)) * 2;
  state.bladeCentre = translate({
    x: state.lowerIncisorX,
    y: state.lowerIncisorY,
    angle: params.bladeAngle + Math.PI,
    distance: params.bladeRadius,
  });
  state.blade = {
    ...state.bladeCentre,
    startAngle:
      params.bladeAngle - bladeRadians * (1 - params.bladeInsertion / 100),
    endAngle: params.bladeAngle + bladeRadians * (params.bladeInsertion / 100),
    radius: params.bladeRadius,
    thickness: 3,
    style: "metal", // TODO move to draw
  };
  state.bladeTip = translate({
    ...state.bladeCentre,
    angle: state.blade.endAngle,
    distance: state.blade.radius,
  });

  // Locate the tube, starting with the middle segment (arc2),
  // starting against the upper teeth at the specified angle
  // then deflecting off the blade to arc3
  // then bending by the same ammount at the teeth for arc1.
  const toothRotationCentre = {
    x: params.upperIncisorX - 10 / 2,
    y: params.upperIncisorY - 10 / 2,
  };

  state.inflection = translate({
    ...toothRotationCentre,
    angle: params.tubeAngle,
    distance: params.tubeRadius,
  });

  const angleToTooth2 = params.tubeAngle + Math.PI;
  state.arcParams2 = {
    ...state.inflection,
    startAngle: angleToTooth2,
    endAngle: angleToTooth2 + 1,
    style: "tube", //TODO move to draw
    radius: params.tubeRadius,
    thickness: 10,
  };

  // track the total arc of tube drawn so far
  state.drawnTubeRadians = 0;
  state.bend = 0;

  // figure out where tube (secgment 2) collides with the balde
  const intersection = findIntersection(state.arcParams2, {
    ...state.blade,
    radius: state.blade.radius + (state.blade.thickness + 10) / 2,
  });

  // in contact with the teeth, calculate tangental trajectory away from teeth
  if (
    intersection !== null &&
    intersection.x > state.bladeTip.x &&
    intersection.y > params.upperIncisorY
  ) {
    const tubeBladeAxisBearing = calculateBearing(intersection, state.blade);
    const tube2AxisBearing = calculateBearing(intersection, state.arcParams2);
    state.arcParams2.endAngle = tube2AxisBearing - Math.PI;

    const arc3Centre = translate({
      ...intersection,
      angle: tubeBladeAxisBearing,
      distance: params.tubeRadius,
    });

    state.arcParams3 = {
      ...arc3Centre,
      style: "tube", //TODO move to draw
      radius: params.tubeRadius,
      thickness: 10,
    };

    const tangentBearing = tubeBladeAxisBearing + Math.PI;
    state.arcParams3.startAngle = tangentBearing;
    state.bend = tangentAngle(intersection, state.arcParams3, state.arcParams2);

    const deltaX = params.glotticPlaneX - state.arcParams3.x;
    const finalAngle = Math.acos(deltaX / state.arcParams3.radius);
    state.arcParams3.endAngle =
      finalAngle > state.arcParams3.startAngle
        ? finalAngle
        : state.arcParams3.startAngle;

    state.drawnTubeRadians += arcRadians(state.arcParams3);
    state.tubeTip = translate({
      ...arc3Centre,
      angle: state.arcParams3.endAngle,
      distance: params.tubeRadius,
    });
  } else {
    // no contact between blade and tube
    const deltaX = params.glotticPlaneX - state.arcParams2.x;
    const finalAngle = Math.acos(deltaX / state.arcParams2.radius);
    state.arcParams2.endAngle = finalAngle;
    state.tubeTip = translate({
      ...state.arcParams2,
      angle: finalAngle,
      distance: params.tubeRadius,
    });
  }

  state.drawnTubeRadians += arcRadians(state.arcParams2);

  const remainingRadians =
    params.tubeLength / params.tubeRadius - state.drawnTubeRadians;
  if (remainingRadians > 0) {
    const outerCentre = translate({
      ...toothRotationCentre,
      angle: params.tubeAngle + state.bend,
      distance: params.tubeRadius,
    });

    state.arcParams1 = {
      ...outerCentre,
      endAngle: params.tubeAngle + state.bend + Math.PI,
      style: "tube",
      radius: params.tubeRadius,
      thickness: 10,
    };

    state.arcParams1.startAngle = state.arcParams1.endAngle - remainingRadians;
  }

  state.glottis = {
    start: { x: params.glotticPlaneX, y: state.bladeTip.y - 10 },
    end: { x: params.glotticPlaneX, y: state.bladeTip.y + 10 },
  };

  state.fiducial = {
    // rename all these to be prefixed by `fiducial`
    startAngle: params.fiducialStartAngle,
    endAngle: params.fiducialEndAngle,
    thickness: params.fiducialThickness,
    x: params.fiducialX,
    y: params.fiducialY,
    radius: 5,
    style: "pink",
  };

  return state;
}

function draw(state, appearance) {
  // save state to drawing context
  ctx.geometry = state;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // teeth
  drawTooth({
    x: state.upperIncisorX,
    y: state.upperIncisorY,
    height: 10,
    lineWidth: 1,
  });
  drawTooth({
    x: state.lowerIncisorX,
    y: state.lowerIncisorY,
    height: -10,
    lineWidth: 1,
  });
  // blade
  drawArc(state.blade);
  drawDot({ ...state.bladeTip, style: "gray" });
  // glottis
  drawGlottis(state.glottis);
  // tube
  drawArc(state.arcParams2);
  if (state.arcParams3) {
    drawArc(state.arcParams3);
    drawDot({ ...state.intersection, style: "red" });
  }
  if (state.arcParams1) {
    drawArc(state.arcParams1);
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
      text: "Upper Incisor",
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
}

function redraw() {
  updateValues();
  const { appearance, airwayParams } = readParams();
  const state = calculateGeometry(airwayParams);
  draw(state, appearance);
}

// cartesian translation
function arcRadians(arc) {
  var r = (arc.endAngle - arc.startAngle) % (2 * Math.PI);
  if (r < 0) {
    r += 2 * Math.PI;
  }
  return r;
}

let draggingObject = false;
let dragStart = { x: 0, y: 0 };

function onMouseUp() {
  if (draggingObject) {
    //  console.log('Stopped dragging');
  }
  draggingObject = false;
}

function getMousePos(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * (canvas.width / rect.width),
    y: (event.clientY - rect.top) * (canvas.height / rect.height),
  };
}

function onMouseDown(event) {
  const p = getMousePos(canvas, event);
  //console.log('Mouse down at:', x, y);
  const o = closestObject(p);
  if (o) {
    draggingObject = o;
    dragStart = p;
    //console.log('Started dragging');
  }
}

function onMouseMove(event) {
  if (!draggingObject) return;
  const p = getMousePos(canvas, event);
  const dx = p.x - dragStart.x;
  const dy = p.y - dragStart.y;
  dragStart = p;

  switch (draggingObject) {
    case "LI":
      e("lowerIncisorX").value = ev("lowerIncisorX") + dx / scale.f;
      e("lowerIncisorY").value = ev("lowerIncisorY") + dy / scale.f;
      break;
    case "tube":
      e("tubeAngle").value = ev("tubeAngle") + dx / (2 * scale.f);
      break;
    case "blade":
      e("bladeAngle").value = ev("bladeAngle") + dx / scale.f;
      e("bladeInsertion").value = ev("bladeInsertion") + dy / scale.f;
      break;
    case "glottis":
      break;
    default: // 'left'
      break;
  }

  redraw();
}

function closestObject(point) {
  // TODO store a tooth centre coord in global space
  const lowerIncisor = rescale({
    x: ctx.geometry.lowerIncisorX,
    y: ctx.geometry.lowerIncisorY,
  });
  const upperIncisor = rescale({
    x: ctx.geometry.upperIncisorX,
    y: ctx.geometry.upperIncisorY,
  });
  console.log("ctx.geometry", ctx.geometry);
  // console.log('Distance to lower incisor:', distance);
  if (distanceBetween(point, lowerIncisor) < 50) {
    return "LI";
  } else if (point.y < upperIncisor.y) {
    if (point.x < (lowerIncisor.x + upperIncisor.x) / 2) {
      return "blade";
    } else {
      return "tube";
    }
  } else {
    return "LI";
  }
  return distanceBetween(point, lowerIncisor) < 50 ? "LI" : false; // Adjust the threshold as needed
}
// cartesian translation
function translate({ x, y, angle, distance }) {
  return {
    x: x + Math.cos(angle) * distance,
    y: y + Math.sin(angle) * distance,
  };
}

// given two points calcuate angle and distance between them
function distanceBetween(p1, p2) {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance;
}

// given two points calcuate angle and distance between them
function calculateBearing(p1, p2) {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const angle = Math.atan2(-dy, -dx);
  return angle;
}

// get the cordinates of the tip of an arc
function arcTip(params) {
  return translate({ ...params, angle: params.endAngle });
}

// Calculate the intersection of two circles and
// returns the one with the highest Y value (and highest X value if there's a tie).
function findIntersection(circle1, circle2) {
  const { x: x1, y: y1, radius: r1 } = circle1;
  const { x: x2, y: y2, radius: r2 } = circle2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const d = Math.sqrt(dx * dx + dy * dy);
  if (d > r1 + r2 || d < Math.abs(r1 - r2)) {
    // No intersection
    return null;
  }
  const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
  const h = Math.sqrt(r1 * r1 - a * a);
  const xm = x1 + (dx * a) / d;
  const ym = y1 + (dy * a) / d;
  const xs1 = xm + (h * dy) / d;
  const ys1 = ym - (h * dx) / d;
  const xs2 = xm - (h * dy) / d;
  const ys2 = ym + (h * dx) / d;
  // if (ys1 > ys2 || (ys1 === ys2 && xs1 > xs2)) {
  if (ys1 + xs1 > ys2 + xs2) {
    return { x: xs1, y: ys1 };
  } else {
    return { x: xs2, y: ys2 };
  }
}

// given two circles, what is the angle between their tangents
function tangentAngle(intersection, circle1, circle2) {
  // Convert points to vectors
  const u = { x: circle1.x - intersection.x, y: circle1.y - intersection.y };
  const v = { x: circle2.x - intersection.x, y: circle2.y - intersection.y };
  // Dot product of u and v
  const dotProduct = u.x * v.x + u.y * v.y;
  // Magnitudes of u and v
  const magnitudeU = Math.sqrt(u.x * u.x + u.y * u.y);
  const magnitudeV = Math.sqrt(v.x * v.x + v.y * v.y);
  // Cosine of the angle between u and v
  const cosTheta = dotProduct / (magnitudeU * magnitudeV);
  // Angle in radians
  const theta = Math.acos(cosTheta);
  // Intersection angle (angle between tangents)
  return (intersectionAngle = theta);
}

// apply scale
function rescale(o_in) {
  const o = { ...o_in };
  o.x = (o.x + scale.xo) * scale.f;
  o.y = (o.y + scale.yo) * scale.f;
  // console.log('Rescaling:', o_in.x,o_in.y, 'to', o.x, o.y);
  ["start", "end"].forEach((v) => {
    if (o[v]) {
      o[v] = rescale(o[v]);
    }
  });
  ["radius", "height", "thickness", "lineWidth", "fontsize", "offset"].forEach(
    (v) => {
      if (o[v]) {
        o[v] = o[v] * scale.f;
      }
    },
  );
  return o;
}

function label(p) {
  const { x, y, text, alignment, fontsize, color, offset } = rescale({
    alignment: "left",
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
  // console.log('tooth pre scale', params)
  const p = rescale({ lineWidth: 2, ...params });
  //  console.log('tooth p after rescaling', p)
  const width = p.height / 3;
  const gradient = ctx.createLinearGradient(p.x, p.y, p.x + p.height, p.y);
  gradient.addColorStop(0, "#fff"); // White color at the start
  gradient.addColorStop(0.5, "#ddd"); // Light grey in the middle
  gradient.addColorStop(1, "#fff"); // White color at the end

  ctx.fillStyle = gradient; // Set the fill color to the gradient
  ctx.strokeStyle = "grey"; // Set the color
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  ctx.lineTo(p.x + p.height, p.y + width);
  ctx.lineTo(p.x + p.height, p.y - width);
  ctx.closePath();
  ctx.fill();
  ctx.lineWidth = p.lineWidth; // Set the line width for the triangle
  ctx.stroke();
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
    p.style.addColorStop(0, "rgba(192, 192, 192, 0.5)"); // Inner color (light grey)
    p.style.addColorStop(1, "rgba(128, 128, 128, 0.5)"); // Outer color (darker grey)
  }
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.radius, p.startAngle, p.endAngle);
  ctx.lineWidth = p.thickness;
  ctx.strokeStyle = p.style; // Set the color for the bounding box
  ctx.stroke();
}

function updateValues() {
  sliders.forEach((slider) => {
    const value = e(slider).value;
    if (slider === "tubeAngle") {
      e(`${slider}Value`).textContent = parseFloat(value).toFixed(1);
    } else {
      e(`${slider}Value`).textContent = value;
    }
  });
}

init();
