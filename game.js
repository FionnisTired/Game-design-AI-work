const panel = document.getElementById("rhythmPanel");
const notesLayer = document.getElementById("notes");
const feedback = document.getElementById("feedback");
const scoreEl = document.getElementById("score");
const comboEl = document.getElementById("combo");
const accuracyEl = document.getElementById("accuracy");
const messageEl = document.getElementById("message");
const progressFill = document.getElementById("progressFill");
const startScreen = document.getElementById("startScreen");
const songList = document.getElementById("songList");
const difficultyList = document.getElementById("difficultyList");
const optionList = document.getElementById("optionList");
const keyGrid = document.getElementById("keyGrid");
const keyHint = document.getElementById("keyHint");
const selectedBest = document.getElementById("selectedBest");
const scoreboardRows = document.getElementById("scoreboardRows");
const pads = [...document.querySelectorAll(".pad")];
const laneLabels = [...document.querySelectorAll(".lane-label")];
const bandKeys = [...document.querySelectorAll(".bug kbd")];
const topDifficultyButtons = [...document.querySelectorAll(".mode-button")];
const soundButton = document.getElementById("sound");
const restartButton = document.getElementById("restart");
const startButton = document.getElementById("start");

const storageKey = "vine-nocturne-settings-v4";
const scoreStorageKey = "vine-nocturne-high-scores-v4";
const laneNames = ["Seedpod", "Reed", "Petal", "Vine"];
const defaultKeys = ["a", "s", "d", "f"];
let keys = [...defaultKeys];

const laneColors = [
  ["#dba85f", "#74592a", "rgba(241, 201, 120, 0.48)"],
  ["#98d8c2", "#2f6e62", "rgba(154, 216, 202, 0.5)"],
  ["#e8a5bb", "#8b526b", "rgba(231, 164, 183, 0.48)"],
  ["#a7bf68", "#4d763f", "rgba(185, 220, 116, 0.48)"]
];

const difficulties = {
  sprout: { label: "Sprout", note: "gentlest drift", tempo: 0.72, travel: 6, window: 0.82, perfect: 0.24, good: 0.48, multiplier: 0.75, message: "Sprout gives the band a sleepy pace with a very forgiving window." },
  easy: { label: "Easy", note: "slow leaves", tempo: 0.86, travel: 5.25, window: 0.68, perfect: 0.2, good: 0.4, multiplier: 0.9, message: "Easy lets the leaves drift slowly and gives a wide timing window." },
  normal: { label: "Normal", note: "garden pace", tempo: 1, travel: 4.2, window: 0.56, perfect: 0.16, good: 0.32, multiplier: 1, message: "Normal keeps the calm mood but asks for a steadier hand." },
  hard: { label: "Hard", note: "quick vines", tempo: 1.16, travel: 3.45, window: 0.46, perfect: 0.13, good: 0.26, multiplier: 1.18, message: "Hard makes the leaves fall faster and tightens the timing." },
  wild: { label: "Wild", note: "fast but fair", tempo: 1.32, travel: 2.9, window: 0.38, perfect: 0.11, good: 0.22, multiplier: 1.35, message: "Wild is the fastest garden tempo, still fair if you stay relaxed." }
};

const optionDefs = {
  rush: { label: "Sprout Rush", note: "faster fall, bonus glow", score: 1.1 },
  dense: { label: "Busy Bloom", note: "adds extra gentle notes", score: 1.12 },
  mist: { label: "Mist Veil", note: "slightly tighter timing", score: 1.08 },
  mirror: { label: "Mirror Vines", note: "lanes are reversed", score: 1.05 },
  mobile: { label: "Mobile Pads", note: "larger touch buttons", score: 1 }
};

