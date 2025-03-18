import {
  scalePointList,
  quickScalePoint,
  rescale,
  midpoint,
  translate,
} from "./utils.js";

export function draw(state, appearance, ctx) {
  ctx.geometry = state;
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); // Clear the canvas
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
  };
  drawPatientProfile(profile, ctx);

  // teeth
  const dentalDamage = state.bladeUpperIncisorDistance < 0;
  drawTooth(
    {
      x: state.upperIncisorX,
      y: state.upperIncisorY,
      height: 10,
      lineWidth: 1,
      strokeStyle: dentalDamage ? "red" : "grey",
    },
    ctx,
  );
  drawTooth(
    {
      x: state.lowerIncisorX,
      y: state.lowerIncisorY,
      height: -10,
      lineWidth: 1,
    },
    ctx,
  );
  // blade
  const blade = state.blade;
  drawArc({ ...blade, style: "metal" }, ctx);
  drawDot({ ...state.bladeTip, style: "gray" }, ctx);
  // handle
  const handleStart = translate({
    x: blade.x,
    y: blade.y,
    angle: blade.startAngle + 0.08,
    distance: blade.radius,
  });
  const handleEnd = translate({
    x: handleStart.x,
    y: handleStart.y,
    angle: Math.PI + blade.startAngle + 0.3,
    distance: blade.radius,
  });
  // drawDot(handleStart, ctx);
  // drawDot(handleEnd, ctx);
  drawBlade({ start: handleStart, end: handleEnd }, ctx);

  // glottis
  drawGlottis(state.glottis, ctx);
  // tube
  drawArc({ ...state.tube2, style: "tube" }, ctx);
  if (state.tube3) {
    drawArc({ ...state.tube3, style: "tube" }, ctx);
    drawDot({ ...state.intersection, style: "red" }, ctx);
  }
  if (state.tube1) {
    drawArc({ ...state.tube1, style: "tube" }, ctx);
  }
  // fiducial
  drawArc(state.fiducial, ctx);
  // labels
  if (appearance.showLabels) {
    label(
      {
        x: state.lowerIncisorX,
        y: state.lowerIncisorY,
        text: "Lower Incisor",
        alignment: "left",
      },
      ctx,
    );
    label(
      {
        x: state.upperIncisorX,
        y: state.upperIncisorY,
        text: (dentalDamage ? "Damaged " : "") + " Upper Incisor",
        alignment: "right",
      },
      ctx,
    );
    label(
      {
        x: state.bladeTip.x,
        y: state.bladeTip.y,
        text: "Blade",
        alignment: "above",
      },
      ctx,
    );
    label(
      {
        x: state.glottis.start.x,
        y: state.glottis.start.y,
        text: "Glottis",
        alignment: "left",
        offset: 5,
      },
      ctx,
    );
    label(
      {
        x: state.tubeTip.x,
        y: state.tubeTip.y,
        text: "Tube",
        alignment: "below",
      },
      ctx,
    );
  }

  if (appearance.showHelp) {
    drawArrow(
      {
        x: state.upperIncisorX + 70,
        y: state.upperIncisorY - 70,
        text: "Rotate tube",
        labelAllignment: "above",
        labelOffset: 10,
        orientation: "horizontal",
      },
      ctx,
    );
    drawArrow(
      {
        x: state.upperIncisorX - 70,
        y: state.upperIncisorY - 70,
        text: "Advance-withdraw blade",
        labelAllignment: "above",
        labelOffset: 25,
        orientation: "vertical",
      },
      ctx,
    );
    drawArrow(
      {
        x: state.upperIncisorX - 70,
        y: state.upperIncisorY - 70,
        text: "Rotate blade",
        labelAllignment: "left",
        labelOffset: 25,
        orientation: "horizontal",
      },
      ctx,
    );
    const bx = -20;
    drawArrow(
      {
        x: state.upperIncisorX + bx,
        y: state.upperIncisorY + 75,
        text: "Jaw thrust",
        labelAllignment: "below",
        labelOffset: 25,
        orientation: "vertical",
      },
      ctx,
    );
    drawArrow(
      {
        x: state.upperIncisorX + bx,
        y: state.upperIncisorY + 75,
        text: "Mouth opening",
        labelAllignment: "right",
        labelOffset: 25,
        orientation: "horizontal",
      },
      ctx,
    );
  }
}

