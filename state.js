let scale = { factor: 5, xOffset: -100, yOffset: -100 };

export function getScale() {
  return scale;
}

export function setScale(newScale) {
  scale = newScale;
}

let interactionState = {
  draggingObject: false,
  dragStart: { x: 0, y: 0 },
};

export function isDraggingObject() {
  return interactionState.draggingObject;
}

export function setDraggingObject(value) {
  interactionState.draggingObject = value;
}

export function getDragStart() {
  return interactionState.dragStart;
}

export function setDragStart(value) {
  interactionState.dragStart = value;
}