const songs = [
  { id: "dewstep", title: "Dewstep Prelude", length: 28, feel: "short", detail: "seedpod taps", step: 1.35, motif: [0, 1, 2, 1, 3, 2, 0, 3], accents: [[6.1, 2], [14.2, 0], [21.7, 3]] },
  { id: "mushroom", title: "Mushroom Waltz", length: 40, feel: "medium", detail: "round and swaying", step: 1.18, motif: [0, 2, 1, 0, 3, 1, 2, 3], accents: [[8.4, 1], [16.8, 2], [25.2, 1], [33.6, 3]] },
  { id: "reedlight", title: "Reedlight Caravan", length: 50, feel: "medium-long", detail: "flute replies", step: 1.08, motif: [1, 0, 1, 2, 3, 2, 1, 0, 3, 2], accents: [[10.1, 3], [18.7, 0], [29.5, 2], [39.4, 1], [45.8, 3]] },
  { id: "lanternroot", title: "Lanternroot Lullaby", length: 64, feel: "long", detail: "soft harp blooms", step: 1.28, motif: [2, 1, 0, 2, 3, 2, 1, 3], accents: [[12.8, 0], [24.4, 3], [35.9, 1], [47.5, 2], [58.2, 0]] },
  { id: "thornflower", title: "Thornflower Finale", length: 78, feel: "longest", detail: "full band", step: 0.98, motif: [0, 1, 2, 3, 1, 3, 2, 0, 2, 1, 0, 3], accents: [[9.8, 2], [19.6, 0], [28.4, 3], [37.2, 1], [46.6, 2], [58.8, 0], [69.4, 3], [74.2, 1]] },
  { id: "clover", title: "Clover Clock", length: 34, feel: "short", detail: "tick-tock drums", step: 1.05, motif: [0, 0, 1, 2, 1, 3, 2, 3], accents: [[7.3, 1], [15.1, 3], [27.4, 0]] },
  { id: "amber", title: "Amber Antiphon", length: 44, feel: "medium", detail: "call and response", step: 1.12, motif: [3, 1, 3, 0, 2, 0, 2, 1], accents: [[9.2, 0], [18.4, 3], [31.2, 2], [39.8, 1]] },
  { id: "fern", title: "Fern Spiral", length: 56, feel: "medium-long", detail: "curling melody", step: 1.02, motif: [0, 1, 2, 3, 2, 1, 0, 2, 3], accents: [[11.6, 3], [22.1, 2], [36.5, 1], [49.2, 0]] },
  { id: "pollen", title: "Pollen Lanterns", length: 62, feel: "long", detail: "glowing harp", step: 1.2, motif: [2, 2, 1, 3, 0, 1, 2, 3], accents: [[13.4, 0], [26.8, 1], [42.5, 3], [55.6, 2]] },
  { id: "rain", title: "Raincup Refrain", length: 47, feel: "medium", detail: "soft droplets", step: 1.14, motif: [1, 2, 1, 0, 1, 3, 2, 0], accents: [[8.8, 2], [17.9, 0], [28.6, 3], [40.4, 1]] },
  { id: "moonmoss", title: "Moonmoss Round", length: 70, feel: "long", detail: "warm low strings", step: 1.1, motif: [3, 2, 1, 2, 0, 1, 3, 0, 2], accents: [[12.2, 1], [24.5, 0], [38.1, 2], [51.7, 3], [64.2, 0]] },
  { id: "seed", title: "Seedcase Serenade", length: 36, feel: "short", detail: "snug percussion", step: 1.22, motif: [0, 3, 0, 1, 2, 1, 0, 2], accents: [[5.5, 3], [18.1, 1], [30.6, 2]] },
  { id: "silk", title: "Silkgrass Hymn", length: 84, feel: "longest", detail: "patient ensemble", step: 1.24, motif: [1, 2, 3, 2, 1, 0, 2, 0, 3, 1], accents: [[14.4, 2], [29.8, 0], [44.1, 3], [59.4, 1], [73.2, 2], [80.1, 0]] },
  { id: "petal", title: "Petal Parade", length: 52, feel: "medium-long", detail: "bright marching bloom", step: 0.96, motif: [0, 2, 0, 3, 1, 3, 1, 2], accents: [[10.4, 3], [20.8, 2], [33.7, 0], [46.1, 1]] },
  { id: "nightjar", title: "Nightjar Nectar", length: 74, feel: "long", detail: "sleepy late-song lift", step: 1.06, motif: [2, 3, 1, 0, 1, 2, 0, 3, 2, 1], accents: [[15.1, 0], [27.7, 3], [41.6, 1], [54.3, 2], [68.9, 0]] }
];

