let scale = { factor: 5, xOffset: -100, yOffset: -100 };

export function getScale() {
  return scale;
}

export function setScale(newScale) {
  scale = newScale;
}

let draggingObject = false;

export function isDraggingObject() {
  return draggingObject;
}

export function setDraggingObject(value) {
  draggingObject = value;
}
