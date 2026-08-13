/* Browser-compatible playback for the supplied Windows .ani cursor family.
   The four extracted frames retain the original 0,1,2,3,2,1 sequence. */
(function () {
  "use strict";

  var sourceScript = document.currentScript;
  if (!sourceScript) return;

  var sequence = [0, 1, 2, 3, 2, 1];
  var BUSY_DELAY = 500;
  var CLICK_VOLUME = 0.45;
  var CLICK_VOICES = 3;
  var sequenceIndex = 0;
  var clickVoiceIndex = 0;
  var animationTimer = 0;
  var busyResetTimer = 0;
  var pendingNavigation = 0;
  var root = document.documentElement;
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var baseUrl = new URL("../assets/cursors/", sourceScript.src);
  var clickSoundUrl = new URL("../assets/audio/mouse-click.mp3?v=20260813-1", sourceScript.src);
  var clickVoices = [];
  var states = {
    default: { hotspot: "0 0", fallback: "default" },
    link: { hotspot: "11 0", fallback: "pointer" },
    busy: { hotspot: "16 16", fallback: "wait" }
  };

  function frameUrl(state, frame) {
    return new URL("desaparezco-" + state + "-" + frame + ".png", baseUrl).href;
  }

  function setFrame(frame) {
    Object.keys(states).forEach(function (state) {
      var settings = states[state];
      var value = 'url("' + frameUrl(state, frame) + '") ' + settings.hotspot + ", " + settings.fallback;
      root.style.setProperty("--cursor-" + state, value);
    });
  }

  function preload() {
    Object.keys(states).forEach(function (state) {
      for (var frame = 0; frame < 4; frame += 1) {
        var image = new Image();
        image.src = frameUrl(state, frame);
      }
    });

    for (var voice = 0; voice < CLICK_VOICES; voice += 1) {
      var audio = new Audio(clickSoundUrl.href);
      audio.preload = "auto";
      audio.volume = CLICK_VOLUME;
      clickVoices.push(audio);
    }
  }

  function playClickSound(event) {
    if (event.button !== 0 || event.detail === 0) return;
    var voice = clickVoices[clickVoiceIndex];
    if (!voice) return;
    clickVoiceIndex = (clickVoiceIndex + 1) % clickVoices.length;
    voice.currentTime = 0;
    var playback = voice.play();
    if (playback && typeof playback.catch === "function") playback.catch(function () {});
  }

  function beginBusy() {
    root.classList.add("cursor-busy");
  }

  function endBusy() {
    root.classList.remove("cursor-busy");
  }

  function showTemporaryBusy() {
    beginBusy();
    window.clearTimeout(busyResetTimer);
    busyResetTimer = window.setTimeout(endBusy, BUSY_DELAY);
  }

  function startAnimation() {
    if (animationTimer || reducedMotion.matches) return;
    animationTimer = window.setInterval(function () {
      sequenceIndex = (sequenceIndex + 1) % sequence.length;
      setFrame(sequence[sequenceIndex]);
    }, 167);
  }

  function stopAnimation() {
    window.clearInterval(animationTimer);
    animationTimer = 0;
    sequenceIndex = 0;
    setFrame(sequence[0]);
  }

  setFrame(sequence[0]);
  preload();
  startAnimation();
  reducedMotion.addEventListener("change", function () {
    if (reducedMotion.matches) stopAnimation();
    else startAnimation();
  });

  document.addEventListener("click", playClickSound, true);

  document.addEventListener("click", function (event) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    var control = event.target.closest && event.target.closest('a[href], button, [role="button"]');
    if (!control) return;

    if (control.tagName !== "A") {
      showTemporaryBusy();
      return;
    }

    if (control.target === "_blank" || control.hasAttribute("download")) return;

    var destination;
    try { destination = new URL(control.href, location.href); } catch (error) { return; }
    if (destination.pathname === location.pathname && destination.search === location.search && destination.hash) return;

    event.preventDefault();
    if (pendingNavigation) return;
    beginBusy();
    pendingNavigation = window.setTimeout(function () {
      location.assign(destination.href);
    }, BUSY_DELAY);
  });

  document.addEventListener("submit", beginBusy);
  window.addEventListener("beforeunload", beginBusy);
  window.addEventListener("pageshow", function () {
    window.clearTimeout(busyResetTimer);
    window.clearTimeout(pendingNavigation);
    busyResetTimer = 0;
    pendingNavigation = 0;
    endBusy();
  });
  window.__cursorAni = { busy: beginBusy, ready: endBusy };
})();