let selectedSongId = songs[0].id;
let difficultyId = "easy";
let activeOptions = { rush: false, dense: false, mist: false, mirror: false, mobile: false };
let highScores = {};
let chart = [];
let activeNotes = [];
let animationId = 0;
let startTime = 0;
let running = false;
let score = 0;
let combo = 0;
let bestCombo = 0;
let hits = 0;
let attempts = 0;
let muted = false;
let awaitingKeyLane = null;
let audioCtx;
let masterGain;

const endPadding = 4.5;
const readyPause = 0.4;

function safeLoad(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function safeSave(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    return false;
  }
  return true;
}

function selectedSong() {
  return songs.find(song => song.id === selectedSongId) || songs[0];
}

function baseDifficulty() {
  return difficulties[difficultyId] || difficulties.easy;
}

function activeOptionIds() {
  return Object.keys(activeOptions).filter(id => activeOptions[id] && id !== "mobile").sort();
}

function scoreMultiplier() {
  return activeOptionIds().reduce((total, id) => total * optionDefs[id].score, baseDifficulty().multiplier);
}

function difficulty() {
  const base = baseDifficulty();
  const tempoBoost = (activeOptions.rush ? 1.1 : 1) * (activeOptions.dense ? 1.03 : 1);
  const windowTrim = (activeOptions.rush ? 0.03 : 0) + (activeOptions.mist ? 0.06 : 0);
  return {
    ...base,
    tempo: base.tempo * tempoBoost,
    travel: Math.max(2.45, base.travel - (activeOptions.rush ? 0.35 : 0)),
    window: Math.max(0.28, base.window - windowTrim),
    perfect: Math.max(0.08, base.perfect - windowTrim * 0.3),
    good: Math.max(0.16, base.good - windowTrim * 0.45),
    multiplier: scoreMultiplier()
  };
}

function displayKey(key) {
  const names = { " ": "Space", arrowleft: "Left", arrowright: "Right", arrowup: "Up", arrowdown: "Down" };
  return names[key] || (key.length === 1 ? key.toUpperCase() : key);
}

function normalizeKey(event) {
  if (event.key === " ") return " ";
  return event.key.length === 1 ? event.key.toLowerCase() : event.key.toLowerCase();
}

function scoreKey() {
  const opts = activeOptionIds().join("+") || "clear";
  return `${selectedSongId}|${difficultyId}|${opts}`;
}

function optionSummary() {
  const labels = activeOptionIds().map(id => optionDefs[id].label);
  return labels.length ? labels.join(", ") : "Clear";
}

function makeSongPattern(song) {
  const notes = [];
  let t = 0;
  let i = 0;
  const denseStep = activeOptions.dense ? 5 : 7;
  while (t <= song.length) {
    let lane = song.motif[i % song.motif.length];
    if (activeOptions.mirror) lane = 3 - lane;
    notes.push([Number(t.toFixed(2)), lane]);
    if (i > 2 && i % denseStep === 3 && t + song.step * 0.52 < song.length) {
      let extraLane = song.motif[(i + 3) % song.motif.length];
      notes.push([Number((t + song.step * 0.52).toFixed(2)), activeOptions.mirror ? 3 - extraLane : extraLane]);
    }
    if (i > 5 && i % 11 === 0 && t + song.step * 0.76 < song.length) {
      let extraLane = song.motif[(i + 5) % song.motif.length];
      notes.push([Number((t + song.step * 0.76).toFixed(2)), activeOptions.mirror ? 3 - extraLane : extraLane]);
    }
    if (activeOptions.dense && i > 4 && i % 13 === 4 && t + song.step * 0.34 < song.length) {
      let extraLane = song.motif[(i + 1) % song.motif.length];
      notes.push([Number((t + song.step * 0.34).toFixed(2)), activeOptions.mirror ? 3 - extraLane : extraLane]);
    }
    t += song.step;
    i++;
  }
  song.accents.forEach(([time, lane]) => notes.push([time, activeOptions.mirror ? 3 - lane : lane]));
  return notes.sort((a, b) => a[0] - b[0]);
}

