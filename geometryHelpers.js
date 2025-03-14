// Helper functions for geometry calculations

// Import necessary utility functions
import { translate, calculateBearing } from "./utils.js";

export function findIntersection(circle1, circle2) {
  const { x: x1, y: y1, radius: r1 } = circle1;
  const { x: x2, y: y2, radius: r2 } = circle2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const d = Math.sqrt(dx * dx + dy * dy);
  if (d > r1 + r2 || d < Math.abs(r1 - r2)) {
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
  if (ys1 + xs1 > ys2 + xs2) {
    return { x: xs1, y: ys1 };
  } else {
    return { x: xs2, y: ys2 };
  }
}

export function tangentAngle(intersection, circle1, circle2) {
  const u = { x: circle1.x - intersection.x, y: circle1.y - intersection.y };
  const v = { x: circle2.x - intersection.x, y: circle2.y - intersection.y };
  const dotProduct = u.x * v.x + u.y * v.y;
  const magnitudeU = Math.sqrt(u.x * u.x + u.y * u.y);
  const magnitudeV = Math.sqrt(v.x * v.x + v.y * v.y);
  const cosTheta = dotProduct / (magnitudeU * magnitudeV);
  return Math.acos(cosTheta);
}
