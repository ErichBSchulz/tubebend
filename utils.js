// DOM utility functions
export const e = document.getElementById.bind(document);
export const ev = (id) => +e(id).value;
export const evd = (id) => toRadians(ev(id));

// Angle conversion
export const toRadians = (degrees) => (degrees * Math.PI) / 180;
export const toDegrees = (radians) => (radians / Math.PI) * 180;

// Event conversion
export const touchEventToMouseEvent = (touch) => ({
  clientX: touch.clientX,
  clientY: touch.clientY,
});

// Canvas scaling parameters
let scale = { factor: 5, xOffset: -100, yOffset: -100 };

export function setScale(newScale) {
  scale = newScale;
}

// Cartesian geometry functions
export function translate({ x, y, angle, distance }) {
  return {
    x: x + Math.cos(angle) * distance,
    y: y + Math.sin(angle) * distance,
  };
}

export function midpoint(p1, p2) {
  return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
}

export function distanceBetween(p1, p2) {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function calculateBearing(p1, p2) {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.atan2(-dy, -dx);
}

export function arcRadians(arc) {
  let r = (arc.endAngle - arc.startAngle) % (2 * Math.PI);
  if (r < 0) {
    r += 2 * Math.PI;
  }
  return r;
}


export function quickScalePoint(point) {
  return {
    x: (point.x + scale.xOffset) * scale.factor,
    y: (point.y + scale.yOffset) * scale.factor,
  };
}

export function scalePointList(points) {
  const out = [];
  points.map((point, index) => {
    out[index] = { ...point, ...quickScalePoint(point) };
  });
  return out;
}

export function rescale(oIn) {
  const o = { ...quickScalePoint(oIn) };
  const oOut = { ...oIn, ...o };
  ["start", "end"].forEach((v) => {
    if (oOut[v]) {
      oOut[v] = rescale(oOut[v]);
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
    if (oOut[v]) {
      oOut[v] = oOut[v] * scale.factor;
    }
  });
  return oOut;
}