function renderSongSelect() {
  songList.innerHTML = songs.map(song => {
    const best = bestForSong(song.id);
    return `
      <button class="song-button${song.id === selectedSongId ? " active" : ""}" data-song="${song.id}" type="button">
        <strong>${song.title}</strong>
        <span>${song.feel} - ${song.length}s</span>
        <small>${song.detail}${best ? ` - best ${best.score.toLocaleString()}` : ""}</small>
      </button>
    `;
  }).join("");

  songList.querySelectorAll(".song-button").forEach(button => {
    button.addEventListener("click", () => {
      selectedSongId = button.dataset.song;
      saveSettings();
      renderSongSelect();
      updateSelectionMessage();
      renderScores();
      if (!running) resetGame(false);
    });
  });
}

function renderDifficultySelect() {
  difficultyList.innerHTML = Object.entries(difficulties).map(([id, item]) => `
    <button class="difficulty-button${id === difficultyId ? " active" : ""}" data-difficulty="${id}" type="button">
      <strong>${item.label}</strong>
      <small>${item.note}</small>
    </button>
  `).join("");

  difficultyList.querySelectorAll(".difficulty-button").forEach(button => {
    button.addEventListener("click", () => setDifficulty(button.dataset.difficulty, false));
  });
  syncDifficultyButtons();
}

function renderOptions() {
  optionList.innerHTML = Object.entries(optionDefs).map(([id, item]) => `
    <button class="option-button${activeOptions[id] ? " active" : ""}" data-option="${id}" type="button">
      <strong>${item.label}</strong>
      <small>${item.note}</small>
    </button>
  `).join("");

  optionList.querySelectorAll(".option-button").forEach(button => {
    button.addEventListener("click", () => {
      const id = button.dataset.option;
      activeOptions[id] = !activeOptions[id];
      document.body.classList.toggle("mobile-play", activeOptions.mobile);
      renderOptions();
      saveSettings();
      updateSelectionMessage();
      renderScores();
      if (running && id !== "mobile") resetGame(true);
      if (!running) resetGame(false);
    });
  });
}

function renderKeyGrid() {
  keyGrid.innerHTML = keys.map((key, lane) => `
    <button class="key-button${awaitingKeyLane === lane ? " active" : ""}" data-lane="${lane}" type="button">
      <strong>${laneNames[lane]}: ${displayKey(key)}</strong>
      <small>${awaitingKeyLane === lane ? "Press a new key" : "tap to remap"}</small>
    </button>
  `).join("");

  keyGrid.querySelectorAll(".key-button").forEach(button => {
    button.addEventListener("click", () => {
      awaitingKeyLane = Number(button.dataset.lane);
      keyHint.textContent = `Press a new key for ${laneNames[awaitingKeyLane]}.`;
      renderKeyGrid();
    });
  });
  updateKeyLabels();
}

function updateKeyLabels() {
  keys.forEach((key, lane) => {
    laneLabels[lane].textContent = displayKey(key);
    pads[lane].textContent = displayKey(key);
    bandKeys[lane].textContent = displayKey(key);
  });
}

function setDifficulty(nextDifficulty, restartRunning) {
  difficultyId = nextDifficulty;
  syncDifficultyButtons();
  renderDifficultySelect();
  saveSettings();
  updateSelectionMessage();
  renderScores();
  if (running && restartRunning) resetGame(true);
  if (!running) resetGame(false);
}

