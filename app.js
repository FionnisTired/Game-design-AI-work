const WIDTH = 1152;
const HEIGHT = 768;

const canvas = document.getElementById("paintCanvas");
const ctx = canvas.getContext("2d", { willReadFrequently: true });
const overlay = document.getElementById("overlayCanvas");
const octx = overlay.getContext("2d");
const colorPicker = document.getElementById("colorPicker");
const opacitySlider = document.getElementById("opacitySlider");
const opacityValue = document.getElementById("opacityValue");
const sizeSlider = document.getElementById("sizeSlider");
const sizeValue = document.getElementById("sizeValue");
const toolButtons = document.getElementById("toolButtons");
const activeToolLabel = document.getElementById("activeToolLabel");
const hint = document.getElementById("hint");
const layersList = document.getElementById("layersList");
const layerTemplate = document.getElementById("layerTemplate");
const layerOpacitySlider = document.getElementById("layerOpacitySlider");
const layerOpacityValue = document.getElementById("layerOpacityValue");
const blobGallery = document.getElementById("blobGallery");

let tool = "draw";
let layers = [];
let activeLayer = 0;
let history = [];
let future = [];
let isDrawing = false;
let start = null;
let last = null;
let lassoPoints = [];
let selection = null;
let clipboard = null;
let promptBlob = null;

const hints = {
  draw: "Paint layer",
  erase: "Paint layer",
  picker: "Paint layer",
  bucket: "Paint layer",
  select: "Paint layer",
  lasso: "Paint layer",
  line: "Paint layer",
  square: "Paint layer",
  circle: "Paint layer",
  triangle: "Paint layer"
};

const swatchColors = [
  "#f25f4c", "#f7c948", "#60d394", "#5da9e9", "#a78bfa",
  "#f472b6", "#111827", "#f8f5ec", "#6b7280", "#2dd4bf"
];

function makeLayer(name = `Layer ${layers.length + 1}`) {
  const c = document.createElement("canvas");
  c.width = WIDTH;
  c.height = HEIGHT;
  return {
    id: crypto.randomUUID(),
    name,
    opacity: 1,
    canvas: c,
    ctx: c.getContext("2d", { willReadFrequently: true })
  };
}

function active() {
  return layers[activeLayer];
}

function setCanvasCssSync() {
  const rect = canvas.getBoundingClientRect();
  const shellRect = canvas.parentElement.getBoundingClientRect();
  overlay.style.width = `${rect.width}px`;
  overlay.style.height = `${rect.height}px`;
  overlay.style.left = `${rect.left - shellRect.left}px`;
  overlay.style.top = `${rect.top - shellRect.top}px`;
}

function render() {
  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#f8f5ec";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  for (const layer of layers) {
    ctx.globalAlpha = layer.opacity;
    ctx.drawImage(layer.canvas, 0, 0);
  }
  ctx.restore();
  drawSelectionOverlay();
  requestAnimationFrame(setCanvasCssSync);
}

function clearOverlay() {
  octx.clearRect(0, 0, WIDTH, HEIGHT);
}

function drawSelectionOverlay() {
  clearOverlay();
  if (!selection) return;
  octx.save();
  octx.setLineDash([9, 6]);
  octx.lineWidth = 2;
  octx.strokeStyle = "#111827";
  octx.fillStyle = "rgba(93, 169, 233, .16)";
  beginSelectionPath(octx, selection);
  octx.fill();
  octx.stroke();
  octx.setLineDash([]);
  octx.strokeStyle = "#f7c948";
  octx.lineWidth = 1;
  beginSelectionPath(octx, selection);
  octx.stroke();
  octx.restore();
}

function beginSelectionPath(target, sel) {
  target.beginPath();
  if (sel.type === "rect") {
    target.rect(sel.x, sel.y, sel.w, sel.h);
    return;
  }
  const [first, ...rest] = sel.points;
  target.moveTo(first.x, first.y);
  for (const point of rest) target.lineTo(point.x, point.y);
  target.closePath();
}

function getPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: Math.max(0, Math.min(WIDTH, (event.clientX - rect.left) * WIDTH / rect.width)),
    y: Math.max(0, Math.min(HEIGHT, (event.clientY - rect.top) * HEIGHT / rect.height))
  };
}

function hexToRgba(hex, alpha = 1) {
  const clean = hex.replace("#", "");
  const n = Number.parseInt(clean, 16);
  return {
    r: (n >> 16) & 255,
    g: (n >> 8) & 255,
    b: n & 255,
    a: Math.round(alpha * 255)
  };
}

function rgbaString(hex, alpha = 1) {
  const c = hexToRgba(hex, alpha);
  return `rgba(${c.r}, ${c.g}, ${c.b}, ${alpha})`;
}

function rgbToHex(r, g, b) {
  return `#${[r, g, b].map(v => v.toString(16).padStart(2, "0")).join("")}`;
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function saveHistory() {
  history.push({
    activeLayer,
    layers: layers.map(layer => ({
      id: layer.id,
      name: layer.name,
      opacity: layer.opacity,
      data: layer.canvas.toDataURL()
    }))
  });
  if (history.length > 60) history.shift();
  future = [];
  updateActionButtons();
}

function restoreSnapshot(snapshot) {
  layers = snapshot.layers.map(item => {
    const layer = makeLayer(item.name);
    layer.id = item.id;
    layer.opacity = item.opacity;
    const image = new Image();
    image.src = item.data;
    image.onload = () => {
      layer.ctx.clearRect(0, 0, WIDTH, HEIGHT);
      layer.ctx.drawImage(image, 0, 0);
      render();
    };
    return layer;
  });
  activeLayer = Math.min(snapshot.activeLayer, layers.length - 1);
  selection = null;
  syncLayerUi();
  render();
}

function undo() {
  if (history.length <= 1) return;
  future.push(history.pop());
  restoreSnapshot(history[history.length - 1]);
  updateActionButtons();
}

function redo() {
  if (!future.length) return;
  const snapshot = future.pop();
  history.push(snapshot);
  restoreSnapshot(snapshot);
  updateActionButtons();
}

function updateActionButtons() {
  document.getElementById("undoBtn").disabled = history.length <= 1;
  document.getElementById("redoBtn").disabled = future.length === 0;
}

function setTool(nextTool) {
  tool = nextTool;
  for (const button of toolButtons.querySelectorAll("button")) {
    button.classList.toggle("active", button.dataset.tool === tool);
  }
  activeToolLabel.textContent = tool[0].toUpperCase() + tool.slice(1);
  hint.textContent = hints[tool];
  if (tool !== "select" && tool !== "lasso") {
    selection = null;
    clearOverlay();
  } else {
    drawSelectionOverlay();
  }
}

function configureStroke(target, erase = false) {
  target.lineCap = "round";
  target.lineJoin = "round";
  target.lineWidth = Number(sizeSlider.value);
  target.globalAlpha = 1;
  target.globalCompositeOperation = erase ? "destination-out" : "source-over";
  target.strokeStyle = erase ? "rgba(0,0,0,1)" : rgbaString(colorPicker.value, Number(opacitySlider.value) / 100);
}

function paintLine(from, to, erase = false) {
  const layer = active();
  layer.ctx.save();
  configureStroke(layer.ctx, erase);
  layer.ctx.beginPath();
  layer.ctx.moveTo(from.x, from.y);
  layer.ctx.lineTo(to.x, to.y);
  layer.ctx.stroke();
  layer.ctx.restore();
  render();
}

function drawShapePreview(current) {
  clearOverlay();
  if (selection) drawSelectionOverlay();
  octx.save();
  configureStroke(octx, false);
  octx.strokeStyle = rgbaString(colorPicker.value, .95);
  octx.fillStyle = rgbaString(colorPicker.value, Number(opacitySlider.value) / 320);
  drawShape(octx, start, current, tool, true);
  octx.restore();
}

function commitShape(end) {
  const layer = active();
  layer.ctx.save();
  configureStroke(layer.ctx, false);
  layer.ctx.fillStyle = rgbaString(colorPicker.value, Number(opacitySlider.value) / 450);
  drawShape(layer.ctx, start, end, tool, false);
  layer.ctx.restore();
  clearOverlay();
  saveHistory();
  render();
}

function drawShape(target, a, b, kind, preview) {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  const w = Math.abs(a.x - b.x);
  const h = Math.abs(a.y - b.y);
  target.beginPath();
  if (kind === "line") {
    target.moveTo(a.x, a.y);
    target.lineTo(b.x, b.y);
  } else if (kind === "square") {
    target.rect(x, y, w, h);
  } else if (kind === "circle") {
    target.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
  } else if (kind === "triangle") {
    target.moveTo(x + w / 2, y);
    target.lineTo(x + w, y + h);
    target.lineTo(x, y + h);
    target.closePath();
  }
  if (kind !== "line") target.fill();
  target.stroke();
  if (preview) drawHandle(target, b);
}

function drawHandle(target, point) {
  target.save();
  target.fillStyle = "#f7c948";
  target.beginPath();
  target.arc(point.x, point.y, 5, 0, Math.PI * 2);
  target.fill();
  target.restore();
}

function floodFill(point) {
  const layer = active();
  const image = layer.ctx.getImageData(0, 0, WIDTH, HEIGHT);
  const data = image.data;
  const x = Math.floor(point.x);
  const y = Math.floor(point.y);
  const startIndex = (y * WIDTH + x) * 4;
  const target = data.slice(startIndex, startIndex + 4);
  const replacement = hexToRgba(colorPicker.value, Number(opacitySlider.value) / 100);
  if (sameColor(target, replacement, 0)) return;

  const stack = [[x, y]];
  const seen = new Uint8Array(WIDTH * HEIGHT);
  const tolerance = 24;
  while (stack.length) {
    const [cx, cy] = stack.pop();
    if (cx < 0 || cy < 0 || cx >= WIDTH || cy >= HEIGHT) continue;
    const pixel = cy * WIDTH + cx;
    if (seen[pixel]) continue;
    seen[pixel] = 1;
    const idx = pixel * 4;
    if (!sameColor(data.slice(idx, idx + 4), target, tolerance)) continue;
    data[idx] = replacement.r;
    data[idx + 1] = replacement.g;
    data[idx + 2] = replacement.b;
    data[idx + 3] = replacement.a;
    stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
  }
  layer.ctx.putImageData(image, 0, 0);
  saveHistory();
  render();
}

function sameColor(a, b, tolerance) {
  const br = Array.isArray(b) || ArrayBuffer.isView(b) ? b[0] : b.r;
  const bg = Array.isArray(b) || ArrayBuffer.isView(b) ? b[1] : b.g;
  const bb = Array.isArray(b) || ArrayBuffer.isView(b) ? b[2] : b.b;
  const ba = Array.isArray(b) || ArrayBuffer.isView(b) ? b[3] : b.a;
  return Math.abs(a[0] - br) <= tolerance &&
    Math.abs(a[1] - bg) <= tolerance &&
    Math.abs(a[2] - bb) <= tolerance &&
    Math.abs(a[3] - ba) <= tolerance;
}

function sampleColor(point) {
  render();
  const pixel = ctx.getImageData(Math.floor(point.x), Math.floor(point.y), 1, 1).data;
  colorPicker.value = rgbToHex(pixel[0], pixel[1], pixel[2]);
}

function copySelection(cut = false) {
  if (!selection) return;
  const bounds = selectionBounds(selection);
  if (bounds.w < 2 || bounds.h < 2) return;
  const c = document.createElement("canvas");
  c.width = bounds.w;
  c.height = bounds.h;
  const cctx = c.getContext("2d");
  cctx.save();
  cctx.translate(-bounds.x, -bounds.y);
  beginSelectionPath(cctx, selection);
  cctx.clip();
  cctx.drawImage(active().canvas, 0, 0);
  cctx.restore();
  clipboard = c;
  if (cut) clearSelectionPixels(true);
}

function pasteClipboard() {
  if (!clipboard) return;
  const layer = active();
  layer.ctx.drawImage(clipboard, WIDTH / 2 - clipboard.width / 2, HEIGHT / 2 - clipboard.height / 2);
  selection = {
    type: "rect",
    x: WIDTH / 2 - clipboard.width / 2,
    y: HEIGHT / 2 - clipboard.height / 2,
    w: clipboard.width,
    h: clipboard.height
  };
  saveHistory();
  render();
}

function clearSelectionPixels(save = true) {
  if (!selection) return;
  const layer = active();
  layer.ctx.save();
  layer.ctx.globalCompositeOperation = "destination-out";
  beginSelectionPath(layer.ctx, selection);
  layer.ctx.fill();
  layer.ctx.restore();
  if (save) saveHistory();
  render();
}

function selectionBounds(sel) {
  if (sel.type === "rect") {
    return {
      x: Math.round(Math.min(sel.x, sel.x + sel.w)),
      y: Math.round(Math.min(sel.y, sel.y + sel.h)),
      w: Math.round(Math.abs(sel.w)),
      h: Math.round(Math.abs(sel.h))
    };
  }
  const xs = sel.points.map(p => p.x);
  const ys = sel.points.map(p => p.y);
  const x = Math.max(0, Math.floor(Math.min(...xs)));
  const y = Math.max(0, Math.floor(Math.min(...ys)));
  return {
    x,
    y,
    w: Math.min(WIDTH - x, Math.ceil(Math.max(...xs) - x)),
    h: Math.min(HEIGHT - y, Math.ceil(Math.max(...ys) - y))
  };
}

function syncLayerUi() {
  layersList.innerHTML = "";
  const displayLayers = [...layers].map((layer, index) => ({ layer, index })).reverse();
  for (const { layer, index } of displayLayers) {
    const item = layerTemplate.content.firstElementChild.cloneNode(true);
    item.classList.toggle("active", index === activeLayer);
    item.querySelector(".layer-name").textContent = `${layer.name} · ${Math.round(layer.opacity * 100)}%`;
    item.querySelector(".layer-name").onclick = () => {
      activeLayer = index;
      selection = null;
      syncLayerUi();
      render();
    };
    item.querySelector(".up").onclick = () => moveLayer(index, 1);
    item.querySelector(".down").onclick = () => moveLayer(index, -1);
    item.querySelector(".clear").onclick = () => clearLayer(index);
    item.querySelector(".delete").onclick = () => deleteLayer(index);
    layersList.appendChild(item);
  }
  layerOpacitySlider.value = Math.round(active().opacity * 100);
  layerOpacityValue.textContent = `${layerOpacitySlider.value}%`;
}

function addLayer(name) {
  layers.push(makeLayer(name));
  activeLayer = layers.length - 1;
  selection = null;
  saveHistory();
  syncLayerUi();
  render();
}

function moveLayer(index, direction) {
  const next = index + direction;
  if (next < 0 || next >= layers.length) return;
  [layers[index], layers[next]] = [layers[next], layers[index]];
  activeLayer = next;
  saveHistory();
  syncLayerUi();
  render();
}

function clearLayer(index = activeLayer) {
  layers[index].ctx.clearRect(0, 0, WIDTH, HEIGHT);
  selection = null;
  saveHistory();
  render();
}

function deleteLayer(index) {
  if (layers.length === 1) {
    clearLayer(index);
    return;
  }
  layers.splice(index, 1);
  activeLayer = Math.max(0, Math.min(activeLayer, layers.length - 1));
  selection = null;
  saveHistory();
  syncLayerUi();
  render();
}

function mergeLayer() {
  if (activeLayer === 0 || layers.length < 2) return;
  const top = active();
  const below = layers[activeLayer - 1];
  below.ctx.save();
  below.ctx.globalAlpha = top.opacity;
  below.ctx.drawImage(top.canvas, 0, 0);
  below.ctx.restore();
  layers.splice(activeLayer, 1);
  activeLayer -= 1;
  saveHistory();
  syncLayerUi();
  render();
}

function addGradientLayer() {
  const layer = makeLayer(`Gradient ${layers.length + 1}`);
  const gradient = layer.ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  gradient.addColorStop(0, colorPicker.value);
  gradient.addColorStop(.55, "#f7c948");
  gradient.addColorStop(1, "#5da9e9");
  layer.ctx.fillStyle = gradient;
  layer.ctx.fillRect(0, 0, WIDTH, HEIGHT);
  layer.opacity = .42;
  layers.push(layer);
  activeLayer = layers.length - 1;
  saveHistory();
  syncLayerUi();
  render();
}

function createSwatches() {
  const swatches = document.getElementById("swatches");
  for (const color of swatchColors) {
    const button = document.createElement("button");
    button.className = "swatch";
    button.style.background = color;
    button.title = color;
    button.onclick = () => {
      colorPicker.value = color;
    };
    swatches.appendChild(button);
  }
}

function drawBlobPrompt(target, seed) {
  const bctx = target.getContext("2d");
  bctx.clearRect(0, 0, target.width, target.height);
  const colors = ["#60d394", "#f25f4c", "#f7c948", "#5da9e9", "#a78bfa"];
  bctx.save();
  bctx.translate(70, 58);
  bctx.fillStyle = colors[seed % colors.length];
  bctx.beginPath();
  const points = 13;
  for (let i = 0; i <= points; i++) {
    const angle = i / points * Math.PI * 2;
    const wobble = 34 + Math.sin(seed * 2.7 + i * 1.8) * 11 + Math.cos(seed + i * .9) * 7;
    const x = Math.cos(angle) * wobble;
    const y = Math.sin(angle) * (wobble * .82);
    if (i === 0) bctx.moveTo(x, y);
    else bctx.quadraticCurveTo(Math.cos(angle - .24) * (wobble + 10), Math.sin(angle - .24) * wobble, x, y);
  }
  bctx.closePath();
  bctx.fill();
  bctx.fillStyle = "rgba(0,0,0,.78)";
  bctx.beginPath();
  bctx.arc(-13, -8, 4, 0, Math.PI * 2);
  bctx.arc(13, -10, 4, 0, Math.PI * 2);
  bctx.fill();
  bctx.strokeStyle = "rgba(0,0,0,.55)";
  bctx.lineWidth = 4;
  bctx.beginPath();
  bctx.moveTo(-18, 21);
  bctx.quadraticCurveTo(0, 31 + seed % 3 * 3, 20, 19);
  bctx.stroke();
  bctx.restore();
}

function createBlobGallery() {
  for (let i = 0; i < 8; i++) {
    const button = document.createElement("button");
    button.className = "blob-card";
    button.title = "Use this blob as a loose painting prompt";
    const c = document.createElement("canvas");
    c.width = 140;
    c.height = 116;
    drawBlobPrompt(c, i + 1);
    button.appendChild(c);
    button.onclick = () => {
      promptBlob = i;
      for (const card of blobGallery.children) card.classList.remove("active");
      button.classList.add("active");
      ghostPrompt(c);
    };
    blobGallery.appendChild(button);
  }
}

function ghostPrompt(source) {
  const layer = active();
  layer.ctx.save();
  layer.ctx.globalAlpha = .18;
  layer.ctx.drawImage(source, WIDTH - 250, HEIGHT - 230, 190, 158);
  layer.ctx.restore();
  saveHistory();
  render();
}

canvas.addEventListener("pointerdown", event => {
  canvas.setPointerCapture(event.pointerId);
  const point = getPoint(event);
  start = point;
  last = point;
  isDrawing = true;
  if (tool === "draw" || tool === "erase") {
    paintLine(point, point, tool === "erase");
  } else if (tool === "bucket") {
    floodFill(point);
    isDrawing = false;
  } else if (tool === "picker") {
    sampleColor(point);
    isDrawing = false;
  } else if (tool === "lasso") {
    lassoPoints = [point];
    clearOverlay();
  } else if (tool === "select") {
    selection = { type: "rect", x: point.x, y: point.y, w: 0, h: 0 };
    drawSelectionOverlay();
  }
});

canvas.addEventListener("pointermove", event => {
  if (!isDrawing) return;
  const point = getPoint(event);
  if (tool === "draw" || tool === "erase") {
    if (distance(point, last) > .8) {
      paintLine(last, point, tool === "erase");
      last = point;
    }
  } else if (["line", "square", "circle", "triangle"].includes(tool)) {
    drawShapePreview(point);
  } else if (tool === "select") {
    selection.w = point.x - selection.x;
    selection.h = point.y - selection.y;
    drawSelectionOverlay();
  } else if (tool === "lasso") {
    if (distance(point, lassoPoints[lassoPoints.length - 1]) > 4) lassoPoints.push(point);
    clearOverlay();
    octx.save();
    octx.strokeStyle = "#f7c948";
    octx.lineWidth = 2;
    octx.setLineDash([8, 6]);
    octx.beginPath();
    octx.moveTo(lassoPoints[0].x, lassoPoints[0].y);
    for (const p of lassoPoints) octx.lineTo(p.x, p.y);
    octx.stroke();
    octx.restore();
  }
});

canvas.addEventListener("pointerup", event => {
  if (!isDrawing) return;
  const point = getPoint(event);
  isDrawing = false;
  if (tool === "draw" || tool === "erase") {
    saveHistory();
  } else if (["line", "square", "circle", "triangle"].includes(tool)) {
    commitShape(point);
  } else if (tool === "select") {
    if (Math.abs(selection.w) < 4 || Math.abs(selection.h) < 4) selection = null;
    drawSelectionOverlay();
  } else if (tool === "lasso") {
    if (lassoPoints.length > 4) selection = { type: "lasso", points: lassoPoints };
    lassoPoints = [];
    drawSelectionOverlay();
  }
});

canvas.addEventListener("pointercancel", () => {
  isDrawing = false;
  lassoPoints = [];
  drawSelectionOverlay();
});

toolButtons.addEventListener("click", event => {
  const button = event.target.closest("button[data-tool]");
  if (button) setTool(button.dataset.tool);
});

opacitySlider.addEventListener("input", () => {
  opacityValue.textContent = `${opacitySlider.value}%`;
});

sizeSlider.addEventListener("input", () => {
  sizeValue.textContent = sizeSlider.value;
});

layerOpacitySlider.addEventListener("input", () => {
  active().opacity = Number(layerOpacitySlider.value) / 100;
  layerOpacityValue.textContent = `${layerOpacitySlider.value}%`;
  syncLayerUi();
  render();
});

layerOpacitySlider.addEventListener("change", saveHistory);

document.getElementById("undoBtn").onclick = undo;
document.getElementById("redoBtn").onclick = redo;
document.getElementById("addLayerBtn").onclick = () => addLayer();
document.getElementById("gradientLayerBtn").onclick = addGradientLayer;
document.getElementById("mergeLayerBtn").onclick = mergeLayer;
document.getElementById("clearCanvasBtn").onclick = () => clearLayer(activeLayer);
document.getElementById("cutBtn").onclick = () => copySelection(true);
document.getElementById("copyBtn").onclick = () => copySelection(false);
document.getElementById("pasteBtn").onclick = pasteClipboard;
document.getElementById("clearSelBtn").onclick = () => clearSelectionPixels(true);
document.getElementById("downloadBtn").onclick = () => {
  render();
  const link = document.createElement("a");
  link.download = "blob-paint.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
};

window.addEventListener("resize", setCanvasCssSync);

createSwatches();
createBlobGallery();
layers.push(makeLayer("Sketch"));
layers.push(makeLayer("Paint"));
activeLayer = 1;
saveHistory();
syncLayerUi();
setTool("draw");
render();
