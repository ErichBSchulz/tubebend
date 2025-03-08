const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const sliders = [
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
// shortcut function
const e = document.getElementById.bind(document);
// shortcut to read value
const ev = (id) => +e(id).value;
// read degrees and convirt to radians
const toRadians = (degrees) => (degrees * Math.PI) / 180;
const toDegrees = (radians) => (radians / Math.PI) * 180;
const evd = (id) => toRadians(ev(id));
const scale =
  // { f: 1, xo: 0, yo: 0 };
  { f: 5, xo: -100, yo: -100 };
const urlParams = new URLSearchParams(window.location.search);

function init() {
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
  ["showLabels", "showHelp"].forEach((input) =>
    e(input).addEventListener("change", redraw),
  );

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
      showHelp: e("showHelp").checked,
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
  };
  state.bladeTip = translate({
    ...state.bladeCentre,
    angle: state.blade.endAngle,
    distance: state.blade.radius,
  });

  // how close is the blade to the upper incisors
  state.bladeUpperIncisorDistance =
    distanceBetween(state.blade, {
      x: state.upperIncisorX,
      y: state.upperIncisorY,
    }) -
    (state.blade.radius + params.bladeThickness);

  // Locate the tube, starting with the middle segment (arc2),
  // starting against the upper teeth at the specified angle
  // then deflecting off the blade to arc3
  // then bending by the same ammount at the teeth for arc1.
  const toothRotationCentre = {
    x: params.upperIncisorX - params.tubeOD / 2,
    y: params.upperIncisorY - params.tubeOD / 2,
  };

  state.inflection = translate({
    ...toothRotationCentre,
    angle: params.tubeAngle + Math.PI,
    distance: params.tubeRadius,
  });

  const angleToTooth2 = params.tubeAngle;
  state.tube2 = {
    ...state.inflection,
    startAngle: angleToTooth2,
    endAngle: angleToTooth2 + 1,
    radius: params.tubeRadius,
    thickness: params.tubeOD,
  };

  // track the total arc of tube drawn so far
  state.drawnTubeRadians = 0;
  state.bend = 0;

  // figure out where tube (secgment 2) collides with the balde
  const intersection = findIntersection(state.tube2, {
    ...state.blade,
    radius: state.blade.radius + (state.blade.thickness + params.tubeOD) / 2,
  });
  state.intersection = intersection;

  // in contact with the teeth, calculate tangental trajectory away from teeth
  if (
    intersection !== null &&
    intersection.x > state.bladeTip.x &&
    intersection.y > params.upperIncisorY
  ) {
    const tubeBladeAxisBearing = calculateBearing(intersection, state.blade);
    const tube2AxisBearing = calculateBearing(intersection, state.tube2);
    state.tube2.endAngle = tube2AxisBearing - Math.PI;

    const arc3Centre = translate({
      ...intersection,
      angle: tubeBladeAxisBearing,
      distance: params.tubeRadius,
    });

    state.tube3 = {
      ...arc3Centre,
      radius: params.tubeRadius,
      thickness: params.tubeOD,
    };

    const tangentBearing = tubeBladeAxisBearing + Math.PI;
    state.tube3.startAngle = tangentBearing;
    state.bend = tangentAngle(intersection, state.tube3, state.tube2);

    const deltaX = params.glotticPlaneX - state.tube3.x;
    const finalAngle = Math.acos(deltaX / state.tube3.radius);
    state.tube3.endAngle =
      finalAngle > state.tube3.startAngle ? finalAngle : state.tube3.startAngle;

    state.drawnTubeRadians += arcRadians(state.tube3);
    state.tubeTip = translate({
      ...arc3Centre,
      angle: state.tube3.endAngle,
      distance: params.tubeRadius,
    });
  } else {
    // no contact between blade and tube
    const deltaX = params.glotticPlaneX - state.tube2.x;
    const finalAngle = Math.acos(deltaX / state.tube2.radius);
    state.tube2.endAngle = finalAngle;
    state.tubeTip = translate({
      ...state.tube2,
      angle: finalAngle,
      distance: params.tubeRadius,
    });
  }

  state.drawnTubeRadians += arcRadians(state.tube2);

  const remainingRadians =
    params.tubeLength / params.tubeRadius - state.drawnTubeRadians;
  if (remainingRadians > 0) {
    const outerCentre = translate({
      ...toothRotationCentre,
      angle: params.tubeAngle + Math.PI + state.bend,
      distance: params.tubeRadius,
    });

    state.tube1 = {
      ...outerCentre,
      endAngle: params.tubeAngle + state.bend,
      radius: params.tubeRadius,
      thickness: params.tubeOD,
    };

    state.tube1.startAngle = state.tube1.endAngle - remainingRadians;
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
  ctx.geometry = state;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
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
  console.log("profile", JSON.stringify(profile));
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

  // console.log("state", state);

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
function midpoint(p1, p2) {
  return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
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

// scale point list
function scalePointList(points) {
  const out = [];
  points.map((point, index) => {
    out[index] = { ...point, ...quickScalePoint(point) };
  });
  return out;
}

function quickScalePoint(point) {
  return {
    x: (point.x + scale.xo) * scale.f,
    y: (point.y + scale.yo) * scale.f,
  };
}
// apply scale
function rescale(o_in) {
  const o = { ...o_in, ...quickScalePoint(o_in) };
  // console.log('Rescaling:', o_in.x,o_in.y, 'to', o.x, o.y);
  ["start", "end"].forEach((v) => {
    if (o[v]) {
      o[v] = rescale(o[v]);
    }
  });
  [
    "radius",
    "height",
    "thickness",
    "lineWidth",
    "fontsize",
    "offset",
    "length",
    "arrowWidth",
    "arrowLength",
  ].forEach((v) => {
    if (o[v]) {
      o[v] = o[v] * scale.f;
    }
  });
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
  const p = rescale({ lineWidth: 2, strokeStyle: "grey", ...params });
  //  console.log('tooth p after rescaling', p)
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
  console.log("params", JSON.stringify(params));

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

  // console.log("lowerSection", JSON.stringify(lowerSection));
  [lowerSection, upperSection].forEach((curve) => {
    drawCurve(curve);
  });
}
function drawCurve(points) {
  debug = urlParams.get("debugcurve");
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
