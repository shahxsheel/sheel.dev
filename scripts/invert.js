/* invert.js — the Invert toggle (DESIGN.md §6).
   The pre-paint application lives in an inline <head> script to avoid a flash;
   this file only wires up the button once the DOM is ready. */
(function () {
  "use strict";
  var KEY = "sheel.invert";
  var btn = document.querySelector(".invert-toggle");
  if (!btn) return;

  function isOn() {
    return document.documentElement.classList.contains("invert");
  }
  function render() {
    btn.setAttribute("aria-pressed", isOn() ? "true" : "false");
  }
  btn.addEventListener("click", function () {
    var on = document.documentElement.classList.toggle("invert");
    try { localStorage.setItem(KEY, on ? "1" : "0"); } catch (e) {}
    render();
  });
  render();
})();
