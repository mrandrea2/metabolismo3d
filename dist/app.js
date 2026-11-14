import { phases } from "./phases.js";
import { createRenderer } from "./scene.js";

const byId = id => document.getElementById(id);
const phaseButtons = [...document.querySelectorAll("[data-phase]")];
const canvas = byId("scene");
const draw = createRenderer(canvas);
const play = byId("play");
const progress = byId("progress");
const previous = byId("previous-step");
const next = byId("next-step");
const duration = 5800;
const points = new Map();
const icons = {
  play: '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M8 5.1c0-.8.9-1.3 1.6-.9l10.1 6.9c.7.4.7 1.4 0 1.8L9.6 19.8c-.7.4-1.6-.1-1.6-.9Z"/></svg>',
  pause: '<svg aria-hidden="true" viewBox="0 0 24 24"><rect x="6" y="5" width="4.5" height="14" rx="1"/><rect x="13.5" y="5" width="4.5" height="14" rx="1"/></svg>',
  replay: '<svg aria-hidden="true" viewBox="0 0 24 24" style="stroke:currentColor;stroke-width:2;fill:none"><path d="M4 11a8 8 0 1 1 2 6m-2-6V5m0 6h6"/></svg>'
};
let active, phase, view, elapsed, shownStep;
let playing = false, lastFrame, request = 0;

function totalTime() {
  return phase.steps.length * duration;
}

function currentStep() {
  return Math.min(phase.steps.length - 1, Math.floor(elapsed / duration));
}

function requestPaint() {
  if (!request) request = requestAnimationFrame(frame);
}

function frame(now) {
  request = 0;
  if (playing) {
    if (lastFrame !== undefined) elapsed = Math.min(totalTime(), elapsed + Math.min(100, now - lastFrame));
    lastFrame = now;
    if (elapsed >= totalTime()) setPlaying(false);
  }
  const step = currentStep();
  const fraction = (elapsed - step * duration) / duration;
  draw(active, step, fraction, view);
  updateProgress();
  if (playing) requestPaint();
}

function updateProgress() {
  const pct = elapsed / totalTime();
  progress.value = Math.round(pct * 1000);
  progress.style.setProperty("--progress", `${pct * 100}%`);
  const step = currentStep();
  if (step !== shownStep) showStep(step);
}

function showStep(step) {
  const [title, text] = phase.steps[step];
  shownStep = step;
  byId("step-counter").textContent = `${step + 1} / ${phase.steps.length}`;
  byId("step-label").textContent = `Passaggio ${step + 1}`;
  byId("step-title").textContent = title;
  byId("step-text").textContent = text;
  progress.setAttribute("aria-valuetext", `Passaggio ${step + 1} di ${phase.steps.length}. ${title}`);
  previous.disabled = step === 0;
  next.disabled = step === phase.steps.length - 1;
  Array.from(byId("markers").children).forEach((marker, i) => marker.classList.toggle("visited", i <= step));
}

function syncPlay() {
  const ended = elapsed >= totalTime();
  const name = playing ? "Metti in pausa" : ended ? "Riproduci dall’inizio" : "Avvia animazione";
  play.innerHTML = playing ? icons.pause : ended ? icons.replay : icons.play;
  play.setAttribute("aria-label", name);
  play.title = name;
}

function setPlaying(value) {
  playing = value;
  lastFrame = undefined;
  syncPlay();
  requestPaint();
}

