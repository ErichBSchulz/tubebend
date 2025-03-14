// utils.js
import { getScale } from "./state.js";
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
  const s = getScale();
  if (!s) {
    console.error("Scale not initialized!");
    return { x: 0, y: 0 };
  }
  return {
    x: Math.round((point.x + s.xOffset) * s.factor),
    y: Math.round((point.y + s.yOffset) * s.factor),
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
  const scale = getScale();
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