function syncDifficultyButtons() {
  topDifficultyButtons.forEach(button => {
    button.classList.toggle("active", button.dataset.difficulty === difficultyId);
  });
  difficultyList.querySelectorAll(".difficulty-button").forEach(button => {
    button.classList.toggle("active", button.dataset.difficulty === difficultyId);
  });
}

function updateSelectionMessage() {
  const song = selectedSong();
  const diff = baseDifficulty();
  if (!running) {
    messageEl.textContent = `${song.title} selected on ${diff.label}. Options: ${optionSummary()}.`;
  }
  selectedBest.innerHTML = selectedBestText();
}

function selectedBestText() {
  const record = highScores[scoreKey()];
  if (!record) return `<span>No score yet for this setup.</span><span>Multiplier <strong>${scoreMultiplier().toFixed(2)}x</strong></span>`;
  return `<span>Best <strong>${record.score.toLocaleString()}</strong></span><span>${record.accuracy}% garden</span><span>${record.combo} chain</span>`;
}

function bestForSong(songId) {
  return Object.entries(highScores)
    .filter(([key]) => key.startsWith(`${songId}|`))
    .map(([, record]) => record)
    .sort((a, b) => b.score - a.score)[0];
}

function renderScores() {
  const rows = Object.entries(highScores)
    .map(([key, record]) => ({ key, record }))
    .filter(({ key }) => key.startsWith(`${selectedSongId}|`))
    .sort((a, b) => b.record.score - a.record.score)
    .slice(0, 5);

  scoreboardRows.innerHTML = rows.length
    ? rows.map(({ key, record }) => {
        const [, diff, opts] = key.split("|");
        const diffLabel = difficulties[diff]?.label || diff;
        const optText = opts === "clear" ? "Clear" : opts.split("+").map(id => optionDefs[id]?.label || id).join(", ");
        return `<div class="score-row"><span>${diffLabel} - ${optText}</span><strong>${record.score.toLocaleString()}</strong></div>`;
      }).join("")
    : `<div class="score-row"><span>No scores for this song yet</span><strong>0</strong></div>`;
  selectedBest.innerHTML = selectedBestText();
}

function saveSettings() {
  safeSave(storageKey, { selectedSongId, difficultyId, activeOptions, keys });
}

function loadSettings() {
  const saved = safeLoad(storageKey, {});
  if (songs.some(song => song.id === saved.selectedSongId)) selectedSongId = saved.selectedSongId;
  if (difficulties[saved.difficultyId]) difficultyId = saved.difficultyId;
  if (saved.activeOptions) activeOptions = { ...activeOptions, ...saved.activeOptions };
  if (Array.isArray(saved.keys) && saved.keys.length === 4) keys = saved.keys.map(String);
  highScores = safeLoad(scoreStorageKey, {});
  document.body.classList.toggle("mobile-play", activeOptions.mobile);
}

function buildChart() {
  const song = selectedSong();
  const diff = difficulty();
  const source = makeSongPattern(song);
  chart = source
    .map(([time, lane], index) => ({
      time: time / diff.tempo + diff.travel + readyPause,
      lane,
      id: `${song.id}-${index}`,
      hit: false,
      missed: false,
      el: null
    }))
    .sort((a, b) => a.time - b.time);
}

function ensureAudio() {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  masterGain = audioCtx.createGain();
  masterGain.gain.value = muted ? 0 : 0.24;
  masterGain.connect(audioCtx.destination);
}

function playTone(lane, quality = "tap") {
  if (muted) return;
  ensureAudio();
  const now = audioCtx.currentTime;
  const freqs = [138, 246, 329.63, 196];
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const filter = audioCtx.createBiquadFilter();
  osc.type = lane === 0 ? "triangle" : lane === 2 ? "sine" : "sawtooth";
  osc.frequency.setValueAtTime(freqs[lane], now);
  if (lane === 1) osc.frequency.exponentialRampToValueAtTime(freqs[lane] * 1.12, now + 0.22);
  if (lane === 3) osc.frequency.exponentialRampToValueAtTime(freqs[lane] * 0.82, now + 0.52);
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(lane === 0 ? 520 : 920, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(quality === "miss" ? 0.04 : 0.16, now + 0.035);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + (lane === 3 ? 0.75 : 0.42));
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);
  osc.start(now);
  osc.stop(now + 0.82);
}