function changePhase(key) {
  active = key;
  phase = phases[key];
  elapsed = 0;
  shownStep = -1;
  view = { ...phase.camera };
  document.documentElement.style.setProperty("--accent", phase.accent);
  document.documentElement.style.setProperty("--accent-rgb", phase.rgb);
  document.documentElement.style.setProperty("--accent-ink", phase.ink);
  phaseButtons.forEach(button => {
    const isCurrent = button.dataset.phase === key;
    button.classList.toggle("selected", isCurrent);
    if (isCurrent) button.setAttribute("aria-current", "step");
    else button.removeAttribute("aria-current");
  });
  byId("location").textContent = phase.location;
  canvas.setAttribute("aria-label", `Modello 3D interattivo: ${phase.title}`);
  byId("phase-count").textContent = `Fase 0${phase.number} / 03`;
  byId("phase-title").textContent = phase.title;
  byId("phase-summary").textContent = phase.summary;
  byId("balance-unit").textContent = phase.unit;
  byId("legend").innerHTML = phase.legend.map(([color, label], i) => `<span><i style="--dot:${color};--dot-edge:${phase.legendInk[i]}" aria-hidden="true"></i>${label}</span>`).join("");
  byId("metrics").innerHTML = phase.metrics.map(([value, label]) => `<div class="metric"><dt>${value}</dt><dd>${label}</dd></div>`).join("");
  byId("markers").innerHTML = phase.steps.map(() => '<span aria-hidden="true"></span>').join("");
  byId("source").href = "https://openstax.org/books/biology-2e/pages/" + phase.source;
  updateProgress();
  setPlaying(false);
}

function seek(time) {
  elapsed = Math.max(0, Math.min(time, totalTime()));
  updateProgress();
  setPlaying(false);
}

function togglePlay() {
  if (elapsed >= totalTime()) elapsed = 0;
  setPlaying(!playing);
}

function rotate(dx, dy) {
  view.yaw += dx;
  view.pitch = Math.max(-1.49, Math.min(1.49, view.pitch + dy));
  requestPaint();
}

function zoom(factor) {
  view.zoom = Math.max(.57, Math.min(2.25, view.zoom * factor));
  requestPaint();
}

function distance() {
  const [first, second] = points.values();
  return Math.hypot(first.x - second.x, first.y - second.y);
}

phaseButtons.forEach(button => button.addEventListener("click", () => {
  if (active !== button.dataset.phase) changePhase(button.dataset.phase);
}));
play.addEventListener("click", togglePlay);
progress.addEventListener("input", () => seek(Number(progress.value) / 1000 * totalTime()));
previous.addEventListener("click", () => seek((currentStep() - 1) * duration));
next.addEventListener("click", () => seek((currentStep() + 1) * duration));
byId("zoom-in").addEventListener("click", () => zoom(1.19));
byId("zoom-out").addEventListener("click", () => zoom(1 / 1.19));
byId("reset-view").addEventListener("click", () => {
  view = { ...phase.camera };
  requestPaint();
});

canvas.addEventListener("pointerdown", event => {
  if (event.button !== 0 || points.size >= 2) return;
  canvas.setPointerCapture(event.pointerId);
  points.set(event.pointerId, { x: event.clientX, y: event.clientY });
});
canvas.addEventListener("pointermove", event => {
  const old = points.get(event.pointerId);
  if (!old) return;
  const previousDistance = points.size === 2 ? distance() : 0;
  points.set(event.pointerId, { x: event.clientX, y: event.clientY });
  if (previousDistance > 0) zoom(distance() / previousDistance);
  else rotate((event.clientX - old.x) * .008, (event.clientY - old.y) * .008);
});
["pointerup", "pointercancel", "lostpointercapture"].forEach(type => {
  canvas.addEventListener(type, event => points.delete(event.pointerId));
});
canvas.addEventListener("wheel", event => {
  if (event.ctrlKey || event.metaKey) return;
  event.preventDefault();
  const scale = event.deltaMode === 0 ? .0014 : .035;
  zoom(Math.exp(-event.deltaY * scale));
}, { passive: false });
canvas.addEventListener("keydown", event => {
  switch (event.key) {
    case "ArrowLeft": rotate(-.14, 0); break;
    case "ArrowRight": rotate(.14, 0); break;
    case "ArrowUp": rotate(0, -.14); break;
    case "ArrowDown": rotate(0, .14); break;
    case "+": case "=": zoom(1.19); break;
    case "-": zoom(1 / 1.19); break;
    case " ": togglePlay(); break;
    default: return;
  }
  event.preventDefault();
});
new ResizeObserver(requestPaint).observe(canvas);
changePhase("glycolysis");
