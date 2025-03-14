import {
  translate,
  distanceBetween,
  calculateBearing,
  arcRadians,
} from "./utils.js";
import { defaultGeometry, presets } from "./geometryData.js";
import { findIntersection, tangentAngle } from "./geometryHelpers.js";

export function calculateGeometry(params) {
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