function makeNote(note) {
  const el = document.createElement("div");
  const center = 12.5 + note.lane * 25;
  const colors = laneColors[note.lane];
  el.className = "note";
  el.style.setProperty("--x", center + "%");
  el.style.setProperty("--y", "-80px");
  el.style.setProperty("--note1", colors[0]);
  el.style.setProperty("--note2", colors[1]);
  el.style.setProperty("--glow", colors[2]);
  el.style.setProperty("--tilt", `${[-12, 8, -7, 13][note.lane]}deg`);
  notesLayer.appendChild(el);
  note.el = el;
}

function resetGame(autoplay = false) {
  cancelAnimationFrame(animationId);
  notesLayer.innerHTML = "";
  buildChart();
  activeNotes = [];
  score = 0;
  combo = 0;
  bestCombo = 0;
  hits = 0;
  attempts = 0;
  running = false;
  updateStats();
  progressFill.style.width = "0%";
  updateSelectionMessage();
  if (autoplay) startGame();
}

function startGame() {
  ensureAudio();
  if (audioCtx.state === "suspended") audioCtx.resume();
  resetGame(false);
  startScreen.classList.add("hidden");
  running = true;
  startTime = performance.now() / 1000;
  messageEl.textContent = `${selectedSong().title}: ${difficulty().message} Score multiplier ${scoreMultiplier().toFixed(2)}x.`;
  loop();
}

function hitLineOffset() {
  return activeOptions.mobile ? 120 : 84;
}

function loop() {
  if (!running) return;
  const now = performance.now() / 1000 - startTime;
  const panelHeight = panel.clientHeight;
  const hitY = panelHeight - hitLineOffset();
  const lastTime = chart[chart.length - 1].time + endPadding;
  const travelTime = difficulty().travel;

  chart.forEach(note => {
    if (!note.el && now >= note.time - travelTime && !note.hit && !note.missed) {
      makeNote(note);
      activeNotes.push(note);
    }
  });

  activeNotes.forEach(note => {
    if (!note.el || note.hit) return;
    const progress = (now - (note.time - travelTime)) / travelTime;
    const y = -40 + progress * (hitY + 40);
    note.el.style.setProperty("--y", `${y}px`);
    if (now - note.time > difficulty().window && !note.missed) {
      note.missed = true;
      attempts++;
      combo = 0;
      showFeedback("A quiet miss");
      playTone(note.lane, "miss");
      note.el.remove();
      note.el = null;
      updateStats();
    }
  });

  activeNotes = activeNotes.filter(note => note.el && !note.missed && !note.hit);
  progressFill.style.width = `${Math.min(100, (now / lastTime) * 100)}%`;

  if (now > lastTime && activeNotes.length === 0) {
    finishSong();
    return;
  }
  animationId = requestAnimationFrame(loop);
}

function hitLane(lane) {
  pulsePad(lane);
  if (!running) {
    playTone(lane);
    return;
  }

  const now = performance.now() / 1000 - startTime;
  const candidates = chart
    .filter(note => note.lane === lane && note.el && !note.hit && !note.missed)
    .map(note => ({ note, diff: Math.abs(now - note.time) }))
    .sort((a, b) => a.diff - b.diff);

  const diffSettings = difficulty();
  if (!candidates.length || candidates[0].diff > diffSettings.window) {
    attempts++;
    combo = 0;
    showFeedback("Too early");
    playTone(lane, "miss");
    updateStats();
    return;
  }

  const { note, diff } = candidates[0];
  note.hit = true;
  attempts++;
  hits++;
  combo++;
  bestCombo = Math.max(bestCombo, combo);
  const baseValue = diff < diffSettings.perfect ? 120 : diff < diffSettings.good ? 90 : 60;
  score += Math.round((baseValue + Math.min(combo * 3, 90)) * diffSettings.multiplier);
  note.el.classList.add("hit");
  setTimeout(() => note.el && note.el.remove(), 260);
  playTone(lane, "tap");
  showFeedback(diff < diffSettings.perfect ? "Luminous" : diff < diffSettings.good ? "Soft bloom" : "Gentle");
  updateStats();
}