export function label(p, ctx) {
  const { x, y, text, alignment, fontsize, color, offset } = rescale({
    alignment: "left",
    fontsize: 6,
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

export function drawDot(params, ctx) {
  const p = rescale({ style: "blue", radius: 2, ...params });
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.radius, 0, 2 * Math.PI);
  ctx.fillStyle = p.style;
  ctx.fill();
}

export function drawGlottis(params, ctx) {
  const p = rescale({ lineWidth: 4, ...params });
  const gradient = ctx.createLinearGradient(
    p.start.x,
    p.start.y,
    p.end.x,
    p.end.y,
  );
  gradient.addColorStop(0, "#ff8888");
  gradient.addColorStop(1, "#ff3333");
  ctx.beginPath();
  ctx.moveTo(p.start.x, p.start.y);
  ctx.lineTo(p.end.x, p.end.y);
  ctx.strokeStyle = gradient;
  ctx.lineWidth = p.lineWidth;
  ctx.stroke();
}

export function drawBlade(params, ctx) {
  const p = rescale({ lineWidth: 20, ...params });
  const gradient = ctx.createLinearGradient(
    p.start.x,
    p.start.y,
    p.end.x,
    p.end.y,
  );
  gradient.addColorStop(0, "#AAAAAA");
  gradient.addColorStop(1, "#888888");
  ctx.beginPath();
  ctx.moveTo(p.start.x, p.start.y);
  ctx.lineTo(p.end.x, p.end.y);
  ctx.strokeStyle = gradient;
  ctx.lineWidth = p.lineWidth;
  ctx.stroke();
}

export function drawTooth(params, ctx) {
  const p = rescale({ lineWidth: 2, strokeStyle: "grey", ...params });
  const width = p.height / 3;
  const gradient = ctx.createLinearGradient(p.x, p.y, p.x + p.height, p.y);
  gradient.addColorStop(0, "#fff");
  gradient.addColorStop(0.5, "#ddd");
  gradient.addColorStop(1, "#fff");

  ctx.fillStyle = gradient;
  ctx.strokeStyle = p.strokeStyle;
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  ctx.lineTo(p.x + p.height, p.y + width);
  ctx.lineTo(p.x + p.height, p.y - width);
  ctx.closePath();
  ctx.fill();
  ctx.lineWidth = p.lineWidth;
  ctx.stroke();
}

export function drawArrow(params, ctx) {
  const p = rescale({
    orientation: "horizontal",
    length: 20,
    shaftWidth: 25,
    arrowWidth: 15,
    arrowLength: 10,
    lineWidth: 1,
    strokeStyle: "#90EE90", // light green
    labelColor: "#90EE90", // light green
    ...params,
  });
  ctx.fillStyle = p.strokeStyle;
  ctx.strokeStyle = p.strokeStyle;
  ctx.lineWidth = p.lineWidth;
  const points = [
    { x: -p.length / 2, y: +p.shaftWidth / 2 },
    { x: +p.length / 2, y: +p.shaftWidth / 2 },
    { x: +p.length / 2, y: +p.arrowWidth / 2 },
    { x: +p.length / 2 + p.arrowLength, y: 0 },
    { x: +p.length / 2, y: -p.arrowWidth / 2 },
    { x: +p.length / 2, y: -p.shaftWidth / 2 },
    { x: -p.length / 2, y: -p.shaftWidth / 2 },
    { x: -p.length / 2, y: -p.arrowWidth / 2 },
    { x: -p.length / 2 - p.arrowLength, y: 0 },
    { x: -p.length / 2, y: +p.arrowWidth / 2 },
  ];
  if (p.orientation !== "horizontal") {
    points.forEach((point) => ([point.x, point.y] = [point.y, point.x]));
  }
  ctx.beginPath();
  ctx.moveTo(p.x + points[0].x, p.y + points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(p.x + points[i].x, p.y + points[i].y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  label(
    {
      ...params,
      color: p.labelColor,
      alignment: p.labelAllignment,
      offset: p.labelOffset,
    },
    ctx,
  );
}

export function drawArc(params, ctx) {
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
    p.style.addColorStop(0, "rgba(255, 255, 255, 0.5)");
    p.style.addColorStop(1, "rgba(0, 0, 255, 0.5)");
  } else if (p.style === "metal") {
    p.style = ctx.createRadialGradient(
      p.x,
      p.y,
      p.radius - p.thickness,
      p.x,
      p.y,
      p.radius + p.thickness,
    );
    p.style.addColorStop(0, "rgb(192, 192, 192)");
    p.style.addColorStop(1, "rgb(128, 128, 128)");
  }
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.radius, p.startAngle, p.endAngle);
  ctx.lineWidth = p.thickness;
  ctx.strokeStyle = p.style;
  ctx.stroke();
}

export function drawPatientProfile(params, ctx) {
  const { upperIncisor, lowerIncisor, thyroid, pronathism, bladeTip } = params;

  const upperSection = [];

  const subnasale = {
    name: "subnasale",
    x: upperIncisor.x + 30,
    y: upperIncisor.y - 18,
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
    x: subnasale.x + 19,
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
    x: lowerIncisor.x,
    y: lowerIncisor.y - 15,
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
    x: lowerLip.x - 5,
    y: lowerLip.y + 10,
  });
  lowerSection.push(lowerLip);
  const sublabiale = {
    name: "sublabiale",
    x: lowerLip.x - 5,
    y: lowerLip.y - 5,
  };
  lowerSection.push(sublabiale);
  const gnathio = {
    name: "gnathio",
    x: lowerIncisor.x - 40,
    y: lowerIncisor.y - 15 - pronathism * 0.1,
  };
  lowerSection.push({
    name: "dimple",
    x: gnathio.x + 19,
    y: gnathio.y + 6,
  });
  lowerSection.push(gnathio);
  lowerSection.push({
    name: "menton",
    x: gnathio.x - 10,
    y: gnathio.y + 10,
  });

  lowerSection.push({
    name: "bladeAvoidancePoint",
    x: bladeTip.x,
    y: bladeTip.y - 20,
  });

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
    drawCurve(curve, ctx);
  });
}

export function drawCurve(points, ctx) {
  const urlParams = new URLSearchParams(window.location.search);
  const debug = urlParams.get("debugcurve");
  const scaled = scalePointList(points);
  ctx.beginPath();
  ctx.moveTo(scaled[0].x, scaled[0].y);
  for (let i = 1; i < scaled.length - 1; i++) {
    const cp1 = scaled[i];
    const cp2 = midpoint(scaled[i], scaled[i + 1]);
    ctx.quadraticCurveTo(cp1.x, cp1.y, cp2.x, cp2.y);
  }
  ctx.strokeStyle = "rgba(139, 69, 19, 0.6)";
  ctx.lineWidth = 8;
  ctx.stroke();
  ctx.closePath();
  if (debug) {
    points.forEach((point, i) => {
      const curveLabel = {
        x: point.x,
        y: point.y,
        offset: 3,
        text: `${point.name} ${i}`,
        alignment: "left",
        color: "blue",
        fontsize: 3,
      };
      label(curveLabel, ctx);
      drawDot(point, ctx);
    });
  }
}
