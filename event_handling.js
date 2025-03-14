import { e, ev, touchEventToMouseEvent } from "./utils.js";
import { updateValues } from "./ui.js";
import { rescale, distanceBetween } from "./utils.js";
import {
  isDraggingObject,
  setDraggingObject,
  getDragStart,
  setDragStart,
} from "./state.js";

export function onTouchStart(event, ctx, redraw) {
  event.preventDefault();
  onMouseDown(touchEventToMouseEvent(event.touches[0]), ctx, redraw);
}

export function onTouchMove(event, redraw) {
  event.preventDefault();
  if (!draggingObject) return;
  onMouseMove(touchEventToMouseEvent(event.touches[0]), redraw);
}

export function onTouchEnd(event) {
  event.preventDefault();
  onMouseUp();
}

export function onMouseUp() {
  setDraggingObject(false);
}

export function getMousePos(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * (canvas.width / rect.width),
    y: (event.clientY - rect.top) * (canvas.height / rect.height),
  };
}

export function onMouseDown(event, ctx, redraw) {
  const p = getMousePos(canvas, event);
  const o = closestObject(p, ctx);
  if (o) {
    setDraggingObject(o);
    setDragStart(p);
  }
}

export function onMouseMove(event, redraw) {
  if (!isDraggingObject()) return;
  const p = getMousePos(canvas, event);
  const dragStart = getDragStart();
  const dx = p.x - dragStart.x;
  const dy = p.y - dragStart.y;
  setDragStart(p);

  switch (isDraggingObject()) {
    case "lowerIncisor":
      e("lowerIncisorX").value = ev("lowerIncisorX") + dx / 5;
      e("lowerIncisorY").value = ev("lowerIncisorY") + dy / 5;
      break;
    case "tube":
      e("tubeAngle").value = ev("tubeAngle") + dx / 10;
      break;
    case "blade":
      e("bladeAngle").value = ev("bladeAngle") + dx / 5;
      e("bladeInsertion").value = ev("bladeInsertion") + dy / 5;
      break;
    case "glottis":
      break;
    default:
      break;
  }

  updateValues();
  redraw();
}

export function closestObject(point, ctx) {
  const scaledLowerIncisor = rescale({
    x: ctx.geometry.lowerIncisorX,
    y: ctx.geometry.lowerIncisorY,
  });
  const scaledUpperIncisor = rescale({
    x: ctx.geometry.upperIncisorX,
    y: ctx.geometry.upperIncisorY,
  });

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