function showFeedback(text) {
  feedback.textContent = text;
  feedback.classList.add("show");
  clearTimeout(showFeedback.timer);
  showFeedback.timer = setTimeout(() => feedback.classList.remove("show"), 480);
}

function pulsePad(lane) {
  const pad = pads[lane];
  pad.classList.add("active");
  clearTimeout(pad.timer);
  pad.timer = setTimeout(() => pad.classList.remove("active"), 130);
}

function updateStats() {
  scoreEl.textContent = score.toLocaleString();
  comboEl.textContent = combo.toString();
  const acc = attempts ? Math.round((hits / attempts) * 100) : 100;
  accuracyEl.textContent = `${acc}%`;
}

function finishSong() {
  running = false;
  progressFill.style.width = "100%";
  const acc = attempts ? Math.round((hits / attempts) * 100) : 100;
  const key = scoreKey();
  const oldBest = highScores[key];
  const isBest = !oldBest || score > oldBest.score;
  if (isBest) {
    highScores[key] = {
      score,
      accuracy: acc,
      combo: bestCombo,
      song: selectedSong().title,
      difficulty: baseDifficulty().label,
      options: optionSummary(),
      date: new Date().toLocaleDateString()
    };
    safeSave(scoreStorageKey, highScores);
  }
  messageEl.textContent = `${selectedSong().title} rests. Glow ${score.toLocaleString()}, garden ${acc}%, best chain ${bestCombo}.${isBest ? " New high score." : ""}`;
  startScreen.classList.remove("hidden");
  startScreen.querySelector("h2").textContent = "Choose another garden song";
  startScreen.querySelector("p").textContent = "The band can replay this piece or try a harder setup.";
  startButton.textContent = "Start Song";
  renderScores();
  renderSongSelect();
}

document.addEventListener("keydown", event => {
  if (awaitingKeyLane !== null) {
    event.preventDefault();
    const nextKey = normalizeKey(event);
    const duplicateLane = keys.indexOf(nextKey);
    if (duplicateLane >= 0 && duplicateLane !== awaitingKeyLane) {
      keys[duplicateLane] = keys[awaitingKeyLane];
    }
    keys[awaitingKeyLane] = nextKey;
    keyHint.textContent = `${laneNames[awaitingKeyLane]} set to ${displayKey(nextKey)}.`;
    awaitingKeyLane = null;
    saveSettings();
    renderKeyGrid();
    return;
  }

  const pressed = normalizeKey(event);
  const lane = keys.indexOf(pressed);
  if (lane >= 0) {
    event.preventDefault();
    hitLane(lane);
  }
  if ((event.key === " " || event.key === "Enter") && !running && !startScreen.classList.contains("hidden")) {
    event.preventDefault();
    startGame();
  }
});

pads.forEach(pad => {
  pad.addEventListener("pointerdown", event => {
    event.preventDefault();
    hitLane(Number(pad.dataset.lane));
  });
});

topDifficultyButtons.forEach(button => {
  button.addEventListener("click", () => {
    setDifficulty(button.dataset.difficulty, true);
  });
});

soundButton.addEventListener("click", () => {
  muted = !muted;
  soundButton.textContent = muted ? "Sound Off" : "Sound On";
  soundButton.setAttribute("aria-pressed", String(!muted));
  if (masterGain) masterGain.gain.value = muted ? 0 : 0.24;
});

restartButton.addEventListener("click", () => {
  startScreen.classList.add("hidden");
  resetGame(true);
});

startButton.addEventListener("click", startGame);
loadSettings();
renderSongSelect();
renderDifficultySelect();
renderOptions();
renderKeyGrid();
renderScores();
resetGame(false);
