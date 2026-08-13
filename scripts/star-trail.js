/* Ambient wandering star. A white difference-blend trail temporarily inverts
   the pixels beneath it, then restores the page as each segment expires. */
(function () {
  "use strict";

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (reducedMotion.matches) return;

  var sourceScript = document.currentScript;
  var starUrl = sourceScript
    ? new URL("../assets/effects/star.png", sourceScript.src).href
    : "/assets/effects/star.png";

  var canvas = document.createElement("canvas");
  canvas.className = "star-trail";
  canvas.setAttribute("aria-hidden", "true");

  var star = new Image();
  star.className = "wandering-star";
  star.alt = "";
  star.decoding = "async";
  star.src = starUrl;
  star.setAttribute("aria-hidden", "true");

  document.body.appendChild(canvas);
  document.body.appendChild(star);

  var context = canvas.getContext("2d");
  if (!context) {
    canvas.remove();
    star.remove();
    return;
  }

  var TRAIL_LIFETIME = 1600;
  var TRAIL_WIDTH = 24;
  var ARC_SAMPLES = 120;
  var viewportWidth = 0;
  var viewportHeight = 0;
  var points = [];
  var path = null;
  var crossingStartedAt = 0;
  var crossingDuration = 0;
  var active = false;
  var frameRequest = 0;
  var nextCrossing = 0;
  var lastPointAt = 0;

  function randomBetween(minimum, maximum) {
    return minimum + Math.random() * (maximum - minimum);
  }

  function resize() {
    viewportWidth = window.innerWidth;
    viewportHeight = window.innerHeight;
    var density = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(viewportWidth * density);
    canvas.height = Math.round(viewportHeight * density);
    context.setTransform(density, 0, 0, density, 0, 0);
  }

  function pointOnEdge(edge, padding) {
    if (edge === 0) return { x: randomBetween(0, viewportWidth), y: -padding, outwardX: 0, outwardY: -1 };
    if (edge === 1) return { x: viewportWidth + padding, y: randomBetween(0, viewportHeight), outwardX: 1, outwardY: 0 };
    if (edge === 2) return { x: randomBetween(0, viewportWidth), y: viewportHeight + padding, outwardX: 0, outwardY: 1 };
    return { x: -padding, y: randomBetween(0, viewportHeight), outwardX: -1, outwardY: 0 };
  }

  function createPath() {
    var startEdge = Math.floor(Math.random() * 4);
    var endEdge = (startEdge + 1 + Math.floor(Math.random() * 3)) % 4;
    var padding = 96;

    var start = pointOnEdge(startEdge, padding);
    var end = pointOnEdge(endEdge, padding);
    var deltaX = end.x - start.x;
    var deltaY = end.y - start.y;
    var distance = Math.hypot(deltaX, deltaY);
    var tangentLength = distance * 0.35;
    var bend = randomBetween(-distance * 0.18, distance * 0.18);
    var perpendicularX = -deltaY / distance;
    var perpendicularY = deltaX / distance;
    var createdPath = {
      start: start,
      controlOne: {
        x: start.x - start.outwardX * tangentLength + perpendicularX * bend,
        y: start.y - start.outwardY * tangentLength + perpendicularY * bend
      },
      controlTwo: {
        x: end.x - end.outwardX * tangentLength + perpendicularX * bend,
        y: end.y - end.outwardY * tangentLength + perpendicularY * bend
      },
      end: end,
      arcLengths: [],
      totalLength: 0
    };

    path = createdPath;
    buildArcLengths(createdPath);
    return createdPath;
  }

  function cubicPoint(progress) {
    var inverse = 1 - progress;
    var inverseSquared = inverse * inverse;
    var progressSquared = progress * progress;

    return {
      x: inverseSquared * inverse * path.start.x +
        3 * inverseSquared * progress * path.controlOne.x +
        3 * inverse * progressSquared * path.controlTwo.x +
        progressSquared * progress * path.end.x,
      y: inverseSquared * inverse * path.start.y +
        3 * inverseSquared * progress * path.controlOne.y +
        3 * inverse * progressSquared * path.controlTwo.y +
        progressSquared * progress * path.end.y
    };
  }

  function buildArcLengths(createdPath) {
    var previous = cubicPoint(0);
    createdPath.arcLengths = [0];
    createdPath.totalLength = 0;

    for (var index = 1; index <= ARC_SAMPLES; index += 1) {
      var current = cubicPoint(index / ARC_SAMPLES);
      createdPath.totalLength += Math.hypot(current.x - previous.x, current.y - previous.y);
      createdPath.arcLengths.push(createdPath.totalLength);
      previous = current;
    }
  }

  function curveProgress(distanceProgress) {
    var target = path.totalLength * distanceProgress;
    var low = 0;
    var high = path.arcLengths.length - 1;

    while (low < high) {
      var middle = Math.floor((low + high) / 2);
      if (path.arcLengths[middle] < target) low = middle + 1;
      else high = middle;
    }

    var upperIndex = Math.max(1, low);
    var lowerIndex = upperIndex - 1;
    var lowerLength = path.arcLengths[lowerIndex];
    var upperLength = path.arcLengths[upperIndex];
    var segmentProgress = upperLength === lowerLength
      ? 0
      : (target - lowerLength) / (upperLength - lowerLength);

    return (lowerIndex + segmentProgress) / ARC_SAMPLES;
  }

  function cubicAngle(progress) {
    var inverse = 1 - progress;
    var dx = 3 * inverse * inverse * (path.controlOne.x - path.start.x) +
      6 * inverse * progress * (path.controlTwo.x - path.controlOne.x) +
      3 * progress * progress * (path.end.x - path.controlTwo.x);
    var dy = 3 * inverse * inverse * (path.controlOne.y - path.start.y) +
      6 * inverse * progress * (path.controlTwo.y - path.controlOne.y) +
      3 * progress * progress * (path.end.y - path.controlTwo.y);
    return Math.atan2(dy, dx) * 180 / Math.PI;
  }

  function createSparkles() {
    var sparkles = [];
    var count = Math.random() > 0.38 ? 2 : 1;

    for (var index = 0; index < count; index += 1) {
      sparkles.push({
        offsetX: randomBetween(-24, 24),
        offsetY: randomBetween(-24, 24),
        size: randomBetween(2, 7),
        phase: randomBetween(0, Math.PI * 2),
        rotation: randomBetween(-0.35, 0.35)
      });
    }

    return sparkles;
  }

  function drawSparkle(x, y, size, rotation, alpha) {
    context.save();
    context.translate(x, y);
    context.rotate(rotation);
    context.globalAlpha = alpha;
    context.fillStyle = "#FFFFFF";
    context.beginPath();
    context.moveTo(0, -size * 1.9);
    context.lineTo(size * 0.28, -size * 0.28);
    context.lineTo(size * 1.45, 0);
    context.lineTo(size * 0.28, size * 0.28);
    context.lineTo(0, size * 1.9);
    context.lineTo(-size * 0.28, size * 0.28);
    context.lineTo(-size * 1.45, 0);
    context.lineTo(-size * 0.28, -size * 0.28);
    context.closePath();
    context.fill();
    context.restore();
  }

  function drawTrail(now, leadingPosition) {
    context.clearRect(0, 0, viewportWidth, viewportHeight);
    points = points.filter(function (point) { return now - point.time < TRAIL_LIFETIME; });

    context.strokeStyle = "#FFFFFF";
    context.lineCap = "round";
    context.lineJoin = "round";

    for (var index = 1; index < points.length; index += 1) {
      var point = points[index];
      var previous = points[index - 1];
      var remaining = 1 - (now - point.time) / TRAIL_LIFETIME;
      var trailShimmer = 0.72 + 0.28 * Math.pow(Math.sin(now * 0.01 + index * 0.34), 2);

      context.globalAlpha = Math.max(0, remaining) * trailShimmer;
      context.lineWidth = TRAIL_WIDTH * (0.78 + 0.22 * trailShimmer) * (0.45 + 0.55 * remaining);
      context.beginPath();
      context.moveTo(previous.x, previous.y);
      context.lineTo(point.x, point.y);
      context.stroke();
    }

    points.forEach(function (point) {
      var remaining = 1 - (now - point.time) / TRAIL_LIFETIME;
      point.sparkles.forEach(function (sparkle) {
        var shimmer = 0.35 + 0.65 * Math.pow(Math.sin(now * 0.012 + sparkle.phase), 2);
        var size = sparkle.size * (0.72 + shimmer * 0.38);
        drawSparkle(
          point.x + sparkle.offsetX,
          point.y + sparkle.offsetY,
          size,
          sparkle.rotation,
          Math.max(0, remaining) * shimmer
        );
      });
    });

    if (leadingPosition) {
      var leadingShimmer = 0.5 + 0.5 * Math.pow(Math.sin(now * 0.016), 2);
      drawSparkle(
        leadingPosition.x,
        leadingPosition.y,
        6 + leadingShimmer * 4,
        now * 0.00045,
        0.42 + leadingShimmer * 0.38
      );
    }

    context.globalAlpha = 1;
  }

  function scheduleNext(firstCrossing) {
    window.clearTimeout(nextCrossing);
    var delay = firstCrossing ? randomBetween(800, 2200) : randomBetween(2500, 7000);
    nextCrossing = window.setTimeout(launch, delay);
  }

  function launch() {
    window.clearTimeout(nextCrossing);
    nextCrossing = 0;
    path = createPath();
    points = [];
    crossingStartedAt = performance.now();
    crossingDuration = randomBetween(3800, 6200);
    lastPointAt = 0;
    active = true;
    star.style.opacity = "1";
    requestFrame();
  }

  function requestFrame() {
    if (!frameRequest) frameRequest = window.requestAnimationFrame(render);
  }

  function render(now) {
    frameRequest = 0;
    var leadingPosition = null;

    if (active) {
      var distanceProgress = Math.min((now - crossingStartedAt) / crossingDuration, 1);
      var progress = curveProgress(distanceProgress);
      var position = cubicPoint(progress);
      var angle = cubicAngle(progress);
      leadingPosition = position;

      star.style.transform = "translate3d(" + position.x + "px," + position.y + "px,0) " +
        "translate(-50%,-50%) rotate(" + angle + "deg)";
      star.style.opacity = String(0.76 + 0.24 * Math.pow(Math.sin(now * 0.014), 2));

      if (!lastPointAt || now - lastPointAt >= 20) {
        points.push({ x: position.x, y: position.y, time: now, sparkles: createSparkles() });
        lastPointAt = now;
      }

      if (distanceProgress === 1) {
        active = false;
        star.style.opacity = "0";
        scheduleNext(false);
      }
    }

    drawTrail(now, leadingPosition);
    if (active || points.length) requestFrame();
  }

  function stop() {
    active = false;
    points = [];
    window.clearTimeout(nextCrossing);
    window.cancelAnimationFrame(frameRequest);
    context.clearRect(0, 0, viewportWidth, viewportHeight);
    canvas.remove();
    star.remove();
  }

  resize();
  window.addEventListener("resize", resize);
  reducedMotion.addEventListener("change", function (event) {
    if (event.matches) stop();
  });

  window.__starTrail = { launch: launch };
  scheduleNext(true);
})();
