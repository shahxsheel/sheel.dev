/* stage.js — hotspots + debug mode (DESIGN.md §5.1, §5.3).
   Hotspots are plain <a> elements in the HTML; this only adds the debug
   affordance (press "d") and keeps the per-object readouts in sync. */
(function () {
  "use strict";

  var objects = Array.prototype.slice.call(document.querySelectorAll(".object"));
  var readout = document.querySelector(".debug-readout");

  // Read the geometry the browser actually resolved, rather than the inline
  // custom properties: portrait overrides live in CSS, so the inline values
  // are wrong below 768px. offset* is pre-transform, so rotation is ignored.
  function geom(el) {
    var stage = el.offsetParent || document.getElementById("stage");
    if (!stage) return null;
    var pct = function (n, d) { return (100 * n / d).toFixed(1) + "%"; };
    return {
      x: pct(el.offsetLeft, stage.clientWidth),
      y: pct(el.offsetTop, stage.clientHeight),
      w: pct(el.offsetWidth, stage.clientWidth),
      r: (el.style.getPropertyValue("--r") || "0deg").trim()
    };
  }

  function render() {
    var rows = [];
    objects.forEach(function (el) {
      var g = geom(el);
      if (!g) return;
      var name = el.getAttribute("data-name") || "object";
      el.setAttribute("data-debug", name + " x:" + g.x + " y:" + g.y + " w:" + g.w);
      rows.push(name + "  x:" + g.x + "  y:" + g.y + "  w:" + g.w + "  r:" + g.r);
    });
    if (readout) readout.textContent = rows.join("\n");
  }

  render();
  addEventListener("resize", render);

  // "d" toggles debug mode. Ignore when typing in a field.
  document.addEventListener("keydown", function (e) {
    if (e.key !== "d" && e.key !== "D") return;
    var t = e.target;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
    document.body.classList.toggle("debug");
  });
})();
