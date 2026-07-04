import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const WORLD_SIZE = 72;
const PLAYER_SPEED = 11.5;
const SPRINT_SPEED = 19;
const AUTHOR_SPEED = 8.1;
const SHOT_SPEED = 28;
const SEALS_REQUIRED = 7;
const INITIAL_AUTHOR_COUNT = 3;
const FINAL_AUTHOR_COUNT = 7;
const MOATARO_SERVICE = {
  center: new THREE.Vector3(27, 0, 43),
  radius: 6.6,
  clerkSpot: new THREE.Vector3(27, 0, 31.5),
};
const MOATARO_LINES = [
  'そこに 3つのモアイ がおるじゃろう！\n好きなのを 1体 選ぶのじゃ。',
  'おすわりモアイおすすめです',
  'あなたが来るの待ってました',
];
const MOATARO_LINE_VOICES = [
  { text: 'そこに 3つのモアイ がおるじゃろう！\n好きなのを 1体 選ぶのじゃ。', src: './voice/moataro_starter_choice.m4a' },
  { text: 'おすわりモアイおすすめです', src: './voice/osuwariosusume.m4a' },
  { text: 'あなたが来るの待ってました', src: './voice/waitingu.m4a' },
];
const VOICE_FILES = {
  thanks: './voice/thankyu.m4a',
  yogurtStolen: './voice/myyogrut.m4a',
  bad: './voice/mazui.m4a',
  yogurtTime: './voice/kanpai.m4a',
};
const STAGES = [
  {
    name: 'STAGE 1: OPEN WORLD',
    mission: 'ヨーグルトを集めろ',
    seals: 7,
    start: [0, 0, 28],
    gate: [0, 0, 58],
    initialAuthors: 3,
    authorBoost: 0,
    sky: 0x7fc6df,
    fogNear: 34,
    fogFar: 105,
    ground: 0x5ea760,
    grid: 0xd4f7b1,
    grid2: 0x7fbf72,
    road: 0xcabf94,
  },
  {
    name: 'STAGE 2: NIGHT RUINS',
    mission: '夜の遺跡のヨーグルトを集めろ',
    seals: 6,
    start: [0, 0, -54],
    gate: [0, 0, 60],
    initialAuthors: 5,
    authorBoost: 1.75,
    sky: 0x141a2a,
    fogNear: 20,
    fogFar: 82,
    ground: 0x273b34,
    grid: 0x6fffd8,
    grid2: 0x314b49,
    road: 0x58525e,
  },
  {
    name: 'STAGE 3: MAZE COURTYARD',
    mission: '迷路庭園のヨーグルトを集めろ',
    seals: 7,
    start: [0, 0, -58],
    gate: [0, 0, 61],
    initialAuthors: 5,
    authorBoost: 2.05,
    sky: 0x0b1216,
    fogNear: 16,
    fogFar: 76,
    ground: 0x34423c,
    grid: 0x8ad7ff,
    grid2: 0x25303a,
    road: 0x4b5260,
  },
  {
    name: 'STAGE 4: HMJ MARCHE HALL',
    mission: '会場ブースのヨーグルトを集めろ',
    seals: 1,
    start: [0, 0, -58],
    gate: [0, 0, 61],
    initialAuthors: 5,
    authorBoost: 1.85,
    sky: 0xeaf7ff,
    fogNear: 42,
    fogFar: 118,
    ground: 0xd8dde2,
    grid: 0x77f4ff,
    grid2: 0xb7c6cc,
    road: 0xf6f2e8,
  },
];

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x7fc6df);
scene.fog = new THREE.Fog(0x7fc6df, 34, 105);

const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 180);
const IS_MOBILE_DEVICE = window.matchMedia('(pointer: coarse)').matches || Math.min(window.innerWidth, window.innerHeight) < 720;
const renderer = new THREE.WebGLRenderer({ antialias: !IS_MOBILE_DEVICE, powerPreference: 'high-performance' });
renderer.setPixelRatio(IS_MOBILE_DEVICE ? 1 : Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = !IS_MOBILE_DEVICE;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const clock = new THREE.Clock();
const textureLoader = new THREE.TextureLoader();
const userTexture = textureLoader.load('./user.png');
userTexture.colorSpace = THREE.SRGBColorSpace;
const attackerTexture = textureLoader.load('./attacker.png');
attackerTexture.colorSpace = THREE.SRGBColorSpace;
const gltfLoader = new GLTFLoader();

const sun = new THREE.DirectionalLight(0xffffff, 2.4);
sun.position.set(18, 25, 12);
sun.castShadow = !IS_MOBILE_DEVICE;
sun.shadow.mapSize.set(IS_MOBILE_DEVICE ? 512 : 2048, IS_MOBILE_DEVICE ? 512 : 2048);
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 80;
sun.shadow.camera.left = -55;
sun.shadow.camera.right = 55;
sun.shadow.camera.top = 55;
sun.shadow.camera.bottom = -55;
scene.add(sun);
const hemiLight = new THREE.HemisphereLight(0xbfeaff, 0x486c44, 1.7);
scene.add(hemiLight);

const world = new THREE.Group();
scene.add(world);

const moai = new THREE.Group();
scene.add(moai);
const blueHelper = new THREE.Group();
blueHelper.visible = false;
scene.add(blueHelper);

const author = new THREE.Group();
scene.add(author);
const escapeGate = new THREE.Group();
scene.add(escapeGate);

const keys = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  fire: false,
  help: false,
  lookLeft: false,
  lookRight: false,
};

let gameStarted = false;
let gameOver = false;
let gamePaused = false;
let victory = false;
let playerHealth = 100;
let authorHealth = 140;
let energy = 100;
let crystals = 0;
let totalSeals = 0;
let stolenYogurts = 0;
let currentStage = 4;
let fireCooldown = 0;
let authorFireCooldown = 1.4;
let authorTauntTimer = 0;
let screenShake = 0;
let escapeOpen = false;
let finalSwarmActive = false;
let panicTimer = 0;
let stageTransitionTimer = 0;
let teleportCooldown = 0;
let teleportAlertTimer = 0;
let helperTimer = 0;
let helperCooldown = 0;
let helperTurnTimer = 0;
let playerHitCooldown = 0;
let moataroServiceActive = false;
let moataroServiceLine = MOATARO_LINES[0];
let moataroServiceVoiceSrc = MOATARO_LINE_VOICES[0].src;
let moataroSpeechTimer = 0;
let moataroPromptDismissed = false;
let moataroMoaiPurchased = false;
let chosenMoaiType = 1;
let tempSelectedMoaiType = 1;
let moataroInvincibleTimer = 0;
let moataroClerkSafeTimer = 0;
let darkMarketNpc = null;
let inDarkMarketZone = false;
let darkMarketPointLight = null;
let darkMarketBgmInterval = null;
let darkMarketBgmSeq = 0;
let darkMarketDialogueShown = false;
let hudUpdateTimer = 0;
let speechPrimed = false;
let cachedJapaneseVoice = null;
let cameraYaw = Math.PI;
let cameraPitch = 0.46;
let cameraDistance = 10.5;
let pointerLookActive = false;
let lastPointerX = 0;
let lastPointerY = 0;
const mobileMove = {
  active: false,
  pointerId: null,
  originX: 0,
  originY: 0,
  x: 0,
  z: 0,
};
const playerVelocity = new THREE.Vector3();
const helperVelocity = new THREE.Vector3();

const playerShots = [];
const authorShots = [];
const pickupCrystals = [];
const props = [];
const authors = [];
const safetyZones = [];
const teleportRings = [];
const obstacleColliders = [];
const contactEffects = [];
const celeryCustomers = [];
const regularCustomers = [];
const petMoai = new THREE.Group();
petMoai.visible = false;
scene.add(petMoai);
let guideArrow = null;
const starterMoais = [];
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function createGuideArrow() {
  const group = new THREE.Group();
  const coneGeo = new THREE.ConeGeometry(0.35, 0.9, 5);
  coneGeo.rotateX(Math.PI / 2);
  const coneMat = new THREE.MeshStandardMaterial({
    color: 0x77f4ff,
    emissive: 0x2ce8ff,
    emissiveIntensity: 1.8,
    roughness: 0.1,
  });
  const cone = new THREE.Mesh(coneGeo, coneMat);
  cone.position.set(0, 0, 0.4);
  group.add(cone);

  const tailGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.6, 5);
  tailGeo.rotateX(Math.PI / 2);
  const tail = new THREE.Mesh(tailGeo, coneMat);
  tail.position.set(0, 0, -0.3);
  group.add(tail);

  group.visible = false;
  scene.add(group);
  return group;
}

const hud = {
  hint: document.getElementById('ui-text'),
  start: document.getElementById('start-screen'),
  fire: document.getElementById('btn-fire'),
  help: document.getElementById('btn-help'),
  shop: document.getElementById('shop-dialog'),
  shopLine: document.getElementById('shop-line'),
  buyMoai1: document.getElementById('btn-buy-moai-1'),
  buyMoai2: document.getElementById('btn-buy-moai-2'),
  buyMoai3: document.getElementById('btn-buy-moai-3'),
  skipMoai: document.getElementById('btn-skip-moai'),
  replayLine: document.getElementById('btn-replay-line'),
  viewCatalog: document.getElementById('btn-view-catalog'),
  catalogOverlay: document.getElementById('catalog-overlay'),
  catalogFrame: document.getElementById('catalog-frame'),
  catalogClose: document.getElementById('catalog-close'),
  mobileStick: document.getElementById('mobile-stick'),
  confirmDialog: document.getElementById('confirm-dialog'),
  confirmTitle: document.getElementById('confirm-title'),
  confirmImg: document.getElementById('confirm-img'),
  confirmYes: document.getElementById('btn-confirm-yes'),
  confirmNo: document.getElementById('btn-confirm-no'),
  confirmDetail: document.getElementById('btn-confirm-detail'),
  confirmNoLabel: document.getElementById('confirm-no'),
  confirmType1: document.getElementById('confirm-type1'),
  confirmType2: document.getElementById('confirm-type2'),
  confirmCategory: document.getElementById('confirm-category'),
  confirmDesc: document.getElementById('confirm-desc'),
  serviceMenu: document.getElementById('moataro-service-menu'),
  viewCatalogFloating: document.getElementById('btn-view-catalog-floating'),
  rivalDialog: document.getElementById('rival-dialog'),
};

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let userVoiceBuffer = null;
let bgmTimer = null;
let bgmStep = 0;
let bgmRunning = false;
let bgmGain = null;
let bgmMode = 'menu';
let yogurtTimeVoiceCooldown = 0;
const recordedVoiceBuffers = new Map();
const recordedVoicePromises = new Map();
const bgmThemes = [
  {
    bass: [55, 55, 65.41, 55, 73.42, 65.41, 49, 55],
    lead: [220, 0, 246.94, 0, 261.63, 0, 196, 0, 174.61, 0, 196, 0, 246.94, 0, 220, 0],
    harmony: [110, 130.81, 146.83, 130.81, 98, 110, 123.47, 110],
    drumEvery: 4,
    baseInterval: 224,
    leadType: 'triangle',
  },
  {
    bass: [41.2, 41.2, 49, 43.65, 55, 49, 36.71, 41.2],
    lead: [164.81, 0, 174.61, 0, 196, 0, 146.83, 0, 130.81, 0, 146.83, 0, 174.61, 0, 164.81, 0],
    harmony: [82.41, 98, 110, 98, 73.42, 82.41, 92.5, 82.41],
    drumEvery: 3,
    baseInterval: 238,
    leadType: 'sawtooth',
  },
  {
    bass: [36.71, 43.65, 36.71, 49, 55, 49, 43.65, 36.71],
    lead: [146.83, 0, 164.81, 0, 174.61, 0, 130.81, 0, 123.47, 0, 130.81, 0, 164.81, 0, 146.83, 0],
    harmony: [73.42, 87.31, 98, 87.31, 65.41, 73.42, 82.41, 73.42],
    drumEvery: 3,
    baseInterval: 248,
    leadType: 'triangle',
  },
  {
    bass: [65.41, 65.41, 73.42, 82.41, 98, 82.41, 73.42, 65.41],
    lead: [261.63, 293.66, 329.63, 0, 392, 329.63, 293.66, 0, 349.23, 392, 440, 0, 329.63, 293.66, 261.63, 0],
    harmony: [130.81, 146.83, 164.81, 196, 164.81, 146.83, 130.81, 146.83],
    drumEvery: 4,
    baseInterval: 214,
    leadType: 'square',
  },
];

const pokemonRivalTheme = {
  bass: [110, 55, 110, 55, 130.81, 65.41, 146.83, 73.42, 164.81, 82.41, 164.81, 82.41, 196.00, 98.00, 220.00, 110.00],
  lead: [440, 523.25, 587.33, 659.25, 783.99, 659.25, 783.99, 880.00, 1046.50, 880.00, 783.99, 659.25, 587.33, 523.25, 493.88, 440.00],
  harmony: [220, 261.63, 293.66, 329.63, 392.00, 329.63, 392.00, 440.00, 523.25, 440.00, 392.00, 329.63, 293.66, 261.63, 246.94, 220.00],
  drumEvery: 2,
  baseInterval: 105, // Super fast tempo for high tension!
  leadType: 'square', // Classic NES/Gameboy square wave
};

if ('speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    cachedJapaneseVoice = null;
    getJapaneseVoice();
  };
}

fetch('./uservoice.m4a')
  .then((res) => res.arrayBuffer())
  .then((buffer) => audioCtx.decodeAudioData(buffer))
  .then((buffer) => {
    userVoiceBuffer = buffer;
  })
  .catch(() => {});

function createFallbackMoai() {
  const stone = new THREE.MeshStandardMaterial({
    color: 0x8f9690,
    roughness: 0.82,
    metalness: 0.12,
  });
  const dark = new THREE.MeshStandardMaterial({ color: 0x252b2b, roughness: 0.8 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.1, 1.1), stone);
  body.position.y = 1.25;
  body.castShadow = true;
  moai.add(body);

  const nose = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.72, 0.55), stone);
  nose.position.set(0, 1.47, -0.72);
  nose.castShadow = true;
  moai.add(nose);

  const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.1, 0.04), dark);
  eyeL.position.set(-0.32, 1.82, -0.58);
  moai.add(eyeL);
  const eyeR = eyeL.clone();
  eyeR.position.x = 0.32;
  moai.add(eyeR);

  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.7, 0.45), stone);
  legL.position.set(-0.36, 0.35, 0);
  legL.castShadow = true;
  moai.add(legL);
  const legR = legL.clone();
  legR.position.x = 0.36;
  moai.add(legR);
}

function createBlueHelperModel() {
  while (blueHelper.children.length) blueHelper.remove(blueHelper.children[0]);
  const blue = new THREE.MeshStandardMaterial({
    color: 0x4ab7ff,
    emissive: 0x126cff,
    emissiveIntensity: 0.42,
    roughness: 0.62,
    metalness: 0.18,
  });
  const dark = new THREE.MeshStandardMaterial({ color: 0x071829, emissive: 0x0b5dff, emissiveIntensity: 0.35 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(1.25, 2, 1), blue);
  body.position.y = 1.15;
  body.castShadow = true;
  blueHelper.add(body);

  const nose = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.65, 0.5), blue);
  nose.position.set(0, 1.38, -0.62);
  nose.castShadow = true;
  blueHelper.add(nose);

  const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.09, 0.04), dark);
  eyeL.position.set(-0.28, 1.72, -0.54);
  blueHelper.add(eyeL);
  const eyeR = eyeL.clone();
  eyeR.position.x = 0.28;
  blueHelper.add(eyeR);

  blueHelper.add(createBlueHelperHalo());
}

function createPetMoaiModel() {
  while (petMoai.children.length) petMoai.remove(petMoai.children[0]);
  const texture = textureLoader.load('./moai_shot.png');
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.flipY = true;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
  }));
  sprite.position.y = 1.05;
  sprite.scale.set(1.85, 1.85, 1);
  sprite.userData.faceCamera = true;
  petMoai.add(sprite);

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.85, 24),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.18, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.04;
  petMoai.add(shadow);
}

function createBlueHelperHalo() {
  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(1.55, 0.07, 8, 36),
    new THREE.MeshStandardMaterial({ color: 0x77f4ff, emissive: 0x2ce8ff, emissiveIntensity: 1.2, roughness: 0.2 })
  );
  halo.rotation.x = Math.PI / 2;
  halo.position.y = 0.12;
  return halo;
}

function applyBlueHelperGlbModel(sourceModel) {
  while (blueHelper.children.length) blueHelper.remove(blueHelper.children[0]);
  const helperModel = sourceModel.clone(true);
  helperModel.scale.setScalar(1.35);
  helperModel.rotation.y = -Math.PI / 2;
  helperModel.traverse((child) => {
    if (!child.isMesh) return;
    child.castShadow = true;
    child.receiveShadow = true;
    child.material = new THREE.MeshStandardMaterial({
      color: 0x4ab7ff,
      emissive: 0x0d6dff,
      emissiveIntensity: 0.42,
      roughness: 0.58,
      metalness: 0.18,
      map: child.material?.map || null,
    });
  });
  blueHelper.add(helperModel);
  blueHelper.add(createBlueHelperHalo());
}

function loadMoaiModel() {
  createFallbackMoai();
  gltfLoader.load(
    './moai.glb',
    (gltf) => {
      while (moai.children.length) moai.remove(moai.children[0]);
      const model = gltf.scene;
      model.scale.setScalar(1.35);
      model.rotation.y = -Math.PI / 2;
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      moai.add(model);
      applyBlueHelperGlbModel(model);
    },
    undefined,
    () => {}
  );
}

function createAuthor() {
  const spriteMat = new THREE.MeshStandardMaterial({
    map: userTexture,
    transparent: true,
    side: THREE.DoubleSide,
    roughness: 0.55,
  });
  const sprite = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 4.2), spriteMat);
  sprite.position.y = 2.1;
  sprite.castShadow = true;
  author.add(sprite);

  const ringMat = new THREE.MeshStandardMaterial({
    color: 0xff5f45,
    emissive: 0x8a1200,
    emissiveIntensity: 0.7,
    roughness: 0.45,
  });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.85, 0.08, 8, 36), ringMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.12;
  author.add(ring);

  authors.push(author);
  for (let i = 1; i < FINAL_AUTHOR_COUNT; i++) {
    const clone = author.clone(true);
    const clonedSprite = clone.children[0];
    if (clonedSprite && clonedSprite.material) {
      clonedSprite.material = clonedSprite.material.clone();
      clonedSprite.material.map = userTexture; // Start as user.png
      clonedSprite.material.needsUpdate = true;
    }
    scene.add(clone);
    authors.push(clone);
  }
  authors.forEach((enemy, index) => {
    enemy.userData.ai = createAuthorBrain(index);
  });
  resetAuthorPositions();
}

function createAuthorBrain(index) {
  const roles = ['direct', 'leftFlank', 'rightFlank', 'ambush', 'gateCut', 'wideLeft', 'rearPush'];
  return {
    role: roles[index % roles.length],
    phase: index * 1.73,
    speedBias: THREE.MathUtils.lerp(-0.25, 0.65, (index % FINAL_AUTHOR_COUNT) / Math.max(1, FINAL_AUTHOR_COUNT - 1)),
    prediction: 0.25 + (index % 4) * 0.18,
    orbit: 5.5 + index * 1.15,
    active: index < INITIAL_AUTHOR_COUNT,
  };
}

function createTextSprite(text, color = '#ffffff', fontSize = 46) {
  const texture = createTextTexture(text, color, fontSize);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }));
  sprite.scale.set(5.6, 1.4, 1);
  return sprite;
}

function createTextTexture(text, color = '#ffffff', fontSize = 46) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(0,0,0,0.68)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#77f4ff';
  ctx.lineWidth = 7;
  ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);
  ctx.fillStyle = color;
  ctx.font = `bold ${fontSize}px DotGothic16, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  const lines = text.split('\n');
  if (lines.length === 1) {
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  } else {
    const lineHeight = fontSize + 10;
    const startY = (canvas.height / 2) - (lineHeight * (lines.length - 1) / 2);
    lines.forEach((line, i) => {
      ctx.fillText(line, canvas.width / 2, startY + i * lineHeight);
    });
  }
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function setTextSprite(sprite, text, color = '#ffffff', fontSize = 46) {
  if (!sprite?.material) return;
  sprite.material.map?.dispose?.();
  sprite.material.map = createTextTexture(text, color, fontSize);
  sprite.material.needsUpdate = true;
}

function setupAuthorYogurtVisual(enemy) {
  if (enemy.userData.yogurtIcon) return;
  const yogurtTexture = textureLoader.load('./yogurt.png');
  yogurtTexture.flipY = true;
  const icon = new THREE.Sprite(new THREE.SpriteMaterial({
    map: yogurtTexture,
    transparent: true,
    depthWrite: false,
  }));
  icon.position.set(0, 5.15, 0);
  icon.scale.set(1.25, 1.25, 1);
  icon.visible = false;
  enemy.add(icon);

  const label = createTextSprite('ヨーグルトタイム', '#fff6bf');
  label.position.set(0, 6.45, 0);
  label.visible = false;
  enemy.add(label);

  const downLabel = createTextSprite('まずい！', '#d9ff8a');
  downLabel.position.set(0, 5.85, 0);
  downLabel.visible = false;
  enemy.add(downLabel);

  const serviceLabel = createTextSprite(MOATARO_LINES[0], '#fff6cf', 24);
  serviceLabel.position.set(0, 5.65, 0);
  serviceLabel.scale.set(4.6, 1.08, 1);
  serviceLabel.visible = false;
  enemy.add(serviceLabel);

  enemy.userData.yogurtIcon = icon;
  enemy.userData.yogurtLabel = label;
  enemy.userData.downLabel = downLabel;
  enemy.userData.serviceLabel = serviceLabel;
}

function resetAuthorYogurtState(enemy, index) {
  setupAuthorYogurtVisual(enemy);
  const hasYogurt = currentStage === 4 && index % 2 === 0;
  enemy.userData.hasYogurt = hasYogurt;
  enemy.userData.yogurtTime = 0;
  enemy.userData.yogurtCooldown = THREE.MathUtils.randFloat(2.5, 7.5) + index * 0.8;
  enemy.userData.downTimer = 0;
  enemy.userData.yogurtIcon.visible = hasYogurt;
  enemy.userData.yogurtLabel.visible = false;
  enemy.userData.downLabel.visible = false;
  enemy.userData.serviceLabel.visible = false;
}

function playYogurtStolenVoice() {
  blip(260, 0.08, 0.09, 'sawtooth');
  setTimeout(() => blip(190, 0.12, 0.1, 'sawtooth'), 80);
  if (!playRecordedVoice(VOICE_FILES.yogurtStolen)) {
    speakText('俺のヨーグルトが！！', { rate: 1.08, pitch: 0.78, volume: 0.95 });
  }
}

function getStageConfig() {
  return STAGES[currentStage - 1] || STAGES[0];
}

function getSealsRequired() {
  return getStageConfig().seals;
}

function canOpenEscapeGate() {
  return crystals >= getSealsRequired();
}

function getGroundHeight(x, z) {
  return 0;
}

function setEntityGroundHeight(entity) {
  entity.position.y = getGroundHeight(entity.position.x, entity.position.z);
}

function createWorld() {
  const config = getStageConfig();
  while (world.children.length) world.remove(world.children[0]);
  while (escapeGate.children.length) escapeGate.remove(escapeGate.children[0]);
  props.length = 0;
  safetyZones.length = 0;
  pickupCrystals.length = 0;
  teleportRings.length = 0;
  obstacleColliders.length = 0;
  contactEffects.length = 0;
  celeryCustomers.length = 0;
  regularCustomers.length = 0;
  scene.background = new THREE.Color(config.sky);
  scene.fog = new THREE.Fog(config.sky, config.fogNear, config.fogFar);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(170, 170, 60, 60),
    new THREE.MeshStandardMaterial({ color: config.ground, roughness: 0.95 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  world.add(ground);

  const grid = new THREE.GridHelper(160, 40, config.grid, config.grid2);
  grid.position.y = 0.02;
  grid.material.opacity = currentStage === 2 ? 0.24 : 0.18;
  grid.material.transparent = true;
  world.add(grid);

  const roadMat = new THREE.MeshStandardMaterial({ color: config.road, roughness: 0.9 });
  const roadA = new THREE.Mesh(new THREE.BoxGeometry(8, 0.04, 150), roadMat);
  roadA.receiveShadow = true;
  world.add(roadA);
  const roadB = new THREE.Mesh(new THREE.BoxGeometry(150, 0.045, 7), roadMat);
  roadB.receiveShadow = true;
  world.add(roadB);

  if (currentStage === 1) {
    addLandmark(-24, -18, 0x50b6df, 'atelier');
    addLandmark(25, 18, 0xf0b84d, 'forge');
    addLandmark(-28, 25, 0x96d56a, 'garden');
    addLandmark(24, -26, 0xdf6d63, 'arena');
    addSafetyZone(-24, -18, 7.4);
    addSafetyZone(25, 18, 7.4);
    addSafetyZone(-28, 25, 7.4);
  } else if (currentStage === 2) {
    addNightSkyDetails();
    addLandmark(-32, -28, 0x6be7ff, 'moon-tower');
    addLandmark(34, -12, 0xa878ff, 'ruin-core');
    addLandmark(-18, 26, 0xff5f7e, 'red-altar');
    addSafetyZone(-32, -28, 6.2);
    addSafetyZone(34, -12, 5.8);
    addRuinWall(-18, -4, 24, 3.2);
    addRuinWall(18, 14, 24, 3.2);
    addRuinWall(-42, 18, 4, 25);
    addRuinWall(43, -22, 4, 28);
    addRuinWall(0, 36, 36, 3.2);
    addAncientRunes();
    addMistColumns();
  } else if (currentStage === 3) {
    addStageThreeStructures();
  } else {
    addMarketStageStructures();
  }
  createEscapeGate();
  createDarkMarket();

  const propCount = currentStage === 2 ? 30 : currentStage === 3 ? 42 : currentStage === 4 ? (IS_MOBILE_DEVICE ? 6 : 18) : 95;
  for (let i = 0; i < propCount; i++) {
    const x = THREE.MathUtils.randFloatSpread(WORLD_SIZE * 1.55);
    const z = THREE.MathUtils.randFloatSpread(WORLD_SIZE * 1.55);
    if (Math.abs(x) < 6 || Math.abs(z) < 6) continue;
    const height = THREE.MathUtils.randFloat(1.6, 6.5);
    const bottomRadius = THREE.MathUtils.randFloat(0.55, 1.25);
    const topRadius = THREE.MathUtils.randFloat(0.45, 1.1);
    const rock = new THREE.Mesh(
      new THREE.CylinderGeometry(topRadius, bottomRadius, height, 6),
      new THREE.MeshStandardMaterial({
        color: currentStage === 2
          ? new THREE.Color().setHSL(0.58, 0.22, THREE.MathUtils.randFloat(0.22, 0.38))
          : currentStage === 3
            ? new THREE.Color().setHSL(0.53, 0.16, THREE.MathUtils.randFloat(0.3, 0.44))
          : new THREE.Color().setHSL(0.08, 0.25, THREE.MathUtils.randFloat(0.45, 0.62)),
        roughness: 0.88,
        emissive: currentStage === 2 ? 0x030a10 : currentStage === 3 ? 0x06151a : 0x000000,
        emissiveIntensity: currentStage === 2 ? 0.28 : currentStage === 3 ? 0.18 : 0,
      })
    );
    rock.position.set(x, getGroundHeight(x, z) + height / 2, z);
    rock.rotation.y = Math.random() * Math.PI;
    rock.castShadow = true;
    rock.receiveShadow = true;
    world.add(rock);
    props.push(rock);
    addCircleCollider(x, z, Math.max(topRadius, bottomRadius) + (currentStage === 2 ? 0.35 : 0.5));
  }

  placeStageCrystals();
}

function addNightSkyDetails() {
  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(7.5, 32, 18),
    new THREE.MeshBasicMaterial({ color: 0xd9ecff })
  );
  moon.position.set(-58, 42, -70);
  moon.userData.slowSpin = 0.02;
  world.add(moon);
  props.push(moon);

  const halo = new THREE.Mesh(
    new THREE.RingGeometry(8.4, 12.5, 48),
    new THREE.MeshBasicMaterial({
      color: 0x8ad7ff,
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  halo.position.copy(moon.position);
  halo.lookAt(camera.position);
  halo.userData.faceCamera = true;
  world.add(halo);
  props.push(halo);

  const moonLight = new THREE.PointLight(0x8fd8ff, 2.7, 120, 1.6);
  moonLight.position.set(-38, 22, -42);
  world.add(moonLight);
}

function addAncientRunes() {
  const runeColors = [0x61f6ff, 0xb184ff, 0xff5f7e, 0x9dffbf];
  for (let i = 0; i < 18; i++) {
    const angle = (i / 18) * Math.PI * 2;
    const radius = 11 + (i % 3) * 10;
    const x = Math.cos(angle) * radius + Math.sin(i * 1.9) * 7;
    const z = Math.sin(angle) * radius + Math.cos(i * 1.3) * 5;
    const color = runeColors[i % runeColors.length];
    const rune = new THREE.Mesh(
      new THREE.RingGeometry(0.62 + (i % 2) * 0.25, 0.82 + (i % 2) * 0.25, 6),
      new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 1.1,
        transparent: true,
        opacity: 0.72,
        roughness: 0.25,
        side: THREE.DoubleSide,
      })
    );
    rune.rotation.x = -Math.PI / 2;
    rune.rotation.z = angle;
    rune.position.set(x, 0.13, z);
    rune.userData.pulse = 0.7 + i * 0.19;
    world.add(rune);
    props.push(rune);
  }

  addTeleportRing(0, 12, 0x61f6ff, 1);
  addTeleportRing(-46, -36, 0xb184ff, 2);
  addTeleportRing(46, 34, 0xff5f7e, 0);
}

function addTeleportRing(x, z, color, targetIndex) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.userData.teleportRing = true;
  group.userData.pulse = targetIndex * 0.75 + 0.2;
  group.userData.targetIndex = targetIndex;
  world.add(group);
  props.push(group);
  teleportRings.push(group);

  const baseMat = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 1.3,
    transparent: true,
    opacity: 0.72,
    roughness: 0.2,
    side: THREE.DoubleSide,
  });

  const outer = new THREE.Mesh(new THREE.TorusGeometry(6.2, 0.12, 10, 96), baseMat);
  outer.rotation.x = Math.PI / 2;
  outer.position.y = 0.18;
  outer.userData.pulse = group.userData.pulse;
  group.add(outer);

  const inner = new THREE.Mesh(new THREE.TorusGeometry(3.6, 0.08, 8, 72), baseMat.clone());
  inner.rotation.x = Math.PI / 2;
  inner.position.y = 0.2;
  inner.userData.pulse = group.userData.pulse + 0.4;
  group.add(inner);

  const pad = new THREE.Mesh(
    new THREE.CircleGeometry(5.8, 64),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.1,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  pad.rotation.x = -Math.PI / 2;
  pad.position.y = 0.12;
  pad.userData.pulse = group.userData.pulse + 0.8;
  group.add(pad);

  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(2.2, 4.8, 14, 32, 1, true),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.08,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  beam.position.y = 7;
  beam.userData.pulse = group.userData.pulse + 1.1;
  group.add(beam);
}

function addMistColumns() {
  const columns = [
    [-48, -44, 0x61f6ff],
    [46, -38, 0xb184ff],
    [-52, 42, 0xff5f7e],
    [50, 38, 0x9dffbf],
    [0, 12, 0x61f6ff],
  ];
  columns.forEach(([x, z, color], index) => {
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 2.4, 22, 24, 1, true),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.13,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    beam.position.set(x, 11, z);
    beam.userData.pulse = index * 0.8;
    world.add(beam);
    props.push(beam);

    const light = new THREE.PointLight(color, 1.1, 34, 2);
    light.position.set(x, 4, z);
    world.add(light);
  });
}

function addStageThreeStructures() {
  addNightSkyDetails();
  addLandmark(-35, -36, 0x4ab7ff, 'helper-shrine');
  addLandmark(36, 30, 0xffc857, 'maze-tower');
  addSafetyZone(-35, -36, 5.7);
  addSafetyZone(36, 30, 5.5);

  const glowMat = new THREE.MeshStandardMaterial({
    color: 0x4ab7ff,
    emissive: 0x127cff,
    emissiveIntensity: 1.05,
    roughness: 0.2,
  });

  const walls = [
    [0, -44, 54, 3.2],
    [-28, -22, 3.2, 34],
    [28, -18, 3.2, 28],
    [0, -4, 34, 3.2],
    [-42, 14, 28, 3.2],
    [42, 15, 28, 3.2],
    [-12, 26, 3.2, 30],
    [18, 39, 34, 3.2],
    [0, 56, 46, 3.2],
  ];
  walls.forEach(([x, z, width, depth]) => addStageBox(x, z, width, depth, 5.4, 0x182631, 0, true));

  const lowBlocks = [
    [-46, -4, 10, 10],
    [46, -38, 10, 10],
    [-48, 42, 12, 12],
    [48, 45, 10, 10],
    [0, 18, 10, 10],
  ];
  lowBlocks.forEach(([x, z, width, depth]) => addStageBox(x, z, width, depth, 1.2, 0x2d3a40, 0, true));

  [-48, -22, 22, 48].forEach((x, index) => {
    const marker = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 5.5, 12), glowMat);
    marker.position.set(x, 2.75, index % 2 ? 28 : -42);
    marker.castShadow = true;
    marker.userData.pulse = index * 0.5;
    world.add(marker);
    props.push(marker);
  });

  addMazePad(-18, -32, 0x4ab7ff);
  addMazePad(33, -2, 0xff5f7e);
  addMazePad(-31, 28, 0xffc857);
  addMazePad(6, 47, 0x9dffbf);
}

function addStageBox(x, z, width, depth, height, color, yOffset = 0, collides = true) {
  const box = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    new THREE.MeshStandardMaterial({ color, roughness: 0.86, emissive: 0x03080a, emissiveIntensity: 0.18 })
  );
  box.position.set(x, getGroundHeight(x, z) + yOffset + height / 2, z);
  box.castShadow = true;
  box.receiveShadow = true;
  world.add(box);
  props.push(box);
  if (collides) addBoxCollider(x, z, width + 0.4, depth + 0.4);
}

function addMazePad(x, z, color) {
  const pad = new THREE.Mesh(
    new THREE.CircleGeometry(5.4, 48),
    new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.55,
      transparent: true,
      opacity: 0.34,
      roughness: 0.28,
      side: THREE.DoubleSide,
    })
  );
  pad.rotation.x = -Math.PI / 2;
  pad.position.set(x, 0.09, z);
  pad.userData.pulse = Math.random() * 2;
  world.add(pad);
  props.push(pad);
}

function addMarketStageStructures() {
  addMarketHallShell();
  addLandmark(-42, -42, 0x77f4ff, 'info-counter');
  addLandmark(42, 38, 0xffc857, 'catalog-corner');
  addSafetyZone(-42, -42, 6.2);
  addSafetyZone(42, 38, 5.8);
  addSafetyZone(MOATARO_SERVICE.center.x, MOATARO_SERVICE.center.z, MOATARO_SERVICE.radius);

  addMarketSign(0, -64, 'HMJ GATE', 0x00d2ff);
  addMarketSign(-48, -8, 'CRAFT', 0xffc857);
  addMarketSign(48, 8, 'ACCESSORY', 0xff5f7e);
  addMarketSign(0, 52, 'KANAZAWA MOATARO', 0x77f4ff);

  const boothRows = [-36, -18, 0, 18, 36];
  const boothCols = [-45, -27, -9, 9, 27, 45];
  boothRows.forEach((z, row) => {
    boothCols.forEach((x, col) => {
      if ((row === 2 && Math.abs(x) < 12) || (col === 0 && z < -20) || (col === boothCols.length - 1 && z > 20)) return;
      const color = [0x77f4ff, 0xffc857, 0xff7aa8, 0x9dffbf][(row + col) % 4];
      addBooth(x, z, color, row, col);
    });
  });

  addAisleCarpet(0, -16, 9, 92, 0xf7f1df);
  addAisleCarpet(-28, 9, 44, 7, 0xeaf7ff);
  addAisleCarpet(28, 27, 44, 7, 0xeaf7ff);

  addMarketCounter(0, 8, 12, 5, 0x1f2d36);
  addMarketCounter(-54, 50, 12, 5, 0x32424c);
  addMarketCounter(54, -48, 12, 5, 0x32424c);
  addCeleryCustomers();
  addRegularCustomers();
}

function addRegularCustomers() {
  const customerFiles = ['./custmer1.png', './custmer2.png', './custmer3.png', './running_moai.png'];
  const materials = customerFiles.map((file) => {
    const texture = textureLoader.load(file);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.flipY = true;
    return new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
    });
  });
  const spots = [
    [-31, -52, 3.05, 0],
    [3, -47, 2.9, 1],
    [34, -49, 3.08, 2],
    [-64, 23, 2.88, 1],
    [-37, 8, 3.0, 2],
    [39, -9, 2.92, 0],
    [63, 36, 3.04, 1],
    [-11, 42, 2.96, 2],
    [29, 51, 2.9, 0],
    [-53, -31, 3.02, 2],
    [-21, -20, 2.86, 1],
    [22, -24, 3.14, 0],
    [50, -31, 2.98, 2],
    [-61, 49, 2.9, 0],
    [-29, 55, 3.08, 1],
    [6, 26, 2.88, 2],
    [46, 45, 3.04, 0],
    [58, -3, 2.94, 1],
    [58, -3, 2.94, 1],
    [-9, -57, 2.92, 0],
    [16, -58, 3.02, 2],
    [-44, -47, 2.86, 1],
    [57, -55, 3.08, 0],
    [-67, -18, 3.0, 2],
    [67, -19, 2.9, 1],
    [-5, 3, 3.06, 1],
    [18, 5, 2.86, 2],
    [-51, 18, 2.95, 0],
    [51, 22, 3.05, 2],
    [-66, 62, 2.9, 1],
    [-42, 64, 3.0, 0],
    [19, 64, 2.92, 2],
    [63, 61, 3.08, 1],
  ];
  const activeSpots = IS_MOBILE_DEVICE ? spots.slice(0, 12) : spots;
  activeSpots.forEach(([x, z, scale, materialIndex], index) => {
    const matIdx = index % materials.length; // Distributes 0, 1, 2, 3 (running_moai) evenly
    const customer = new THREE.Sprite(materials[matIdx].clone());
    customer.position.set(x, scale * 0.46 + Math.sin(index * 0.8) * 0.04, z);
    customer.scale.set(scale, scale, 1);
    customer.userData.faceCamera = true;
    customer.userData.baseY = customer.position.y;
    customer.userData.slowBob = 3.0 + index * 0.45;
    customer.userData.collisionRadius = scale * 0.3;
    customer.userData.phase = index * 1.27;
    customer.userData.walkAngle = index * 0.62 + 0.4;
    customer.userData.turnTimer = THREE.MathUtils.randFloat(1.0, 2.6);
    world.add(customer);
    props.push(customer);
    regularCustomers.push(customer);
  });
}

function addCeleryCustomers() {
  const celeryTexture = textureLoader.load('./obstacle_celery.png');
  celeryTexture.colorSpace = THREE.SRGBColorSpace;
  celeryTexture.flipY = true;
  const celeryMaterial = new THREE.SpriteMaterial({
    map: celeryTexture,
    transparent: true,
    depthWrite: false,
  });
  const spots = [
    [-14, -48, 3.0],
    [18, -43, 2.82],
    [-58, -6, 2.9],
    [58, 14, 3.02],
    [-20, 10, 2.86],
    [23, 29, 3.1],
    [-47, 47, 2.94],
    [9, 50, 2.82],
    [-42, -26, 3.0],
    [47, -45, 2.9],
    [-4, -12, 2.86],
    [51, 53, 3.08],
  ];
  const activeSpots = IS_MOBILE_DEVICE ? spots.slice(0, 5) : spots;
  activeSpots.forEach(([x, z, scale], index) => {
    const customer = new THREE.Sprite(celeryMaterial.clone());
    customer.position.set(x, scale * 0.46 + Math.sin(index) * 0.04, z);
    customer.scale.set(scale, scale, 1);
    customer.userData.faceCamera = true;
    customer.userData.baseY = customer.position.y;
    customer.userData.slowBob = index * 0.7;
    customer.userData.collisionRadius = scale * 0.34;
    customer.userData.phase = index * 1.83;
    customer.userData.walkAngle = index * 0.9;
    customer.userData.turnTimer = THREE.MathUtils.randFloat(0.6, 2.0);
    customer.userData.hitCooldown = 0;
    world.add(customer);
    props.push(customer);
    celeryCustomers.push(customer);
  });
}

function addMarketHallShell() {
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xf7f8f4, roughness: 0.78, metalness: 0.02 });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0xd7dee3, roughness: 0.68 });
  const ceilingMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.86,
    transparent: true,
    opacity: 0.42,
    side: THREE.DoubleSide,
  });

  const backWall = new THREE.Mesh(new THREE.BoxGeometry(156, 8.4, 1.2), wallMat);
  backWall.position.set(0, 4.2, -76);
  backWall.receiveShadow = true;
  world.add(backWall);
  props.push(backWall);

  const frontWall = backWall.clone();
  frontWall.position.z = 76;
  world.add(frontWall);
  props.push(frontWall);

  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(1.2, 8.4, 156), wallMat);
  leftWall.position.set(-76, 4.2, 0);
  leftWall.receiveShadow = true;
  world.add(leftWall);
  props.push(leftWall);

  const rightWall = leftWall.clone();
  rightWall.position.x = 76;
  world.add(rightWall);
  props.push(rightWall);

  for (let z = -62; z <= 62; z += 24) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(152, 0.28, 0.42), trimMat);
    beam.position.set(0, 8.95, z);
    beam.castShadow = true;
    world.add(beam);
    props.push(beam);
  }
  for (let x = -60; x <= 60; x += 24) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.28, 152), trimMat);
    beam.position.set(x, 8.9, 0);
    beam.castShadow = true;
    world.add(beam);
    props.push(beam);
  }

  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(156, 156, 1, 1), ceilingMat);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(0, 9.12, 0);
  world.add(ceiling);
  props.push(ceiling);

  const lightStep = IS_MOBILE_DEVICE ? 48 : 24;
  for (let x = -48; x <= 48; x += lightStep) {
    for (let z = -48; z <= 48; z += lightStep) {
      const lightPanel = new THREE.Mesh(
        new THREE.BoxGeometry(8, 0.08, 2.4),
        new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xf8fbff, emissiveIntensity: 0.88, roughness: 0.22 })
      );
      lightPanel.position.set(x, 8.72, z);
      world.add(lightPanel);
      props.push(lightPanel);
      if (!IS_MOBILE_DEVICE) {
        const lamp = new THREE.PointLight(0xffffff, 0.18, 30, 2.2);
        lamp.position.set(x, 7.6, z);
        world.add(lamp);
      }
    }
  }

  addMarketWallBanner(0, -75.32, 'HANDMADE MARCHE', 0xffc857);
  addMarketWallBanner(-75.32, -20, 'J-80  KANAZAWA MOATARO', 0x77f4ff, Math.PI / 2);
}

function addBooth(x, z, color, row, col) {
  const isMoataroBooth = row === 4 && col === 4;
  const isDarkMarketBooth = row === 4 && col === 0;
  if (isDarkMarketBooth) {
    createDarkMarketBoothStructure(x, z);
    return;
  }
  const boothColor = isMoataroBooth ? 0x77f4ff : color;
  const accent = [0xffc857, 0xff7aa8, 0x77f4ff, 0x9dffbf][(row * 2 + col) % 4];
  const table = new THREE.Mesh(
    new THREE.BoxGeometry(9.8, 1.2, 5.8),
    new THREE.MeshStandardMaterial({ color: isMoataroBooth ? 0xf8fbff : 0xffffff, roughness: 0.78 })
  );
  table.position.set(x, 0.6, z);
  table.castShadow = true;
  table.receiveShadow = true;
  world.add(table);
  props.push(table);
  addBoxCollider(x, z, 10.4, 6.4);

  const cloth = new THREE.Mesh(
    new THREE.BoxGeometry(10.2, 0.18, 6.2),
    new THREE.MeshStandardMaterial({ color: boothColor, emissive: boothColor, emissiveIntensity: isMoataroBooth ? 0.18 : 0.08, roughness: 0.72 })
  );
  cloth.position.set(x, 1.28, z);
  cloth.castShadow = true;
  world.add(cloth);
  props.push(cloth);

  const frontDrape = new THREE.Mesh(
    new THREE.BoxGeometry(10.4, 1.1, 0.18),
    new THREE.MeshStandardMaterial({ color: boothColor, emissive: boothColor, emissiveIntensity: isMoataroBooth ? 0.16 : 0.06, roughness: 0.82 })
  );
  frontDrape.position.set(x, 0.72, z + 3.18);
  frontDrape.castShadow = true;
  world.add(frontDrape);
  props.push(frontDrape);

  const sign = new THREE.Mesh(
    new THREE.BoxGeometry(8.5, 1.6, 0.22),
    isMoataroBooth
      ? createMultiLineSignMaterial(['J-80', 'Kanazawa Moataro'], 0x77f4ff)
      : createSignMaterial(['CERAMIC', 'TEXTILE', 'JEWELRY', 'ZAKKA'][(row + col) % 4], color)
  );
  sign.position.set(x, 3.0, z - 3.0);
  sign.castShadow = true;
  sign.userData.pulse = (row + col) * 0.14;
  world.add(sign);
  props.push(sign);

  if (!isMoataroBooth && IS_MOBILE_DEVICE) {
    addLightweightBoothGoods(x, z, accent, row, col);
  }

  if (!isMoataroBooth && !IS_MOBILE_DEVICE) {
    const shelf = new THREE.Mesh(
      new THREE.BoxGeometry(7.2, 0.22, 0.7),
      new THREE.MeshStandardMaterial({ color: 0xcaa77d, roughness: 0.62 })
    );
    shelf.position.set(x, 2.02, z - 1.15);
    shelf.castShadow = true;
    world.add(shelf);
    props.push(shelf);

    for (let i = 0; i < 5; i++) {
      const gx = x - 3.2 + i * 1.6;
      const gz = z + (i % 2 ? 0.7 : -0.05);
      const shape = (i + row + col) % 3;
      const geometry = shape === 0
        ? new THREE.CylinderGeometry(0.32, 0.42, 0.75, 12)
        : shape === 1
          ? new THREE.BoxGeometry(0.72, 0.58, 0.72)
          : new THREE.SphereGeometry(0.42, 14, 10);
      const goods = new THREE.Mesh(
        geometry,
        new THREE.MeshStandardMaterial({
          color: i % 2 ? accent : 0xf4f1db,
          emissive: i % 2 ? accent : 0x000000,
          emissiveIntensity: i % 2 ? 0.12 : 0,
          roughness: 0.5,
          metalness: shape === 2 ? 0.08 : 0,
        })
      );
      goods.position.set(gx, 1.85 + (shape === 2 ? 0.1 : 0), gz);
      goods.castShadow = true;
      world.add(goods);
      props.push(goods);
    }

    const priceTag = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.75, 0.08),
      new THREE.MeshStandardMaterial({ color: 0xfff3b0, roughness: 0.7, emissive: 0xffd36a, emissiveIntensity: 0.08 })
    );
    priceTag.position.set(x + 3.5, 1.78, z + 2.0);
    priceTag.rotation.x = -0.25;
    priceTag.castShadow = true;
    world.add(priceTag);
    props.push(priceTag);

    const lamp = new THREE.Mesh(
      new THREE.ConeGeometry(0.55, 0.8, 16),
      new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: accent, emissiveIntensity: 0.28, roughness: 0.35 })
    );
    lamp.position.set(x - 4.2, 2.55, z - 1.8);
    lamp.rotation.x = Math.PI;
    lamp.castShadow = true;
    world.add(lamp);
    props.push(lamp);

    if ((row + col) % 3 === 0) {
      const miniBanner = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 2.2, 1.6),
        new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 0.12, roughness: 0.74 })
      );
      miniBanner.position.set(x - 5.1, 2.2, z + 1.65);
      miniBanner.castShadow = true;
      world.add(miniBanner);
      props.push(miniBanner);
    }
  }

  if (isMoataroBooth) {
    addMoataroBoothDetails(x, z);
  }
}

function addLightweightBoothGoods(x, z, accent, row, col) {
  const goodsMat = new THREE.MeshBasicMaterial({
    color: (row + col) % 2 ? accent : 0xfff3b0,
    transparent: true,
    opacity: 0.88,
  });
  for (let i = 0; i < 3; i++) {
    const goods = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.62), goodsMat.clone());
    goods.position.set(x - 2.1 + i * 2.1, 1.66, z + (i % 2 ? 0.65 : -0.2));
    goods.rotation.x = -0.7;
    world.add(goods);
    props.push(goods);
  }
}

function addMoataroBoothDetails(x, z) {
  const shotTexture = textureLoader.load('./moai_shot.png');
  shotTexture.colorSpace = THREE.SRGBColorSpace;
  shotTexture.flipY = true;
  const shotMaterial = new THREE.SpriteMaterial({
    map: shotTexture,
    transparent: true,
    depthWrite: false,
  });

  const plinth = new THREE.Mesh(
    new THREE.BoxGeometry(8.6, 0.18, 3.9),
    new THREE.MeshStandardMaterial({ color: 0xf8fbff, roughness: 0.5, emissive: 0x77f4ff, emissiveIntensity: 0.05 })
  );
  plinth.position.set(x, 1.52, z + 0.15);
  plinth.castShadow = true;
  world.add(plinth);
  props.push(plinth);

  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 6; col++) {
      const item = new THREE.Sprite(shotMaterial.clone());
      item.position.set(
        x - 3.15 + col * 1.26,
        1.9 + row * 0.03,
        z - 1.1 + row * 0.72
      );
      const scale = 0.9 + (row === 0 ? 0.1 : 0);
      item.scale.set(scale, scale, 1);
      world.add(item);
      props.push(item);
    }
  }

  const displayStand = new THREE.Mesh(
    new THREE.BoxGeometry(8.6, 0.16, 0.38),
    new THREE.MeshStandardMaterial({ color: 0x13242c, roughness: 0.55, emissive: 0x77f4ff, emissiveIntensity: 0.08 })
  );
  displayStand.position.set(x, 1.67, z - 1.55);
  displayStand.castShadow = true;
  world.add(displayStand);
  props.push(displayStand);

  const counterLine = new THREE.Mesh(
    new THREE.BoxGeometry(8.4, 0.08, 0.08),
    new THREE.MeshStandardMaterial({ color: 0xffc857, emissive: 0xffc857, emissiveIntensity: 0.38, roughness: 0.32 })
  );
  counterLine.position.set(x, 1.72, z + 2.55);
  world.add(counterLine);
  props.push(counterLine);

  // Load Lure Moai texture
  const lureTexture = textureLoader.load('./moai_lure.png');
  lureTexture.colorSpace = THREE.SRGBColorSpace;
  lureTexture.flipY = true;
  const lureMaterial = new THREE.SpriteMaterial({
    map: lureTexture,
    transparent: true,
    depthWrite: false,
  });

  // Load Glasses Moai texture
  const glassesTexture = textureLoader.load('./moai_glasses.png');
  glassesTexture.colorSpace = THREE.SRGBColorSpace;
  glassesTexture.flipY = true;
  const glassesMaterial = new THREE.SpriteMaterial({
    map: glassesTexture,
    transparent: true,
    depthWrite: false,
  });

  // Create 3 display plates on the counter table (on top of the plinth, z + 1.45)
  const plateGeo = new THREE.CylinderGeometry(0.52, 0.58, 0.08, 16);
  const plateMat = new THREE.MeshStandardMaterial({ color: 0x112233, roughness: 0.4, emissive: 0x77f4ff, emissiveIntensity: 0.15 });
  
  [x - 1.8, x, x + 1.8].forEach((px) => {
    const plate = new THREE.Mesh(plateGeo, plateMat);
    plate.position.set(px, 1.62, z + 1.45);
    world.add(plate);
    props.push(plate);
  });

  // Create 3 floating bobbing starter Moai display sprites
  const starter1 = new THREE.Sprite(shotMaterial);
  starter1.position.set(x - 1.8, 2.12, z + 1.45);
  starter1.scale.set(1.15, 1.15, 1);
  starter1.userData.faceCamera = true;
  starter1.userData.slowBob = 0;
  starter1.userData.baseY = 2.12;
  starter1.userData.moaiType = 1;
  const label1 = createTextSprite('おすわりモアイ', '#ffbc69', 20);
  label1.position.set(x - 1.8, 2.85, z + 1.45);
  label1.visible = false;
  world.add(label1);
  props.push(label1);
  starter1.userData.label = label1;
  world.add(starter1);
  props.push(starter1);
  starterMoais.push(starter1);

  const starter2 = new THREE.Sprite(lureMaterial);
  starter2.position.set(x, 2.12, z + 1.45);
  starter2.scale.set(1.15, 1.15, 1);
  starter2.userData.faceCamera = true;
  starter2.userData.slowBob = 1.2;
  starter2.userData.baseY = 2.12;
  starter2.userData.moaiType = 2;
  const label2 = createTextSprite('ルアー立モアイ', '#ffbc69', 20);
  label2.position.set(x, 2.85, z + 1.45);
  label2.visible = false;
  world.add(label2);
  props.push(label2);
  starter2.userData.label = label2;
  world.add(starter2);
  props.push(starter2);
  starterMoais.push(starter2);

  const starter3 = new THREE.Sprite(glassesMaterial);
  starter3.position.set(x + 1.8, 2.12, z + 1.45);
  starter3.scale.set(1.15, 1.15, 1);
  starter3.userData.faceCamera = true;
  starter3.userData.slowBob = 2.4;
  starter3.userData.baseY = 2.12;
  starter3.userData.moaiType = 3;
  const label3 = createTextSprite('メガネ立モアイ', '#ffbc69', 20);
  label3.position.set(x + 1.8, 2.85, z + 1.45);
  label3.visible = false;
  world.add(label3);
  props.push(label3);
  starter3.userData.label = label3;
  world.add(starter3);
  props.push(starter3);
  starterMoais.push(starter3);
}

function addAisleCarpet(x, z, width, depth, color) {
  const carpet = new THREE.Mesh(
    new THREE.BoxGeometry(width, 0.05, depth),
    new THREE.MeshStandardMaterial({ color, roughness: 0.9 })
  );
  carpet.position.set(x, 0.055, z);
  carpet.receiveShadow = true;
  world.add(carpet);
  props.push(carpet);
}

function addMarketCounter(x, z, width, depth, color) {
  const counter = new THREE.Mesh(
    new THREE.BoxGeometry(width, 2.2, depth),
    new THREE.MeshStandardMaterial({ color, roughness: 0.7, emissive: 0x061018, emissiveIntensity: 0.1 })
  );
  counter.position.set(x, 1.1, z);
  counter.castShadow = true;
  counter.receiveShadow = true;
  world.add(counter);
  props.push(counter);
  addBoxCollider(x, z, width + 0.5, depth + 0.5);
}

function createSignMaterial(label, color) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#101a20';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = `#${color.toString(16).padStart(6, '0')}`;
  ctx.lineWidth = 8;
  ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 42px Outfit, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, canvas.width / 2, canvas.height / 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshStandardMaterial({
    map: texture,
    color: 0xffffff,
    emissive: color,
    emissiveIntensity: 0.18,
    roughness: 0.42,
  });
}

function createMultiLineSignMaterial(lines, color) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#07131a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = `#${color.toString(16).padStart(6, '0')}`;
  ctx.lineWidth = 8;
  ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
  ctx.fillStyle = '#fff6cf';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  lines.forEach((line, index) => {
    ctx.font = index === 0 ? 'bold 44px Outfit, sans-serif' : 'bold 34px Outfit, sans-serif';
    ctx.fillText(line, canvas.width / 2, 56 + index * 54);
  });
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshStandardMaterial({
    map: texture,
    color: 0xffffff,
    emissive: color,
    emissiveIntensity: 0.24,
    roughness: 0.4,
  });
}

function addMarketSign(x, z, label, color) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  world.add(group);

  const postL = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 5.8, 10), new THREE.MeshStandardMaterial({ color: 0x26343d, roughness: 0.55 }));
  postL.position.set(-4.8, 2.9, 0);
  postL.castShadow = true;
  group.add(postL);
  const postR = postL.clone();
  postR.position.x = 4.8;
  group.add(postR);

  const board = new THREE.Mesh(
    new THREE.BoxGeometry(11, 2.1, 0.35),
    createSignMaterial(label, color)
  );
  board.position.y = 5.2;
  board.castShadow = true;
  board.userData.pulse = x * 0.02 + z * 0.01;
  group.add(board);
  props.push(board);
}

function addMarketWallBanner(x, z, label, color, rotationY = 0) {
  const banner = new THREE.Mesh(
    new THREE.BoxGeometry(28, 3.2, 0.16),
    createSignMaterial(label, color)
  );
  banner.position.set(x, 4.9, z);
  banner.rotation.y = rotationY;
  banner.castShadow = true;
  world.add(banner);
  props.push(banner);
}

function addRuinWall(x, z, width, depth) {
  const wall = new THREE.Mesh(
    new THREE.BoxGeometry(width, 5.2, depth),
    new THREE.MeshStandardMaterial({
      color: 0x202734,
      emissive: 0x061320,
      emissiveIntensity: 0.35,
      roughness: 0.82,
    })
  );
  wall.position.set(x, 2.6, z);
  wall.castShadow = true;
  wall.receiveShadow = true;
  world.add(wall);
  props.push(wall);
  addBoxCollider(x, z, width + 0.35, depth + 0.35);

  if (currentStage === 2) {
    const lineCount = Math.max(2, Math.floor(Math.max(width, depth) / 7));
    for (let i = 0; i < lineCount; i++) {
      const groove = new THREE.Mesh(
        new THREE.BoxGeometry(width > depth ? 2.4 : 0.08, 0.08, width > depth ? 0.08 : 2.4),
        new THREE.MeshStandardMaterial({
          color: 0x61f6ff,
          emissive: 0x22d8ff,
          emissiveIntensity: 1.05,
          roughness: 0.2,
        })
      );
      const offset = (i - (lineCount - 1) / 2) * 5.5;
      groove.position.set(x + (width > depth ? offset : 0), 5.28, z + (width > depth ? 0 : offset));
      groove.userData.pulse = i * 0.37;
      world.add(groove);
      props.push(groove);
    }
  }
}

function addCircleCollider(x, z, radius) {
  obstacleColliders.push({ type: 'circle', x, z, radius });
}

function addBoxCollider(x, z, width, depth) {
  obstacleColliders.push({
    type: 'box',
    x,
    z,
    halfWidth: width / 2,
    halfDepth: depth / 2,
  });
}

function resolveObstacleCollisions(entity, radius, onHit) {
  obstacleColliders.forEach((collider) => {
    if (collider.type === 'circle') {
      const dx = entity.position.x - collider.x;
      const dz = entity.position.z - collider.z;
      const minDistance = collider.radius + radius;
      const distanceSq = dx * dx + dz * dz;
      if (distanceSq <= 0.0001 || distanceSq >= minDistance * minDistance) return;
      const distance = Math.sqrt(distanceSq);
      const push = minDistance - distance;
      entity.position.x += (dx / distance) * push;
      entity.position.z += (dz / distance) * push;
      onHit?.();
      return;
    }

    const closestX = THREE.MathUtils.clamp(entity.position.x, collider.x - collider.halfWidth, collider.x + collider.halfWidth);
    const closestZ = THREE.MathUtils.clamp(entity.position.z, collider.z - collider.halfDepth, collider.z + collider.halfDepth);
    const dx = entity.position.x - closestX;
    const dz = entity.position.z - closestZ;
    const distanceSq = dx * dx + dz * dz;
    if (distanceSq >= radius * radius) return;

    if (distanceSq > 0.0001) {
      const distance = Math.sqrt(distanceSq);
      const push = radius - distance;
      entity.position.x += (dx / distance) * push;
      entity.position.z += (dz / distance) * push;
    } else {
      const left = Math.abs(entity.position.x - (collider.x - collider.halfWidth));
      const right = Math.abs((collider.x + collider.halfWidth) - entity.position.x);
      const bottom = Math.abs(entity.position.z - (collider.z - collider.halfDepth));
      const top = Math.abs((collider.z + collider.halfDepth) - entity.position.z);
      const minSide = Math.min(left, right, bottom, top);
      if (minSide === left) entity.position.x = collider.x - collider.halfWidth - radius;
      else if (minSide === right) entity.position.x = collider.x + collider.halfWidth + radius;
      else if (minSide === bottom) entity.position.z = collider.z - collider.halfDepth - radius;
      else entity.position.z = collider.z + collider.halfDepth + radius;
    }
    onHit?.();
  });
}

function resolvePlayerObstacleCollisions() {
  if (getCurrentSafetyZone()) return;
  resolveObstacleCollisions(moai, 0.82, () => playerVelocity.multiplyScalar(0.42));
  resolveCeleryCollisions(moai, 0.82, () => playerVelocity.multiplyScalar(0.42));
}

function resolveCeleryCollisions(entity, radius, onHit) {
  if (currentStage !== 4 || !celeryCustomers.length) return;
  celeryCustomers.forEach((celery) => {
    const dx = entity.position.x - celery.position.x;
    const dz = entity.position.z - celery.position.z;
    const minDistance = radius + (celery.userData.collisionRadius || 1.05);
    const distanceSq = dx * dx + dz * dz;
    if (distanceSq <= 0.0001 || distanceSq >= minDistance * minDistance) return;
    const distance = Math.sqrt(distanceSq);
    const push = minDistance - distance;
    entity.position.x += (dx / distance) * push;
    entity.position.z += (dz / distance) * push;
    onHit?.(celery);
  });
}

function resolveRegularCustomerCollisions(entity, radius, onHit) {
  if (currentStage !== 4 || !regularCustomers.length) return;
  regularCustomers.forEach((customer) => {
    const dx = entity.position.x - customer.position.x;
    const dz = entity.position.z - customer.position.z;
    const minDistance = radius + (customer.userData.collisionRadius || 0.85);
    const distanceSq = dx * dx + dz * dz;
    if (distanceSq <= 0.0001 || distanceSq >= minDistance * minDistance) return;
    const distance = Math.sqrt(distanceSq);
    const push = minDistance - distance;
    entity.position.x += (dx / distance) * push;
    entity.position.z += (dz / distance) * push;
    onHit?.(customer);
  });
}

function placeStageCrystals() {
  const required = getSealsRequired();
  const pickupCount = currentStage === 4 ? 4 : required;
  for (let i = 0; i < pickupCount; i++) {
    if (currentStage === 3) {
      const spots = [
        [-8, -38],
        [28, -26],
        [-38, -4],
        [8, 5],
        [38, 24],
        [-20, 36],
        [0, 52],
      ];
      const [x, z] = spots[i % spots.length];
      addCrystal(x, z);
      continue;
    }
    if (currentStage === 4) {
      const spots = [
        [-54, -26],
        [-18, -36],
        [34, -34],
        [54, -2],
      ];
      const [x, z] = spots[i % spots.length];
      addCrystal(x, z);
      continue;
    }
    const angle = (i / required) * Math.PI * 2 + (currentStage === 2 ? 0.45 : 0);
    const radius = currentStage === 2 ? 24 + Math.sin(i * 2.1) * 16 : 18 + Math.sin(i * 1.7) * 14;
    const x = Math.cos(angle) * radius + (currentStage === 2 ? Math.sin(i * 1.4) * 9 : 0);
    const z = Math.sin(angle) * radius + (currentStage === 2 ? 2 : 0);
    addCrystal(x, z);
  }
}

function addSafetyZone(x, z, radius) {
  const groundY = getGroundHeight(x, z);
  const zone = {
    center: new THREE.Vector3(x, groundY, z),
    radius,
  };
  safetyZones.push(zone);

  const ringMat = new THREE.MeshStandardMaterial({
    color: 0x65ff9b,
    emissive: 0x1dc66a,
    emissiveIntensity: 0.5,
    transparent: true,
    opacity: 0.28,
    roughness: 0.35,
    side: THREE.DoubleSide,
  });
  const disc = new THREE.Mesh(new THREE.CircleGeometry(radius, 48), ringMat);
  disc.rotation.x = -Math.PI / 2;
  disc.position.set(x, groundY + 0.08, z);
  world.add(disc);

  const border = new THREE.Mesh(
    new THREE.TorusGeometry(radius, 0.08, 8, 80),
    new THREE.MeshStandardMaterial({ color: 0x9dffbf, emissive: 0x32ff8a, emissiveIntensity: 0.9, roughness: 0.25 })
  );
  border.rotation.x = Math.PI / 2;
  border.position.set(x, groundY + 0.16, z);
  world.add(border);

  const post = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.22, 3.2, 12),
    new THREE.MeshStandardMaterial({ color: 0xd8ffe5, emissive: 0x48ff93, emissiveIntensity: 0.45 })
  );
  post.position.set(x, groundY + 1.6, z);
  post.castShadow = true;
  world.add(post);
}

function createExitSignTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  
  ctx.fillStyle = '#00a850';
  ctx.fillRect(0, 0, 256, 128);
  
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 6;
  ctx.strokeRect(8, 8, 240, 112);
  
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('EXIT 🏃 出口', 128, 64);
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createEscapeGate() {
  escapeGate.position.fromArray(getStageConfig().gate);
  escapeGate.position.y = getGroundHeight(escapeGate.position.x, escapeGate.position.z);

  // EXIT colors: Green (#00b050) frame
  const pillarMat = new THREE.MeshStandardMaterial({
    color: 0x009944,
    roughness: 0.5,
    metalness: 0.1,
    emissive: 0x003311,
    emissiveIntensity: 0.3
  });
  const glowMat = new THREE.MeshStandardMaterial({
    color: 0xff3333,
    emissive: 0xff0000,
    emissiveIntensity: 0.55,
    roughness: 0.22,
  });

  const left = new THREE.Mesh(new THREE.BoxGeometry(1.3, 7.8, 1.3), pillarMat);
  left.position.set(-3.2, 3.9, 0);
  left.castShadow = true;
  escapeGate.add(left);

  const right = left.clone();
  right.position.x = 3.2;
  escapeGate.add(right);

  const top = new THREE.Mesh(new THREE.BoxGeometry(7.8, 1.2, 1.2), pillarMat);
  top.position.set(0, 7.5, 0);
  top.castShadow = true;
  escapeGate.add(top);

  const portal = new THREE.Mesh(new THREE.PlaneGeometry(4.7, 6.2), glowMat);
  portal.position.set(0, 3.7, 0.04);
  portal.userData.portal = true;
  escapeGate.add(portal);

  const marker = new THREE.Mesh(new THREE.TorusGeometry(4.1, 0.08, 8, 42), glowMat);
  marker.rotation.x = Math.PI / 2;
  marker.position.y = 0.15;
  escapeGate.add(marker);

  // "EXIT 🏃 出口" Sign Billboard
  const signTex = createExitSignTexture();
  const signMat = new THREE.MeshBasicMaterial({ map: signTex, transparent: true, side: THREE.DoubleSide });
  const signMesh = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 2.6), signMat);
  signMesh.position.set(0, 7.5, 0.65); // Placed directly on the front face of the top beam to avoid ceiling collision
  escapeGate.add(signMesh);

  // Volumetric Red light pillar guide beacon
  const beaconGeo = new THREE.CylinderGeometry(0.8, 1.8, 48, 16, 1, true);
  const beaconMat = new THREE.MeshBasicMaterial({
    color: 0xff1111,
    transparent: true,
    opacity: 0.38,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    depthWrite: false
  });
  const beacon = new THREE.Mesh(beaconGeo, beaconMat);
  beacon.position.set(0, 24, 0);
  beacon.userData.beacon = true;
  escapeGate.add(beacon);
}

function addLandmark(x, z, color, type) {
  const group = new THREE.Group();
  group.position.set(x, getGroundHeight(x, z), z);
  world.add(group);

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(3.8, 4.5, 0.45, 8),
    new THREE.MeshStandardMaterial({ color, roughness: 0.72, metalness: 0.08 })
  );
  base.position.y = 0.22;
  base.receiveShadow = true;
  base.castShadow = true;
  group.add(base);
  addCircleCollider(x, z, currentStage === 2 ? 3.95 : 4.35);

  const spire = new THREE.Mesh(
    new THREE.ConeGeometry(1.25, 4.2, 8),
    new THREE.MeshStandardMaterial({ color: 0xf4f1db, emissive: color, emissiveIntensity: 0.13, roughness: 0.5 })
  );
  spire.position.y = 2.5;
  spire.castShadow = true;
  group.add(spire);

  const orb = new THREE.Mesh(
    new THREE.SphereGeometry(0.55, 18, 12),
    new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: color, emissiveIntensity: 1.4, roughness: 0.2 })
  );
  orb.position.y = 4.7;
  orb.userData.type = type;
  group.add(orb);
}

function addCrystal(x, z, fromAuthor = false) {
  const texture = textureLoader.load('./yogurt.png');
  texture.flipY = false;
  const crystal = new THREE.Mesh(
    new THREE.PlaneGeometry(1.65, 1.65),
    new THREE.MeshStandardMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide,
      color: 0xffffff,
      emissive: 0x77f4ff,
      emissiveIntensity: 0.18,
      roughness: 0.35,
    })
  );
  crystal.position.set(x, getGroundHeight(x, z) + 1.25, z);
  crystal.userData.baseY = crystal.position.y;
  crystal.userData.fromAuthor = fromAuthor;
  crystal.castShadow = true;
  world.add(crystal);
  pickupCrystals.push(crystal);
}

function setHud() {
  const required = getSealsRequired();
  if (hud.hint) {
    const distance = getNearestAuthorDistance();
    const safeZone = getCurrentSafetyZone();
    const config = getStageConfig();
    const stageCall = stageTransitionTimer > 0 ? `${config.name} ` : '';
    const danger = (currentStage === 4 && !moataroMoaiPurchased)
      ? 'ブースでモアイを購入しよう'
      : safeZone ? 'セーフティゾーン' : distance < 10 ? '近い！逃げろ' : distance < 24 ? '作者が追跡中' : '気配は遠い';
    const alertHint = teleportAlertTimer > 0 ? '  ワープ音で作者が警戒中' : '';
    const ringHint = currentStage === 2 ? `  光リング: ワープ${alertHint}` : '';
    const helperHint = currentStage === 3
      ? helperTimer > 0
        ? `  青モアイ囮 ${helperTimer.toFixed(0)}秒`
        : helperCooldown > 0
          ? `  HELP再充電 ${helperCooldown.toFixed(0)}秒`
          : '  HELP使用可'
      : '';
    const progress = Math.min(100, Math.round((crystals / required) * 100));
    const stageFourStealDone = currentStage !== 4 || stolenYogurts > 0;
    const goal = (currentStage === 4 && !moataroMoaiPurchased)
      ? '金沢モア太郎ブース（J-80）でモアイを購入して連れていく'
      : escapeOpen ? `ゲート解放中: ヨーグルト${required}個を持って脱出` : config.mission;
    const special = `${ringHint}${helperHint}`.trim();

    let stepsHtml = '';
    if (currentStage === 4) {
      const step1Class = moataroMoaiPurchased ? 'done' : 'warn';
      const step2Class = (moataroMoaiPurchased && !escapeOpen) ? 'warn' : escapeOpen ? 'done' : '';
      const step3Class = escapeOpen ? 'warn' : '';
      stepsHtml = `
        <div class="hud-steps" style="display: flex; flex-direction: column; gap: 3px; margin-top: 5px;">
          <span class="hud-step ${step1Class}">① モアイ購入: ${moataroMoaiPurchased ? '完了' : '未達成'}</span>
          <span class="hud-step ${step2Class}">② ヨーグルト: ${crystals}/${required}個 (作者強奪: ${stageFourStealDone ? 'OK' : '必要'})</span>
          <span class="hud-step ${step3Class}">③ 会場から脱出！ (🎁クーポンGET)</span>
        </div>
      `;
    } else {
      stepsHtml = `
        <div class="hud-steps">
          <span class="hud-step ${crystals >= required ? 'done' : 'warn'}">必要 ${required}個</span>
          <span class="hud-step">作者 ${getActiveAuthors().length}体</span>
          <span class="hud-step">距離 ${distance.toFixed(0)}m</span>
        </div>
      `;
    }

    hud.hint.innerHTML = `
      <div class="hud-main">
        <span class="hud-title">${stageCall || config.name}</span>
        <span class="hud-pill hud-danger">${danger}</span>
      </div>
      <div class="hud-yogurt-panel">
        <div class="hud-yogurt-count">${crystals}<small>/ ${required} ヨーグルト</small></div>
        <div>
          <div class="hud-meter" style="--hud-progress: ${progress}%"><div class="hud-meter-fill"></div></div>
          ${stepsHtml}
        </div>
      </div>
      <div class="hud-goal">${goal}${special ? ` / ${special}` : ''}</div>
      <div class="hud-controls">左ドラッグ 移動 / 右ドラッグ 視点 / DASH ダッシュ</div>
      <div style="font-size: 8px; color: rgba(255,255,255,0.45); margin-top: 3px;">
        [Debug] 購入フラグ: ${moataroMoaiPurchased} / 表示: ${petMoai.visible} / 位置: (${petMoai.position.x.toFixed(1)}, ${petMoai.position.y.toFixed(1)}, ${petMoai.position.z.toFixed(1)}) / Yaw: ${cameraYaw.toFixed(2)}
      </div>
    `;
  }
  updateHelpButton();
}

function updateHelpButton() {
  if (!hud.help) return;
  const visible = currentStage === 3 && gameStarted && !gameOver;
  const ready = visible && helperTimer <= 0 && helperCooldown <= 0;
  hud.help.style.display = visible ? 'flex' : 'none';
  hud.help.classList.toggle('disabled', !ready);
  hud.help.textContent = helperTimer > 0 ? 'HELP' : helperCooldown > 0 ? `${Math.ceil(helperCooldown)}` : 'HELP';
}

function getNearestAuthorDistance() {
  const active = getActiveAuthors();
  if (!active.length) return moai.position.distanceTo(author.position);
  return active.reduce((nearest, enemy) => Math.min(nearest, moai.position.distanceTo(enemy.position)), Infinity);
}

function getNearestAuthor() {
  let nearest = author;
  let nearestDistance = Infinity;
  getActiveAuthors().forEach((enemy) => {
    const distance = moai.position.distanceTo(enemy.position);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearest = enemy;
    }
  });
  return nearest;
}

function getActiveAuthors() {
  return authors.filter((enemy) => enemy.userData.ai?.active);
}

function getCurrentSafetyZone() {
  return safetyZones.find((zone) => {
    const dx = moai.position.x - zone.center.x;
    const dz = moai.position.z - zone.center.z;
    return Math.hypot(dx, dz) < zone.radius;
  }) || null;
}

function resetAuthorPositions() {
  const starts = currentStage === 4
    ? [
      [-52, -6],
      [52, -20],
      [-42, 44],
      [36, 52],
      [0, -48],
      [-58, 18],
      [58, 20],
    ]
    : currentStage === 3
    ? [
      [-42, -18],
      [42, -12],
      [-28, 42],
      [31, 48],
      [0, 28],
      [-54, 20],
      [52, -38],
    ]
    : currentStage === 2
    ? [
      [-36, 8],
      [36, -2],
      [-18, 42],
      [22, 38],
      [-52, -18],
      [50, -34],
      [0, 48],
    ]
    : [
      [0, -42],
      [-34, -28],
      [35, -18],
      [-55, 4],
      [52, 8],
      [-38, 48],
      [42, 50],
    ];
  const activeCount = getStageConfig().initialAuthors;
  authors.forEach((enemy, index) => {
    const [x, z] = starts[index] || [THREE.MathUtils.randFloatSpread(50), -42 - index * 6];
    enemy.position.set(x, 0, z);
    setEntityGroundHeight(enemy);
    if (!enemy.userData.ai) enemy.userData.ai = createAuthorBrain(index);
    enemy.userData.ai.active = index < activeCount;
    enemy.visible = enemy.userData.ai.active;
    resetAuthorYogurtState(enemy, index);
  });
}

function playUserVoice() {
  return;
}

function blip(frequency, duration = 0.08, volume = 0.08, type = 'square') {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(volume, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

function playBgmTone(frequency, duration, volume, type = 'square', detune = 0) {
  if (!frequency || !bgmGain) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = frequency;
  osc.detune.value = detune;
  gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(volume, audioCtx.currentTime + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
  osc.connect(gain);
  gain.connect(bgmGain);
  osc.start(audioCtx.currentTime);
  osc.stop(audioCtx.currentTime + duration + 0.02);
}

function playBgmNoise(duration, volume, tone = 900) {
  if (!bgmGain) return;
  const length = Math.max(1, Math.floor(audioCtx.sampleRate * duration));
  const buffer = audioCtx.createBuffer(1, length, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.2);
  }
  const source = audioCtx.createBufferSource();
  const filter = audioCtx.createBiquadFilter();
  const gain = audioCtx.createGain();
  filter.type = 'highpass';
  filter.frequency.value = tone;
  gain.gain.setValueAtTime(volume, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
  source.buffer = buffer;
  source.connect(filter);
  filter.connect(gain);
  gain.connect(bgmGain);
  source.start(audioCtx.currentTime);
}

function startBgm(mode = 'game') {
  bgmMode = mode;
  if (bgmRunning) return;
  if (audioCtx.state === 'suspended') audioCtx.resume();
  bgmRunning = true;
  bgmStep = 0;
  if (!bgmGain) {
    bgmGain = audioCtx.createGain();
    bgmGain.gain.value = 0.12;
    bgmGain.connect(audioCtx.destination);
  }
  scheduleBgmStep();
}

function stopBgm() {
  bgmRunning = false;
  if (bgmTimer) {
    clearTimeout(bgmTimer);
    bgmTimer = null;
  }
  if (bgmGain) {
    bgmGain.gain.cancelScheduledValues(audioCtx.currentTime);
    bgmGain.gain.setTargetAtTime(0.0001, audioCtx.currentTime, 0.08);
  }
}

function primeSpeech() {
  if (speechPrimed || !('speechSynthesis' in window)) return;
  speechPrimed = true;
  try {
    cachedJapaneseVoice = getJapaneseVoice();
    const utterance = new SpeechSynthesisUtterance(' ');
    utterance.lang = 'ja-JP';
    if (cachedJapaneseVoice) utterance.voice = cachedJapaneseVoice;
    utterance.volume = 0.01;
    window.speechSynthesis.speak(utterance);
  } catch (_) {}
}

function getJapaneseVoice() {
  if (!('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices?.() || [];
  cachedJapaneseVoice = cachedJapaneseVoice || voices.find((voice) => /ja|japan/i.test(`${voice.lang} ${voice.name}`)) || voices[0] || null;
  return cachedJapaneseVoice;
}

function speakText(text, { rate = 1.05, pitch = 0.92, volume = 0.95 } = {}) {
  if (!('speechSynthesis' in window)) return false;
  try {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;
    const voice = getJapaneseVoice();
    if (voice) utterance.voice = voice;
    window.speechSynthesis.resume?.();
    window.speechSynthesis.speak(utterance);
    return true;
  } catch (_) {
    return false;
  }
}

function loadRecordedVoice(src) {
  if (!src) return Promise.resolve(null);
  if (recordedVoiceBuffers.has(src)) return Promise.resolve(recordedVoiceBuffers.get(src));
  if (recordedVoicePromises.has(src)) return recordedVoicePromises.get(src);
  const promise = fetch(src)
    .then((res) => (res.ok ? res.arrayBuffer() : Promise.reject(new Error(`voice ${res.status}`))))
    .then((arrayBuffer) => audioCtx.decodeAudioData(arrayBuffer.slice(0)))
    .then((buffer) => {
      recordedVoiceBuffers.set(src, buffer);
      return buffer;
    })
    .catch(() => null);
  recordedVoicePromises.set(src, promise);
  return promise;
}

function playRecordedVoiceBuffer(buffer, { volume = 1 } = {}) {
  if (!buffer) return false;
  try {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;
    if (bgmGain) {
      bgmGain.gain.cancelScheduledValues(now);
      bgmGain.gain.setTargetAtTime(0.02, now, 0.02);
      bgmGain.gain.setTargetAtTime(bgmMode === 'menu' ? 0.055 : 0.09, now + Math.min(1.8, buffer.duration + 0.1), 0.18);
    }
    const source = audioCtx.createBufferSource();
    const gain = audioCtx.createGain();
    source.buffer = buffer;
    gain.gain.setValueAtTime(volume, now);
    source.connect(gain);
    gain.connect(audioCtx.destination);
    source.start(now);
    return true;
  } catch (_) {
    return false;
  }
}

function playRecordedVoice(src, { volume = 1 } = {}) {
  const buffer = recordedVoiceBuffers.get(src);
  if (buffer) return playRecordedVoiceBuffer(buffer, { volume });
  loadRecordedVoice(src).then((loadedBuffer) => {
    if (loadedBuffer) playRecordedVoiceBuffer(loadedBuffer, { volume });
  });
  return true;
}

function warmRecordedVoices() {
  [...MOATARO_LINE_VOICES.map((line) => line.src), ...Object.values(VOICE_FILES)].forEach((src) => {
    loadRecordedVoice(src);
  });
}

function playVoiceCue(kind = 'shop') {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const now = audioCtx.currentTime;
  if (bgmGain) {
    bgmGain.gain.cancelScheduledValues(now);
    bgmGain.gain.setTargetAtTime(0.018, now, 0.02);
    bgmGain.gain.setTargetAtTime(0.09, now + 0.95, 0.18);
  }
  const notes = kind === 'thanks'
    ? [660, 740, 830, 660, 520]
    : kind === 'bad'
      ? [210, 160, 130, 170]
      : [440, 520, 610, 520, 690, 560];
  notes.forEach((freq, index) => {
    setTimeout(() => playVoiceSyllable(freq, kind === 'bad' ? 0.16 : 0.13), index * 105);
  });
}

function playVoiceSyllable(frequency, duration) {
  const osc = audioCtx.createOscillator();
  const osc2 = audioCtx.createOscillator();
  const filter = audioCtx.createBiquadFilter();
  const gain = audioCtx.createGain();
  osc.type = 'sawtooth';
  osc2.type = 'square';
  osc.frequency.value = frequency;
  osc2.frequency.value = frequency * 1.01;
  filter.type = 'bandpass';
  filter.frequency.value = frequency * 2.1;
  filter.Q.value = 7;
  gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.18, audioCtx.currentTime + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
  osc.connect(filter);
  osc2.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(audioCtx.currentTime);
  osc2.start(audioCtx.currentTime);
  osc.stop(audioCtx.currentTime + duration + 0.02);
  osc2.stop(audioCtx.currentTime + duration + 0.02);
}

function scheduleBgmStep() {
  if (!bgmRunning) return;
  const distance = getNearestAuthorDistance();
  const menu = bgmMode === 'menu';
  const danger = menu ? 0 : THREE.MathUtils.clamp((34 - distance) / 34, 0, 1);
  const swarm = !menu && finalSwarmActive ? 1 : 0;
  let theme = menu ? bgmThemes[0] : (bgmThemes[currentStage - 1] || bgmThemes[0]);
  if (currentStage === 4 && moataroPromptDismissed && !victory && !gameOver) {
    theme = pokemonRivalTheme;
  }
  const interval = menu ? 310 : Math.max(96, theme.baseInterval - danger * 64 - swarm * 52 - teleportAlertTimer * 5);
  const master = menu ? 0.055 : 0.085 + danger * 0.07 + swarm * 0.045 + (currentStage === 2 ? 0.018 : 0);

  if (bgmGain) {
    bgmGain.gain.setTargetAtTime(master, audioCtx.currentTime, 0.08);
  }

  const bass = theme.bass[bgmStep % theme.bass.length];
  const lead = theme.lead[bgmStep % theme.lead.length];
  const harmony = theme.harmony[bgmStep % theme.harmony.length];
  if (menu) {
    playBgmTone(harmony, 0.34, 0.04, 'triangle', -6);
    if (bgmStep % 2 === 0) playBgmTone(bass * 2, 0.18, 0.035, 'sine');
    if (lead && bgmStep % 4 === 1) playBgmTone(lead, 0.11, 0.032, 'triangle');
    bgmStep++;
    bgmTimer = setTimeout(scheduleBgmStep, interval);
    return;
  }

  const bassType = (theme === pokemonRivalTheme) ? 'triangle' : (currentStage === 2 ? 'square' : 'sawtooth');
  playBgmTone(bass, 0.18, 0.2, bassType, -8);

  if (bgmStep % 2 === 0) {
    playBgmTone(bass * 2, 0.055, 0.055 + danger * 0.03, 'square', 5);
  }
  if (bgmStep % 4 === 0) {
    playBgmTone(harmony, 0.24, 0.055, currentStage === 2 ? 'triangle' : 'square', -4);
  }
  if ((danger > 0.35 || swarm) && lead) {
    playBgmTone(lead * (swarm ? 1.5 : 1), 0.09, 0.068, theme.leadType);
  } else if (lead && bgmStep % 3 === 0) {
    playBgmTone(lead, 0.08, 0.048, theme.leadType);
  }
  if (bgmStep % theme.drumEvery === 0) {
    playBgmTone(currentStage === 2 ? 58 : 72, 0.07, 0.16, 'sine', -18);
  }
  if (bgmStep % 2 === 1) {
    playBgmNoise(0.035, currentStage === 2 ? 0.028 : 0.022, currentStage === 2 ? 1500 : 2300);
  }
  if (swarm && bgmStep % 4 === 1) {
    playBgmTone(880, 0.045, 0.05, 'square', 12);
  }
  if (teleportAlertTimer > 0 && bgmStep % 3 === 2) {
    playBgmTone(1046.5, 0.05, 0.045, 'square', 20);
  }

  bgmStep++;
  bgmTimer = setTimeout(scheduleBgmStep, interval);
}

function makeShot(owner, position, direction) {
  const isPlayer = owner === 'player';
  const shot = new THREE.Mesh(
    new THREE.SphereGeometry(isPlayer ? 0.24 : 0.32, 16, 10),
    new THREE.MeshStandardMaterial({
      color: isPlayer ? 0x77f4ff : 0xff5f45,
      emissive: isPlayer ? 0x20d7ff : 0xff2200,
      emissiveIntensity: 1.8,
      roughness: 0.25,
    })
  );
  shot.position.copy(position);
  shot.position.y += isPlayer ? 1.25 : 2.2;
  shot.userData.velocity = direction.clone().normalize().multiplyScalar(isPlayer ? SHOT_SPEED : 16);
  shot.userData.life = isPlayer ? 1.5 : 2.4;
  scene.add(shot);
  (isPlayer ? playerShots : authorShots).push(shot);
  blip(isPlayer ? 720 : 180, isPlayer ? 0.055 : 0.12, isPlayer ? 0.05 : 0.075, isPlayer ? 'square' : 'sawtooth');
}

function firePlayerShot() {
  if (fireCooldown > 0 || energy < 8 || gameOver) return;
  const direction = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), moai.rotation.y);
  makeShot('player', moai.position, direction);
  fireCooldown = 0.18;
  energy -= 8;
}

function activateBlueHelper() {
  if (currentStage !== 3 || helperTimer > 0 || helperCooldown > 0 || gameOver || !gameStarted) return;
  const forward = playerVelocity.lengthSq() > 0.2
    ? playerVelocity.clone().normalize()
    : new THREE.Vector3(-Math.sin(cameraYaw), 0, -Math.cos(cameraYaw));
  blueHelper.position.copy(moai.position).add(forward.multiplyScalar(8));
  blueHelper.position.x = THREE.MathUtils.clamp(blueHelper.position.x, -WORLD_SIZE, WORLD_SIZE);
  blueHelper.position.z = THREE.MathUtils.clamp(blueHelper.position.z, -WORLD_SIZE, WORLD_SIZE);
  setEntityGroundHeight(blueHelper);
  helperVelocity.copy(forward.multiplyScalar(13));
  helperTurnTimer = 0.25;
  blueHelper.visible = true;
  helperTimer = 9.5;
  helperCooldown = 24;
  screenShake = 0.25;
  blip(520, 0.12, 0.13, 'triangle');
  setTimeout(() => blip(780, 0.14, 0.1, 'triangle'), 110);
}

function updateBlueHelper(dt) {
  helperCooldown = Math.max(0, helperCooldown - dt);
  if (helperTimer <= 0) {
    blueHelper.visible = false;
    return;
  }
  helperTimer = Math.max(0, helperTimer - dt);
  helperTurnTimer -= dt;

  if (helperTurnTimer <= 0) {
    const nearest = getNearestAuthor();
    const away = blueHelper.position.clone().sub(nearest.position).setY(0);
    if (away.lengthSq() < 0.1) away.set(Math.random() - 0.5, 0, Math.random() - 0.5);
    away.normalize();
    const side = new THREE.Vector3(-away.z, 0, away.x).multiplyScalar(THREE.MathUtils.randFloatSpread(0.9));
    const roam = new THREE.Vector3(THREE.MathUtils.randFloatSpread(0.55), 0, THREE.MathUtils.randFloatSpread(0.55));
    const targetDir = away.add(side).add(roam).normalize();
    helperVelocity.lerp(targetDir.multiplyScalar(15.5), 0.82);
    helperTurnTimer = THREE.MathUtils.randFloat(0.55, 1.2);
  }

  if (Math.abs(blueHelper.position.x) > WORLD_SIZE - 8) helperVelocity.x *= -0.9;
  if (Math.abs(blueHelper.position.z) > WORLD_SIZE - 8) helperVelocity.z *= -0.9;
  blueHelper.position.addScaledVector(helperVelocity, dt);
  blueHelper.position.x = THREE.MathUtils.clamp(blueHelper.position.x, -WORLD_SIZE + 4, WORLD_SIZE - 4);
  blueHelper.position.z = THREE.MathUtils.clamp(blueHelper.position.z, -WORLD_SIZE + 4, WORLD_SIZE - 4);
  resolveObstacleCollisions(blueHelper, 0.9, () => helperVelocity.multiplyScalar(-0.45));
  resolveCeleryCollisions(blueHelper, 0.9, () => helperVelocity.multiplyScalar(-0.45));
  setEntityGroundHeight(blueHelper);
  if (helperVelocity.lengthSq() > 0.1) {
    blueHelper.rotation.y = THREE.MathUtils.lerp(blueHelper.rotation.y, Math.atan2(helperVelocity.x, helperVelocity.z), 1 - Math.pow(0.0005, dt));
  }
  blueHelper.rotation.z = Math.sin(performance.now() * 0.018) * 0.07;
  blueHelper.children.forEach((child, index) => {
    if (index === blueHelper.children.length - 1) child.rotation.z += dt * 5.2;
  });
  if (helperTimer <= 0) {
    blueHelper.visible = false;
    helperVelocity.set(0, 0, 0);
  }
}

function movePlayer(dt) {
  const confirmOpen = hud.confirmDialog && hud.confirmDialog.style.display === 'flex';
  const rivalOpen = hud.rivalDialog && hud.rivalDialog.style.display === 'block';
  const darkMarketOpen = document.getElementById('dark-market-dialog') && document.getElementById('dark-market-dialog').style.display === 'block';
  if (confirmOpen || rivalOpen || darkMarketOpen) {
    playerVelocity.set(0, 0, 0);
    return;
  }
  const xInput = Number(keys.right) - Number(keys.left) + mobileMove.x;
  const zInput = Number(keys.forward) - Number(keys.backward) + mobileMove.z;
  const input = new THREE.Vector3(xInput, 0, zInput);
  const hasInput = input.lengthSq() > 0;

  if (hasInput) {
    input.normalize();
    const cameraForward = new THREE.Vector3(-Math.sin(cameraYaw), 0, -Math.cos(cameraYaw));
    const cameraRight = new THREE.Vector3(Math.cos(cameraYaw), 0, -Math.sin(cameraYaw));
    const moveDir = cameraForward.multiplyScalar(input.z).add(cameraRight.multiplyScalar(input.x)).normalize();
    const sprinting = keys.fire && energy > 3;
    const speed = sprinting ? SPRINT_SPEED : PLAYER_SPEED;

    playerVelocity.lerp(moveDir.multiplyScalar(speed), 1 - Math.pow(0.0003, dt));
    moai.position.addScaledVector(playerVelocity, dt);
    moai.rotation.y = THREE.MathUtils.lerp(moai.rotation.y, Math.atan2(moveDir.x, moveDir.z), 1 - Math.pow(0.0001, dt));
    moai.rotation.z = Math.sin(performance.now() * 0.018) * (sprinting ? 0.09 : 0.055);
    energy = THREE.MathUtils.clamp(energy + (sprinting ? -22 : 6) * dt, 0, 100);
  } else {
    playerVelocity.multiplyScalar(Math.pow(0.02, dt));
    moai.rotation.z *= 0.86;
    energy = Math.min(100, energy + 12 * dt);
  }

  moai.position.x = THREE.MathUtils.clamp(moai.position.x, -WORLD_SIZE, WORLD_SIZE);
  moai.position.z = THREE.MathUtils.clamp(moai.position.z, -WORLD_SIZE, WORLD_SIZE);
  resolvePlayerObstacleCollisions();
  moai.position.x = THREE.MathUtils.clamp(moai.position.x, -WORLD_SIZE, WORLD_SIZE);
  moai.position.z = THREE.MathUtils.clamp(moai.position.z, -WORLD_SIZE, WORLD_SIZE);
  setEntityGroundHeight(moai);
}

function updateAuthors(dt) {
  getActiveAuthors().forEach((enemy, index) => updateAuthor(dt, enemy, index));
}

function isInMoataroServiceZone() {
  if (currentStage !== 4 || !gameStarted || gameOver) return false;
  const dx = moai.position.x - MOATARO_SERVICE.center.x;
  const dz = moai.position.z - MOATARO_SERVICE.center.z;
  return Math.hypot(dx, dz) < MOATARO_SERVICE.radius;
}

function isMoataroClerk(enemy, index) {
  return moataroServiceActive && currentStage === 4 && index === 0 && enemy.userData.ai?.active;
}

function isMoataroSafeAuthor(enemy, index) {
  return currentStage === 4 && index === 0 && enemy.userData.ai?.active && (moataroServiceActive || moataroClerkSafeTimer > 0);
}

function updateMoataroClerk(enemy, dt) {
  enemy.userData.hasYogurt = false;
  enemy.userData.yogurtTime = 0;
  if (enemy.userData.yogurtIcon) enemy.userData.yogurtIcon.visible = false;
  if (enemy.userData.yogurtLabel) enemy.userData.yogurtLabel.visible = false;
  if (enemy.userData.serviceLabel) enemy.userData.serviceLabel.visible = true;
  const boothToPlayer = moai.position.clone().sub(MOATARO_SERVICE.center).setY(0);
  if (boothToPlayer.lengthSq() < 0.01) boothToPlayer.set(0, 0, -1);
  const target = moai.position.clone().add(boothToPlayer.normalize().multiplyScalar(2.2));
  target.y = getGroundHeight(target.x, target.z);
  const toPlayer = target.sub(enemy.position);
  if (toPlayer.lengthSq() > 0.22) {
    enemy.position.addScaledVector(toPlayer.normalize(), 34 * dt);
  }
  enemy.lookAt(moai.position.x, enemy.position.y, moai.position.z);
}

function updateAuthor(dt, enemy = author, index = 0) {
  if (!enemy.userData.ai?.active) return;
  if (currentStage === 4 && !moataroMoaiPurchased) {
    if (isMoataroClerk(enemy, index)) {
      updateMoataroClerk(enemy, dt);
    } else {
      const brain = enemy.userData.ai || { phase: 0, speedBias: 0 };
      const roamAngle = performance.now() * 0.0006 + brain.phase * 2.3;
      const roamDir = new THREE.Vector3(Math.cos(roamAngle), 0, Math.sin(roamAngle))
        .add(getSeparationVector(enemy).multiplyScalar(0.72))
        .normalize();
      const roamSpeed = 3.5 + (brain.speedBias || 0) * 0.5;
      enemy.position.addScaledVector(roamDir, roamSpeed * dt);
      
      enemy.position.x = THREE.MathUtils.clamp(enemy.position.x, -WORLD_SIZE, WORLD_SIZE);
      enemy.position.z = THREE.MathUtils.clamp(enemy.position.z, -WORLD_SIZE, WORLD_SIZE);
      resolveObstacleCollisions(enemy, 1.05);
      resolveRegularCustomerCollisions(enemy, 1.05);
      resolveCeleryCollisions(enemy, 1.05);
      enemy.position.x = THREE.MathUtils.clamp(enemy.position.x, -WORLD_SIZE, WORLD_SIZE);
      enemy.position.z = THREE.MathUtils.clamp(enemy.position.z, -WORLD_SIZE, WORLD_SIZE);
      setEntityGroundHeight(enemy);
      
      enemy.lookAt(camera.position.x, enemy.position.y, camera.position.z);
      
      enemy.children.forEach((child, childIndex) => {
        child.rotation.z += childIndex === 1 ? dt * (1.2 + index * 0.18) : 0;
      });
    }
    return;
  }
  const safeZone = getCurrentSafetyZone();
  updateAuthorYogurtTime(enemy, dt);
  enemy.userData.contactFxCooldown = Math.max(0, (enemy.userData.contactFxCooldown || 0) - dt);
  if (enemy.userData.downTimer > 0) {
    enemy.userData.downTimer = Math.max(0, enemy.userData.downTimer - dt);
    if (enemy.userData.downLabel) enemy.userData.downLabel.visible = enemy.userData.downTimer > 0;
    enemy.rotation.z = Math.sin(performance.now() * 0.012 + index) * 0.16;
    enemy.lookAt(camera.position.x, enemy.position.y, camera.position.z);
    if (enemy.userData.downTimer <= 0 && enemy.userData.downLabel) enemy.userData.downLabel.visible = false;
    return;
  }
  if (enemy.userData.downLabel) enemy.userData.downLabel.visible = false;
  const targetPoint = getAuthorTarget(enemy, index);
  const toTarget = targetPoint.clone().sub(enemy.position);
  const toPlayer = moai.position.clone().sub(enemy.position);
  const distance = toPlayer.length();
  const direction = toTarget.lengthSq() > 0.001 ? toTarget.normalize() : new THREE.Vector3(0, 0, 1);
  const nearBoost = THREE.MathUtils.clamp((28 - distance) / 28, 0, 1);
  const sealBoost = crystals * 0.32;
  const teleportAlertBoost = currentStage === 2 ? teleportAlertTimer * 0.58 : 0;
  const brain = enemy.userData.ai;
  const speed = AUTHOR_SPEED + getStageConfig().authorBoost + sealBoost + nearBoost * 2.4 + teleportAlertBoost + brain.speedBias;
  const wobble = Math.sin(performance.now() * 0.004 + brain.phase) * 0.34;
  const fleeingWithYogurt = currentStage === 4 && enemy.userData.hasYogurt && enemy.userData.yogurtTime <= 0;
  let chaseDir = direction
    .clone()
    .add(new THREE.Vector3(-direction.z, 0, direction.x).multiplyScalar(wobble))
    .add(getSeparationVector(enemy).multiplyScalar(0.72))
    .normalize();

  if (isMoataroClerk(enemy, index)) {
    updateMoataroClerk(enemy, dt);
  } else if (currentStage === 4 && enemy.userData.hasYogurt && enemy.userData.yogurtTime > 0) {
    enemy.userData.yogurtLabel.visible = true;
    enemy.userData.yogurtIcon.visible = true;
  } else if (fleeingWithYogurt) {
    const fleeDir = enemy.position.clone().sub(moai.position).setY(0);
    if (fleeDir.lengthSq() < 0.01) fleeDir.set(Math.random() - 0.5, 0, Math.random() - 0.5);
    const edgePressure = Math.max(Math.abs(enemy.position.x), Math.abs(enemy.position.z)) / WORLD_SIZE;
    const centerPull = enemy.position.clone().multiplyScalar(-1).setY(0).normalize().multiplyScalar(Math.max(0, edgePressure - 0.72) * 1.4);
    const roamAngle = performance.now() * 0.0018 + brain.phase * 1.9 + Math.sin(performance.now() * 0.0026 + brain.phase) * 1.25;
    const roam = new THREE.Vector3(Math.cos(roamAngle), 0, Math.sin(roamAngle)).multiplyScalar(0.52);
    const sideStep = new THREE.Vector3(-fleeDir.z, 0, fleeDir.x).normalize().multiplyScalar(0.45 + Math.abs(wobble) * 0.9);
    const fleeMove = fleeDir.normalize()
      .add(centerPull)
      .add(sideStep)
      .add(roam)
      .add(getSeparationVector(enemy).multiplyScalar(0.35))
      .normalize();
    const fleeSpeed = PLAYER_SPEED * 0.9 + Math.max(0, brain.speedBias) * 0.45;
    enemy.position.addScaledVector(fleeMove, fleeSpeed * dt);
  } else if (safeZone) {
    const fromZone = enemy.position.clone().sub(safeZone.center);
    const zoneDistance = fromZone.length();
    if (zoneDistance < safeZone.radius + 4.2) {
      chaseDir = fromZone.lengthSq() > 0.001 ? fromZone.normalize() : new THREE.Vector3(0, 0, -1);
      enemy.position.addScaledVector(chaseDir, (speed + 2.2) * dt);
    } else {
      const guardPoint = safeZone.center.clone().add(direction.clone().multiplyScalar(safeZone.radius + 5.3 + index * 0.55));
      const toGuard = guardPoint.sub(enemy.position);
      if (toGuard.lengthSq() > 0.2) {
        enemy.position.addScaledVector(toGuard.normalize(), speed * 0.45 * dt);
      }
    }
  } else {
    enemy.position.addScaledVector(chaseDir, speed * dt);
  }

  if (!safeZone && distance < 2.15 && !isMoataroSafeAuthor(enemy, index)) {
    if (currentStage === 4) {
      handleStageFourAuthorContact(enemy);
      return;
    }
    playerHealth = 0;
    screenShake = 0.7;
    finishGame(false);
    return;
  }

  enemy.position.x = THREE.MathUtils.clamp(enemy.position.x, -WORLD_SIZE, WORLD_SIZE);
  enemy.position.z = THREE.MathUtils.clamp(enemy.position.z, -WORLD_SIZE, WORLD_SIZE);
  if (!isMoataroClerk(enemy, index)) {
    resolveObstacleCollisions(enemy, 1.05);
    resolveRegularCustomerCollisions(enemy, 1.05);
    resolveCeleryCollisions(enemy, 1.05);
  }
  enemy.position.x = THREE.MathUtils.clamp(enemy.position.x, -WORLD_SIZE, WORLD_SIZE);
  enemy.position.z = THREE.MathUtils.clamp(enemy.position.z, -WORLD_SIZE, WORLD_SIZE);
  setEntityGroundHeight(enemy);
  enemy.lookAt(camera.position.x, enemy.position.y, camera.position.z);
  enemy.children.forEach((child, childIndex) => {
    child.rotation.z += childIndex === 1 ? dt * (1.5 + index * 0.22) : 0;
  });

  authorTauntTimer -= dt;
  if (index === 0 && authorTauntTimer <= 0 && distance < 22) {
    playUserVoice();
    authorTauntTimer = distance < 9 ? 3.8 : 6.5;
  }

  panicTimer = Math.max(panicTimer, !safeZone && distance < 12 ? 0.35 : 0);
}

function updateAuthorYogurtTime(enemy, dt) {
  if (currentStage !== 4) {
    if (enemy.userData.yogurtIcon) enemy.userData.yogurtIcon.visible = false;
    if (enemy.userData.yogurtLabel) enemy.userData.yogurtLabel.visible = false;
    return;
  }
  if (!enemy.userData.hasYogurt) {
    if (enemy.userData.yogurtIcon) enemy.userData.yogurtIcon.visible = false;
    if (enemy.userData.yogurtLabel) enemy.userData.yogurtLabel.visible = false;
    return;
  }

  enemy.userData.yogurtIcon.visible = true;
  if (enemy.userData.yogurtTime > 0) {
    enemy.userData.yogurtTime = Math.max(0, enemy.userData.yogurtTime - dt);
    enemy.userData.yogurtLabel.visible = true;
    if (enemy.userData.yogurtTime <= 0) {
      enemy.userData.yogurtCooldown = THREE.MathUtils.randFloat(5.0, 9.5);
      enemy.userData.yogurtLabel.visible = false;
    }
    return;
  }

  enemy.userData.yogurtCooldown = Math.max(0, enemy.userData.yogurtCooldown - dt);
  enemy.userData.yogurtLabel.visible = false;
  if (enemy.userData.yogurtCooldown <= 0) {
    enemy.userData.yogurtTime = THREE.MathUtils.randFloat(2.2, 3.4);
    enemy.userData.yogurtCooldown = 99;
    if (yogurtTimeVoiceCooldown <= 0 && !playRecordedVoice(VOICE_FILES.yogurtTime, { volume: 0.96 })) {
      blip(740, 0.1, 0.11, 'triangle');
      setTimeout(() => blip(980, 0.12, 0.1, 'triangle'), 120);
    }
    yogurtTimeVoiceCooldown = 1.2;
  }
}

function handleStageFourAuthorContact(enemy) {
  if (moataroInvincibleTimer > 0) {
    spawnAuthorContactEffect(enemy, 0x77f4ff);
    return;
  }

  if (enemy.userData.hasYogurt && enemy.userData.yogurtTime > 0) {
    spawnAuthorContactEffect(enemy, 0x77f4ff);
    enemy.userData.hasYogurt = false;
    enemy.userData.yogurtTime = 0;
    enemy.userData.yogurtCooldown = 999;
    enemy.userData.yogurtIcon.visible = false;
    enemy.userData.yogurtLabel.visible = false;
    crystals++;
    totalSeals++;
    stolenYogurts++;
    energy = 100;
    playerHitCooldown = 0.9;
    playYogurtStolenVoice();
    if (canOpenEscapeGate() && !escapeOpen) {
      escapeOpen = true;
      activateFinalSwarm();
    }
    return;
  }

  if (enemy.userData.hasYogurt) {
    spawnAuthorContactEffect(enemy, 0xffd36a);
    return;
  }

  if (playerHitCooldown > 0) return;
  spawnAuthorContactEffect(enemy, 0xff5f7e);
  crystals = Math.max(0, crystals - 1);
  enemy.userData.hasYogurt = true;
  enemy.userData.yogurtTime = 0;
  enemy.userData.yogurtCooldown = THREE.MathUtils.randFloat(2.4, 5.2);
  if (enemy.userData.yogurtIcon) enemy.userData.yogurtIcon.visible = true;
  if (enemy.userData.yogurtLabel) enemy.userData.yogurtLabel.visible = false;
  escapeOpen = canOpenEscapeGate();
  playerHitCooldown = 1.35;
  screenShake = 0.18;
  blip(120, 0.18, 0.14, 'sawtooth');
  if (crystals <= 0) finishGame(false);
}

function updateRegularCustomers(dt) {
  if (currentStage !== 4 || !regularCustomers.length) return;
  const time = performance.now() * 0.001;
  regularCustomers.forEach((customer, index) => {
    customer.userData.turnTimer -= dt;
    if (customer.userData.turnTimer <= 0) {
      customer.userData.walkAngle += THREE.MathUtils.randFloat(-1.25, 1.25);
      customer.userData.turnTimer = THREE.MathUtils.randFloat(0.65, 1.9);
    }

    const centerPull = new THREE.Vector3(-customer.position.x, 0, -customer.position.z);
    const edgePressure = Math.max(Math.abs(customer.position.x), Math.abs(customer.position.z)) / WORLD_SIZE;
    const walkAngle = customer.userData.walkAngle + Math.sin(time * 0.95 + customer.userData.phase) * 0.62;
    const move = new THREE.Vector3(Math.cos(walkAngle), 0, Math.sin(walkAngle));
    if (moataroServiceActive) {
      const toShop = MOATARO_SERVICE.center.clone().add(new THREE.Vector3(
        Math.cos(index * 1.7) * 3.4,
        0,
        Math.sin(index * 1.7) * 3.4
      )).sub(customer.position).setY(0);
      if (toShop.lengthSq() > 0.2) move.add(toShop.normalize().multiplyScalar(1.25));
    }
    if (edgePressure > 0.76 && centerPull.lengthSq() > 0.01) {
      move.add(centerPull.normalize().multiplyScalar((edgePressure - 0.76) * 2.0));
    }
    move.normalize();
    const speed = (moataroServiceActive ? 3.15 : 2.35) + (index % 4) * 0.28;
    customer.position.x += move.x * speed * dt;
    customer.position.z += move.z * speed * dt;
    customer.position.x = THREE.MathUtils.clamp(customer.position.x, -WORLD_SIZE + 6, WORLD_SIZE - 6);
    customer.position.z = THREE.MathUtils.clamp(customer.position.z, -WORLD_SIZE + 6, WORLD_SIZE - 6);
    resolveObstacleCollisions(customer, 0.65, () => {
      customer.userData.walkAngle += Math.PI * 0.5;
    });
  });
}

function updateCeleryCustomers(dt) {
  if (currentStage !== 4 || !celeryCustomers.length) return;
  const time = performance.now() * 0.001;
  celeryCustomers.forEach((celery, index) => {
    celery.userData.hitCooldown = Math.max(0, (celery.userData.hitCooldown || 0) - dt);
    celery.userData.turnTimer -= dt;
    if (celery.userData.turnTimer <= 0) {
      celery.userData.walkAngle += THREE.MathUtils.randFloat(-1.35, 1.35);
      celery.userData.turnTimer = THREE.MathUtils.randFloat(0.6, 1.65);
    }

    const centerPull = new THREE.Vector3(-celery.position.x, 0, -celery.position.z);
    const edgePressure = Math.max(Math.abs(celery.position.x), Math.abs(celery.position.z)) / WORLD_SIZE;
    const roamDir = new THREE.Vector3(
      Math.cos(celery.userData.walkAngle + Math.sin(time * 1.15 + celery.userData.phase) * 0.72),
      0,
      Math.sin(celery.userData.walkAngle + Math.cos(time * 0.95 + celery.userData.phase) * 0.72)
    );
    if (edgePressure > 0.72 && centerPull.lengthSq() > 0.01) {
      roamDir.add(centerPull.normalize().multiplyScalar((edgePressure - 0.72) * 2.2));
    }
    roamDir.normalize();
    celery.position.x += roamDir.x * (3.05 + (index % 4) * 0.28) * dt;
    celery.position.z += roamDir.z * (3.05 + (index % 4) * 0.28) * dt;
    celery.position.x = THREE.MathUtils.clamp(celery.position.x, -WORLD_SIZE + 7, WORLD_SIZE - 7);
    celery.position.z = THREE.MathUtils.clamp(celery.position.z, -WORLD_SIZE + 7, WORLD_SIZE - 7);
    resolveObstacleCollisions(celery, celery.userData.collisionRadius || 0.9, () => {
      celery.userData.walkAngle += Math.PI * 0.55;
    });

    getActiveAuthors().forEach((enemy) => {
      if (celery.userData.hitCooldown > 0 || enemy.userData.downTimer > 0) return;
      const dx = celery.position.x - enemy.position.x;
      const dz = celery.position.z - enemy.position.z;
      if (Math.hypot(dx, dz) > 2.35) return;
      if (enemy.userData.hasYogurt) {
        dropAuthorYogurtFromCelery(enemy, celery);
      } else {
        downAuthorFromCelery(enemy, celery);
      }
      celery.userData.hitCooldown = 1.4;
    });
  });
}

function downAuthorFromCelery(enemy, celery) {
  enemy.userData.downTimer = 3.0;
  enemy.userData.yogurtTime = 0;
  if (enemy.userData.yogurtLabel) enemy.userData.yogurtLabel.visible = false;
  if (enemy.userData.downLabel) enemy.userData.downLabel.visible = true;
  spawnContactEffectAt(enemy.position.clone().lerp(celery.position, 0.5), 0xbaff55);
  playCeleryDisgustVoice();
}

function dropAuthorYogurtFromCelery(enemy, celery) {
  enemy.userData.hasYogurt = false;
  enemy.userData.yogurtTime = 0;
  enemy.userData.yogurtCooldown = THREE.MathUtils.randFloat(4.0, 7.0);
  if (enemy.userData.yogurtIcon) enemy.userData.yogurtIcon.visible = false;
  if (enemy.userData.yogurtLabel) enemy.userData.yogurtLabel.visible = false;
  addCrystal(enemy.position.x + THREE.MathUtils.randFloatSpread(1.2), enemy.position.z + THREE.MathUtils.randFloatSpread(1.2), true);
  spawnContactEffectAt(enemy.position.clone().lerp(celery.position, 0.5), 0x9dff3f);
  playCeleryDisgustVoice();
}

function playCeleryDisgustVoice() {
  playVoiceCue('bad');
  blip(180, 0.08, 0.12, 'sawtooth');
  setTimeout(() => blip(150, 0.1, 0.1, 'sawtooth'), 90);
  if (!playRecordedVoice(VOICE_FILES.bad, { volume: 0.95 })) {
    speakText('まずい！', { rate: 1.15, pitch: 0.72, volume: 0.9 });
  }
}

function speakMoataroLine() {
  primeSpeech();
  const line = MOATARO_LINE_VOICES[Math.floor(Math.random() * MOATARO_LINE_VOICES.length)];
  moataroServiceLine = line.text;
  moataroServiceVoiceSrc = line.src;
  if (hud.shopLine) hud.shopLine.textContent = 'おすわりモアイを購入しますか？';
  const clerk = authors[0];
  if (clerk?.userData.serviceLabel) {
    setTextSprite(clerk.userData.serviceLabel, moataroServiceLine, '#fff6cf', 24);
    clerk.userData.serviceLabel.visible = true;
  }
  if (!playRecordedVoice(moataroServiceVoiceSrc)) {
    speakText(moataroServiceLine, { rate: 1.05, pitch: 0.92, volume: 0.95 });
  }
}

function updateMoataroShopDialog() {
  if (hud.shop) hud.shop.style.display = 'none';
  const shouldShowFloating = moataroServiceActive && !moataroMoaiPurchased;
  if (hud.serviceMenu) {
    hud.serviceMenu.style.display = shouldShowFloating ? 'flex' : 'none';
  }
}

function updateMoataroService(dt) {
  const active = isInMoataroServiceZone();
  if (active && !moataroServiceActive) {
    moataroServiceActive = true;
    moataroPromptDismissed = false;
    moataroSpeechTimer = 0;
    speakMoataroLine();
    updateMoataroShopDialog();
  } else if (!active && moataroServiceActive) {
    moataroServiceActive = false;
    moataroPromptDismissed = false;
    updateMoataroShopDialog();
    if (authors[0]?.userData.serviceLabel) authors[0].userData.serviceLabel.visible = false;
  }

  if (!moataroServiceActive) {
    updatePetMoai(dt);
    return;
  }

  moataroSpeechTimer -= dt;
  if (moataroSpeechTimer <= 0) {
    speakMoataroLine();
    moataroSpeechTimer = THREE.MathUtils.randFloat(5.0, 8.0);
  }

  updateMoataroShopDialog();
  updatePetMoai(dt);
}

function updatePetMoaiTexture() {
  const sprite = petMoai.children[0];
  if (!sprite) return;
  let texturePath = './moai_shot.png';
  if (chosenMoaiType === 2) texturePath = './moai_lure.png';
  if (chosenMoaiType === 3) texturePath = './moai_glasses.png';
  
  const texture = textureLoader.load(texturePath);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.flipY = true;
  sprite.material.map = texture;
  sprite.material.needsUpdate = true;
}

function playRivalEncounterSound() {
  const tones = [220, 330, 440, 660, 880, 660, 440, 330, 220];
  tones.forEach((freq, idx) => {
    setTimeout(() => {
      blip(freq, 0.14, 0.15, 'sawtooth');
    }, idx * 80);
  });
}

function startRivalChase() {
  if (hud.rivalDialog) hud.rivalDialog.style.display = 'none';

  // Reset other authors to their fixed default spots and change their texture to attacker.png (dynamic mode change!)
  authors.forEach((enemy, index) => {
    if (index > 0) {
      const sprite = enemy.children[0];
      if (sprite && sprite.material) {
        sprite.material.map = attackerTexture;
        sprite.material.needsUpdate = true;
      }

      const starts = [
        [-52, -6],
        [52, -20],
        [-42, 44],
        [36, 52],
        [0, -48],
        [-58, 18],
        [58, 20],
      ];
      const startPos = starts[index];
      if (startPos) {
        enemy.position.set(startPos[0], 0, startPos[1]);
        setEntityGroundHeight(enemy);
      }
    }
  });

  moataroPromptDismissed = true;
  moataroClerkSafeTimer = 6.0; // Now clerk starts chasing soon!
  updateMoataroShopDialog();
  showMoataroThanks();

  blip(880, 0.12, 0.12, 'triangle');
  setTimeout(() => blip(1320, 0.16, 0.1, 'triangle'), 120);
}

function buyMoataroMoai(type = 1) {
  if (moataroMoaiPurchased) return;
  chosenMoaiType = type;
  updatePetMoaiTexture();
  moataroMoaiPurchased = true;
  
  moataroInvincibleTimer = 4.0;
  moataroClerkSafeTimer = 999.0; // Keep clerk safe during cutscene dialog
  moataroPromptDismissed = false; // Lock actions
  
  petMoai.visible = true;
  petMoai.position.copy(moai.position).add(new THREE.Vector3(0, 0, 3.2));

  playRivalEncounterSound();
  screenShake = 0.55;

  if (hud.rivalDialog) {
    hud.rivalDialog.style.display = 'block';
  }
}

function createDarkMarketBoothStructure(x, z) {
  // A large dark wooden table
  const table = new THREE.Mesh(
    new THREE.BoxGeometry(10.8, 1.4, 6.2),
    new THREE.MeshStandardMaterial({ color: 0x140c06, roughness: 0.95 })
  );
  table.position.set(x, 0.7, z);
  table.castShadow = true;
  table.receiveShadow = true;
  world.add(table);
  props.push(table);
  addBoxCollider(x, z, 11.2, 6.8);

  // Black cloth covering the front and sides
  const cloth = new THREE.Mesh(
    new THREE.BoxGeometry(11.2, 0.22, 6.6),
    new THREE.MeshStandardMaterial({ color: 0x221133, emissive: 0x110022, emissiveIntensity: 0.15, roughness: 0.85 })
  );
  cloth.position.set(x, 1.45, z);
  cloth.castShadow = true;
  world.add(cloth);
  props.push(cloth);

  const frontDrape = new THREE.Mesh(
    new THREE.BoxGeometry(11.4, 1.3, 0.22),
    new THREE.MeshStandardMaterial({ color: 0x221133, emissive: 0x110022, emissiveIntensity: 0.12, roughness: 0.9 })
  );
  frontDrape.position.set(x, 0.75, z + 3.18);
  frontDrape.castShadow = true;
  world.add(frontDrape);
  props.push(frontDrape);

  // Dark Market custom signboard "闇の取引所 ~SECRET DEALER~"
  const signTex = createDarkSignTexture();
  const signMat = new THREE.MeshBasicMaterial({ map: signTex, transparent: true, side: THREE.DoubleSide });
  const signMesh = new THREE.Mesh(new THREE.PlaneGeometry(8.5, 2.2), signMat);
  signMesh.position.set(x, 2.4, z + 3.28);
  signMesh.rotation.y = Math.PI; // Face the correct way (front of the booth)
  world.add(signMesh);
  props.push(signMesh);

  // Purple glow lantern spotlights (placed on the table sides)
  const leftLantern = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.3, 1.2, 8),
    new THREE.MeshStandardMaterial({ color: 0xa020f0, emissive: 0xa020f0, emissiveIntensity: 1.5, transparent: true, opacity: 0.88 })
  );
  leftLantern.position.set(x - 4.2, 2.1, z + 2.0);
  world.add(leftLantern);
  props.push(leftLantern);

  const rightLantern = leftLantern.clone();
  rightLantern.position.x = x + 4.2;
  world.add(rightLantern);
  props.push(rightLantern);

  // Place miniature dark Moais on the table!
  const miniMoaiTex = textureLoader.load('./moai_shot.png');
  const tints = [0x5a3a7b, 0x4a2a6b, 0xd4af37, 0x556b2f, 0x2e8b57, 0x8b0000]; // Purple, Dark Purple, Gold, Dark Green, Green, Dark Red

  // Create two dense rows of miniature Moais (front row and back row)
  const frontRowX = [-4.0, -3.0, -2.0, -1.0, 0, 1.0, 2.0, 3.0, 4.0];
  const backRowX = [-3.5, -2.5, -1.5, -0.5, 0.5, 1.5, 2.5, 3.5];

  // Front row (closer, lower)
  frontRowX.forEach((offsetX, idx) => {
    const color = tints[idx % tints.length];
    const mat = new THREE.MeshStandardMaterial({
      map: miniMoaiTex,
      color: color,
      emissive: color,
      emissiveIntensity: 0.55, // Strong glow in the dark
      transparent: true,
      roughness: 0.8
    });
    const miniMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.5), mat);
    miniMesh.position.set(x + offsetX, 2.2, z + 2.4);
    miniMesh.rotation.y = Math.PI;
    world.add(miniMesh);
    props.push(miniMesh);
  });

  // Back row (further, slightly raised)
  backRowX.forEach((offsetX, idx) => {
    const color = tints[(idx + 3) % tints.length];
    const mat = new THREE.MeshStandardMaterial({
      map: miniMoaiTex,
      color: color,
      emissive: color,
      emissiveIntensity: 0.55, // Strong glow in the dark
      transparent: true,
      roughness: 0.8
    });
    const miniMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.5), mat);
    miniMesh.position.set(x + offsetX, 2.4, z + 1.2);
    miniMesh.rotation.y = Math.PI;
    world.add(miniMesh);
    props.push(miniMesh);
  });
}

function createDarkMarket() {
  if (currentStage !== 4) return;
  
  const npcGroup = new THREE.Group();
  npcGroup.position.set(-45, 0, 36);
  
  const moaiTexture = textureLoader.load('./moai_shot.png');
  const moaiMat = new THREE.MeshStandardMaterial({
    map: moaiTexture,
    color: 0x5a3a7b, 
    emissive: 0x4a2a6b,
    emissiveIntensity: 0.45, // Add glow to shady merchant so he is visible
    transparent: true,
    roughness: 0.8,
  });
  const shadyMoai = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 4.2), moaiMat);
  shadyMoai.position.set(0, 3.2, 0); 
  shadyMoai.userData.isDarkMarketMerchant = true; 
  npcGroup.add(shadyMoai);
  
  darkMarketPointLight = new THREE.PointLight(0xa020f0, 0, 22);
  darkMarketPointLight.position.set(0, 4.5, 1.5);
  npcGroup.add(darkMarketPointLight);
  
  world.add(npcGroup);
  darkMarketNpc = npcGroup;
}

function createDarkSignTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#0a0518';
  ctx.fillRect(0, 0, 256, 128);
  ctx.strokeStyle = '#a020f0';
  ctx.lineWidth = 5;
  ctx.strokeRect(8, 8, 240, 112);
  
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('闇の取引所', 128, 46);
  
  ctx.fillStyle = '#ff77ff';
  ctx.font = '14px sans-serif';
  ctx.fillText('~SECRET DEALER~', 128, 85);
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function updateDarkMarketZone(dt) {
  if (currentStage !== 4 || !darkMarketNpc) return;
  
  const dist = moai.position.distanceTo(darkMarketNpc.position);
  const inZone = dist < 12.0; // Narrowed from 16 to 12
  
  if (inZone !== inDarkMarketZone) {
    inDarkMarketZone = inZone;
    if (inDarkMarketZone) {
      startDarkMarketBgm();
    } else {
      stopDarkMarketBgm();
    }
  }
  
  if (sun && hemiLight && darkMarketPointLight) {
    const targetSun = inDarkMarketZone ? 0.08 : 2.4;
    const targetHemi = inDarkMarketZone ? 0.12 : 1.7;
    const targetPoint = inDarkMarketZone ? 5.5 : 0;
    
    sun.intensity = THREE.MathUtils.lerp(sun.intensity, targetSun, dt * 3.5);
    hemiLight.intensity = THREE.MathUtils.lerp(hemiLight.intensity, targetHemi, dt * 3.5);
    darkMarketPointLight.intensity = THREE.MathUtils.lerp(darkMarketPointLight.intensity, targetPoint, dt * 3.5);
  }
  
  const shadyMoai = darkMarketNpc.children.find(child => child.userData.isDarkMarketMerchant);
  if (shadyMoai) {
    shadyMoai.lookAt(camera.position.x, shadyMoai.parent.position.y + 3.2, camera.position.z);
  }

  // Auto-dialogue trigger on approach (narrowed from 8.5 to 6.0)
  const autoTriggerDist = 6.0;
  if (dist < autoTriggerDist && !darkMarketDialogueShown) {
    darkMarketDialogueShown = true;
    showDarkMarketDialog();
  }
}

function startDarkMarketBgm() {
  if (bgmGain) {
    bgmGain.gain.setTargetAtTime(0.002, audioCtx.currentTime, 0.4);
  }
  if (darkMarketBgmInterval) clearInterval(darkMarketBgmInterval);
  
  const notes = [
    147, 0, 165, 175, 0, 196, 175, 165,
    147, 131, 0, 147, 165, 0, 131, 110
  ];
  
  darkMarketBgmInterval = setInterval(() => {
    if (!inDarkMarketZone) return;
    const note = notes[darkMarketBgmSeq % notes.length];
    darkMarketBgmSeq++;
    
    if (note > 0) {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = 'square';
      osc.frequency.setValueAtTime(note * 1.5, audioCtx.currentTime);
      
      gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.22);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.24);
    }
  }, 180);
}

function stopDarkMarketBgm() {
  if (darkMarketBgmInterval) {
    clearInterval(darkMarketBgmInterval);
    darkMarketBgmInterval = null;
  }
  if (bgmGain) {
    bgmGain.gain.setTargetAtTime(0.085, audioCtx.currentTime, 0.4);
  }
}

function checkDarkMarketClick() {
  if (currentStage !== 4 || !darkMarketNpc) return;
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(darkMarketNpc.children);
  if (intersects.length > 0) {
    showDarkMarketDialog();
  }
}

function checkDarkMarketHover() {
  if (currentStage !== 4 || !darkMarketNpc) return;
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(darkMarketNpc.children);
  if (intersects.length > 0) {
    document.body.style.cursor = 'pointer';
    return true;
  }
  return false;
}

function showDarkMarketDialog() {
  gamePaused = true;
  stopMobileMove();
  keys.forward = false;
  keys.backward = false;
  keys.left = false;
  keys.right = false;
  keys.fire = false;
  
  const textEl = document.getElementById('dark-market-text');
  const yesBtn = document.getElementById('btn-dark-yes');
  const noBtn = document.getElementById('btn-dark-no');
  const closeBtn = document.getElementById('btn-dark-close');
  
  if (textEl) {
    textEl.textContent = '……フフフ、ここを見つけたか。\nお前、今週末のリアルHMJ（東京ビッグサイト）には来られそうか？';
  }
  if (yesBtn) yesBtn.style.display = 'inline-block';
  if (noBtn) noBtn.style.display = 'inline-block';
  if (closeBtn) closeBtn.style.display = 'none';
  
  const dialog = document.getElementById('dark-market-dialog');
  if (dialog) dialog.style.display = 'block';
  blip(440, 0.12, 0.12, 'sine');
}

function handleDarkMarketResponse(answer) {
  const textEl = document.getElementById('dark-market-text');
  const yesBtn = document.getElementById('btn-dark-yes');
  const noBtn = document.getElementById('btn-dark-no');
  const closeBtn = document.getElementById('btn-dark-close');
  
  if (answer === 'yes') {
    if (textEl) {
      textEl.textContent = 'そうか！それは素晴らしい！ならリアル会場（ブース：J-80）で待っているぞ。\nお前の選んだモアイを、ぜひ直接手にとって連れて帰ってやってくれ！';
    }
    blip(880, 0.14, 0.12, 'sine');
  } else {
    if (textEl) {
      textEl.textContent = 'そうか……来られないか。寂しいことだ。\n……だが、がっかりするな。ならばイベントが終わったら、またここへ来るとよい。\nこのゲームを遊んでくれたお前だけの、特別な取引（お楽しみ）を用意しておこう……フフフ。';
    }
    blip(580, 0.14, 0.12, 'sine');
  }
  
  if (yesBtn) yesBtn.style.display = 'none';
  if (noBtn) noBtn.style.display = 'none';
  if (closeBtn) closeBtn.style.display = 'inline-block';
}

function closeDarkMarketDialog() {
  const dialog = document.getElementById('dark-market-dialog');
  if (dialog) dialog.style.display = 'none';
  gamePaused = false;
  blip(330, 0.1, 0.1, 'sine');
}

function checkStarterMoaiClick() {
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(starterMoais);
  if (intersects.length > 0) {
    const hitMoai = intersects[0].object;
    showMoaiConfirmation(hitMoai.userData.moaiType);
    document.body.style.cursor = 'default';
  }
}

function showMoaiConfirmation(type) {
  tempSelectedMoaiType = type;
  let name = '';
  let imgSrc = '';
  let no = '';
  let type1 = '🪨 いわ';
  let type2 = '';
  let category = '';
  let desc = '';
  
  if (type === 1) {
    name = 'おすわりモアイペン立て';
    imgSrc = './moai_shot.png';
    no = 'No. 215';
    type2 = '😊 黄昏れ';
    category = 'ペンたて';
    desc = 'いつも　じっと　すわっている。\nペンを　あずかることが　しごとだが、\nときどき　なにも　ささっていなくても\nまんぞくそうに　している。';
  } else if (type === 2) {
    name = 'まちょいモアイルアースタンド';
    imgSrc = './moai_lure.png';
    no = 'No. 216';
    type2 = '🎣 つり';
    category = 'ルアースタンド';
    desc = 'つれたことより\nルアーを　ながめる　じかんを\nなにより　たいせつにしている。\nルアーを　かけてもらえると\nとても　よろこぶ。';
  } else if (type === 3) {
    name = 'まちょいモアイメガネスタンド';
    imgSrc = './moai_glasses.png';
    no = 'No. 178';
    type2 = '💪 パワー';
    category = 'メガネスタンド';
    desc = 'メガネを　ささえるためだけに\nからだを　きたえつづけた。\nきんにくを　ほめられると\nちょっとだけ　うれしそうだ。';
  }
  
  if (hud.confirmTitle) hud.confirmTitle.textContent = name;
  if (hud.confirmImg) hud.confirmImg.src = imgSrc;
  if (hud.confirmNoLabel) hud.confirmNoLabel.textContent = no;
  if (hud.confirmType1) hud.confirmType1.textContent = type1;
  if (hud.confirmType2) hud.confirmType2.textContent = type2;
  if (hud.confirmCategory) hud.confirmCategory.textContent = category;
  if (hud.confirmDesc) hud.confirmDesc.textContent = desc;
  
  if (hud.confirmDialog) {
    hud.confirmDialog.style.display = 'flex';
  }
}

function openCatalogPause(searchName = '') {
  gamePaused = true;
  stopMobileMove();
  keys.forward = false;
  keys.backward = false;
  keys.left = false;
  keys.right = false;
  keys.fire = false;
  if (hud.shop) hud.shop.style.display = 'none';
  
  let url = 'catalog.html?v=20260526_1';
  if (searchName) {
    url += '&search=' + encodeURIComponent(searchName);
  }
  if (hud.catalogFrame) {
    hud.catalogFrame.src = url;
  }
  if (hud.catalogOverlay) hud.catalogOverlay.style.display = 'block';
  if (bgmGain) bgmGain.gain.setTargetAtTime(0.018, audioCtx.currentTime, 0.08);
}

function closeCatalogPause() {
  gamePaused = false;
  if (hud.catalogOverlay) hud.catalogOverlay.style.display = 'none';
  if (bgmGain) bgmGain.gain.setTargetAtTime(0.085, audioCtx.currentTime, 0.14);
}

function showMoataroThanks() {
  primeSpeech();
  const message = 'ありがとうございました';
  const clerk = authors[0];
  if (clerk?.userData.serviceLabel) {
    setTextSprite(clerk.userData.serviceLabel, message, '#fff6cf', 26);
    clerk.userData.serviceLabel.visible = true;
  }
  if (!playRecordedVoice(VOICE_FILES.thanks)) {
    speakText(message, { rate: 1.05, pitch: 0.95, volume: 0.95 });
  }
}

function updatePetMoai(dt) {
  if (!moataroMoaiPurchased) {
    petMoai.visible = false;
    return;
  }
  petMoai.visible = true;
  const behind = moai.position.clone().add(new THREE.Vector3(Math.sin(cameraYaw) * 3.1, 0, Math.cos(cameraYaw) * 3.1));
  behind.y = getGroundHeight(behind.x, behind.z);
  petMoai.position.lerp(behind, 1 - Math.pow(0.001, dt));
  petMoai.children.forEach((child) => {
    if (child.userData.faceCamera && !child.isSprite) child.lookAt(camera.position);
  });
}

function spawnAuthorContactEffect(enemy, color) {
  if ((enemy.userData.contactFxCooldown || 0) > 0) return;
  enemy.userData.contactFxCooldown = 0.55;
  spawnContactEffectAt(moai.position.clone().lerp(enemy.position, 0.5), color);
}

function spawnContactEffectAt(position, color) {
  const group = new THREE.Group();
  group.position.set(position.x, getGroundHeight(position.x, position.z) + 0.08, position.z);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.05, 0.055, 8, 32),
    new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 1.3,
      transparent: true,
      opacity: 0.86,
      roughness: 0.25,
    })
  );
  ring.rotation.x = Math.PI / 2;
  group.add(ring);

  const flash = new THREE.Mesh(
    new THREE.PlaneGeometry(1.4, 1.4),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.58,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  flash.position.y = 1.6;
  flash.userData.faceCamera = true;
  group.add(flash);

  group.userData.life = 0.34;
  group.userData.maxLife = 0.34;
  contactEffects.push(group);
  world.add(group);
}

function updateContactEffects(dt) {
  for (let i = contactEffects.length - 1; i >= 0; i--) {
    const effect = contactEffects[i];
    effect.userData.life -= dt;
    const t = Math.max(0, effect.userData.life / effect.userData.maxLife);
    effect.scale.setScalar(1 + (1 - t) * 1.65);
    effect.children.forEach((child) => {
      if (child.userData.faceCamera) child.lookAt(camera.position);
      if (child.material && 'opacity' in child.material) child.material.opacity = Math.min(child.material.opacity, t * 0.86);
    });
    if (effect.userData.life <= 0) {
      world.remove(effect);
      contactEffects.splice(i, 1);
    }
  }
}

function getAuthorTarget(enemy, activeIndex) {
  if (currentStage === 3 && helperTimer > 0 && blueHelper.visible) {
    const brain = enemy.userData.ai || createAuthorBrain(activeIndex);
    const angle = performance.now() * 0.0015 + brain.phase;
    return blueHelper.position.clone().add(new THREE.Vector3(Math.cos(angle) * 3.2, 0, Math.sin(angle) * 3.2));
  }
  const brain = enemy.userData.ai || createAuthorBrain(activeIndex);
  const velocity = playerVelocity.lengthSq() > 0.1
    ? playerVelocity.clone().normalize()
    : new THREE.Vector3(-Math.sin(cameraYaw), 0, -Math.cos(cameraYaw));
  const side = new THREE.Vector3(-velocity.z, 0, velocity.x);
  const predicted = moai.position.clone().add(velocity.clone().multiplyScalar(brain.prediction * 8));
  const pulse = Math.sin(performance.now() * 0.0017 + brain.phase) * 2.2;

  if (brain.role === 'leftFlank') {
    return predicted.add(side.multiplyScalar(brain.orbit + pulse));
  }
  if (brain.role === 'rightFlank') {
    return predicted.add(side.multiplyScalar(-brain.orbit + pulse));
  }
  if (brain.role === 'ambush') {
    return moai.position.clone().add(velocity.multiplyScalar(13 + pulse)).add(side.multiplyScalar(Math.sin(brain.phase) * 4));
  }
  if (brain.role === 'gateCut') {
    const toGate = escapeGate.position.clone().sub(moai.position).setY(0);
    const gateDir = toGate.lengthSq() > 0.1 ? toGate.normalize() : velocity;
    return moai.position.clone().add(gateDir.multiplyScalar(12)).add(side.multiplyScalar(pulse));
  }
  if (brain.role === 'wideLeft') {
    return predicted.add(side.multiplyScalar(16 + pulse)).add(velocity.clone().multiplyScalar(-4));
  }
  if (brain.role === 'rearPush') {
    return moai.position.clone().add(velocity.multiplyScalar(-7)).add(side.multiplyScalar(pulse * 0.8));
  }
  return predicted;
}

function getSeparationVector(enemy) {
  const repel = new THREE.Vector3();
  getActiveAuthors().forEach((other) => {
    if (other === enemy) return;
    const away = enemy.position.clone().sub(other.position);
    const distanceSq = away.lengthSq();
    if (distanceSq > 0.001 && distanceSq < 36) {
      repel.add(away.normalize().multiplyScalar((36 - distanceSq) / 36));
    }
  });
  return repel;
}

function updateShots(dt) {
  updateShotArray(playerShots, dt, (shot, index) => {
    if (shot.position.distanceTo(author.position) < 2.2) {
      authorHealth -= 8 + crystals * 0.5;
      screenShake = 0.18;
      removeShot(playerShots, index);
      blip(95, 0.13, 0.12, 'sawtooth');
      if (authorHealth <= 0) finishGame(true);
    }
  });

  updateShotArray(authorShots, dt, (shot, index) => {
    if (shot.position.distanceTo(moai.position) < 1.25) {
      playerHealth -= 11;
      screenShake = 0.25;
      removeShot(authorShots, index);
      if (playerHealth <= 0) finishGame(false);
    }
  });
}

function updateShotArray(shots, dt, hitCheck) {
  for (let i = shots.length - 1; i >= 0; i--) {
    const shot = shots[i];
    shot.position.addScaledVector(shot.userData.velocity, dt);
    shot.userData.life -= dt;
    shot.scale.setScalar(1 + Math.sin(performance.now() * 0.03 + i) * 0.12);
    hitCheck(shot, i);
    if (!shots.includes(shot)) continue;
    if (shot.userData.life <= 0 || Math.abs(shot.position.x) > WORLD_SIZE + 15 || Math.abs(shot.position.z) > WORLD_SIZE + 15) {
      removeShot(shots, i);
    }
  }
}

function removeShot(shots, index) {
  const [shot] = shots.splice(index, 1);
  if (shot) scene.remove(shot);
}

function updatePickups(dt) {
  for (let i = pickupCrystals.length - 1; i >= 0; i--) {
    const crystal = pickupCrystals[i];
    crystal.lookAt(camera.position.x, crystal.position.y, camera.position.z);
    crystal.rotation.z = Math.sin(performance.now() * 0.004 + i) * 0.08;
    crystal.position.y = crystal.userData.baseY + Math.sin(performance.now() * 0.003 + i) * 0.18;
    if (crystal.position.distanceTo(moai.position) < 1.8) {
      crystals++;
      totalSeals++;
      if (currentStage === 4 && crystal.userData.fromAuthor) stolenYogurts++;
      energy = 100;
      playerHealth = Math.min(100, playerHealth + 9);
      world.remove(crystal);
      pickupCrystals.splice(i, 1);
      blip(980, 0.16, 0.1, 'triangle');
      if (canOpenEscapeGate() && !escapeOpen) {
        escapeOpen = true;
        activateFinalSwarm();
        blip(1240, 0.35, 0.12, 'triangle');
      }
    }
  }

  const portal = escapeGate.children.find((child) => child.userData.portal);
  if (portal && portal.material) {
    portal.material.emissiveIntensity = escapeOpen ? 1.8 + Math.sin(performance.now() * 0.01) * 0.45 : 0.18;
    portal.material.opacity = escapeOpen ? 0.92 : 0.32;
    portal.material.transparent = true;
  }
  
  const beacon = escapeGate.children.find((child) => child.userData.beacon);
  if (beacon && beacon.material) {
    const baseOpacity = escapeOpen ? 0.48 : 0.15;
    beacon.material.opacity = baseOpacity + Math.sin(performance.now() * 0.005) * 0.1;
    beacon.rotation.y += 0.008;
  }
  
  escapeGate.rotation.y = Math.sin(performance.now() * 0.001) * 0.08;

  if (escapeOpen && moai.position.distanceTo(escapeGate.position) < 4.7) {
    finishGame(true);
  }
}

function updateTeleportRings(dt) {
  if (currentStage !== 2 || !teleportRings.length) return;
  teleportCooldown = Math.max(0, teleportCooldown - dt);

  teleportRings.forEach((ring, index) => {
    ring.rotation.y += dt * (0.22 + index * 0.04);
    ring.children.forEach((child, childIndex) => {
      if (!child.material) return;
      const glow = 0.75 + Math.sin(performance.now() * 0.004 + index + childIndex * 0.7) * 0.35;
      if ('opacity' in child.material) child.material.opacity = childIndex === 2 ? 0.08 + glow * 0.08 : 0.16 + glow * 0.42;
      if ('emissiveIntensity' in child.material) child.material.emissiveIntensity = 0.95 + glow * 1.35;
    });
  });

  if (teleportCooldown > 0) return;

  const activeRingIndex = teleportRings.findIndex((ring) => {
    const flatDistance = new THREE.Vector2(moai.position.x - ring.position.x, moai.position.z - ring.position.z).length();
    return flatDistance < 4.6;
  });
  if (activeRingIndex < 0) return;

  const source = teleportRings[activeRingIndex];
  const target = teleportRings[source.userData.targetIndex] || teleportRings[(activeRingIndex + 1) % teleportRings.length];
  const exitDirection = escapeGate.position.clone().sub(target.position).setY(0);
  if (exitDirection.lengthSq() < 0.1) exitDirection.set(0, 0, 1);
  exitDirection.normalize();
  moai.position.copy(target.position).add(exitDirection.multiplyScalar(6.8));
  moai.position.y = 0;
  playerVelocity.set(0, 0, 0);
  energy = Math.max(18, energy - 18);
  teleportCooldown = 1.25;
  teleportAlertTimer = 4.2;
  panicTimer = Math.max(panicTimer, 0.6);
  screenShake = 0.45;
  pullAuthorsTowardTeleport(target.position);
  blip(1320, 0.08, 0.11, 'triangle');
  setTimeout(() => blip(660, 0.14, 0.09, 'sine'), 80);
}

function pullAuthorsTowardTeleport(targetPosition) {
  getActiveAuthors().forEach((enemy, index) => {
    const toTarget = targetPosition.clone().sub(enemy.position).setY(0);
    if (toTarget.lengthSq() < 1) return;
    const pullDistance = 7.5 + index * 0.9;
    enemy.position.add(toTarget.normalize().multiplyScalar(pullDistance));
    enemy.position.x = THREE.MathUtils.clamp(enemy.position.x, -WORLD_SIZE, WORLD_SIZE);
    enemy.position.z = THREE.MathUtils.clamp(enemy.position.z, -WORLD_SIZE, WORLD_SIZE);
  });
}

function activateFinalSwarm() {
  finalSwarmActive = true;
  const spawnAngles = [0.1, 0.95, 1.85, 2.75, 3.65, 4.55, 5.45];
  authors.forEach((enemy, index) => {
    if (!enemy.userData.ai) enemy.userData.ai = createAuthorBrain(index);
    enemy.userData.ai.active = true;
    enemy.visible = true;
    if (index >= INITIAL_AUTHOR_COUNT) {
      const angle = spawnAngles[index] || (index / FINAL_AUTHOR_COUNT) * Math.PI * 2;
      const radius = 34 + index * 1.8;
      const x = THREE.MathUtils.clamp(moai.position.x + Math.cos(angle) * radius, -WORLD_SIZE + 6, WORLD_SIZE - 6);
      const z = THREE.MathUtils.clamp(moai.position.z + Math.sin(angle) * radius, -WORLD_SIZE + 6, WORLD_SIZE - 6);
      enemy.position.set(x, 0, z);
    }
  });
  screenShake = 0.55;
  playUserVoice();
  blip(110, 0.22, 0.16, 'sawtooth');
  setTimeout(() => blip(92, 0.22, 0.16, 'sawtooth'), 180);
  setTimeout(() => blip(73, 0.32, 0.18, 'sawtooth'), 360);
}

function updateCamera(dt) {

  const desiredDistance = THREE.MathUtils.lerp(cameraDistance, keys.fire && energy > 3 ? 12.5 : 10.5, 1 - Math.pow(0.001, dt));
  cameraDistance = desiredDistance;
  const horizontal = Math.cos(cameraPitch) * desiredDistance;
  const desired = moai.position.clone().add(new THREE.Vector3(
    Math.sin(cameraYaw) * horizontal,
    2.2 + Math.sin(cameraPitch) * desiredDistance,
    Math.cos(cameraYaw) * horizontal
  ));

  if (screenShake > 0) {
    desired.x += THREE.MathUtils.randFloatSpread(screenShake);
    desired.y += THREE.MathUtils.randFloatSpread(screenShake);
    screenShake = Math.max(0, screenShake - dt);
  }
  camera.position.lerp(desired, 1 - Math.pow(0.00005, dt));
  const nearestAuthor = getNearestAuthor();
  const authorDistance = moai.position.distanceTo(nearestAuthor.position);
  const lookBlend = THREE.MathUtils.clamp((24 - authorDistance) / 44, 0, 0.28);
  const lookTarget = moai.position.clone().lerp(nearestAuthor.position, lookBlend).add(new THREE.Vector3(0, 1.85, 0));
  camera.lookAt(lookTarget);
}

function finishGame(won) {
  if (gameOver) return;
  gameOver = true;
  victory = won;
  stopBgm();
  const title = won ? `${getStageConfig().name} 脱出成功！` : '作者につかまった';
  const body = won
    ? 'ゲートから逃げ切った。好きなステージを選んでもう一度挑戦。'
    : '足音が近い時は視点を回して進路を作り、SPACE/SHIFTでダッシュ。タップで再挑戦。';

  let couponHtml = '';
  if (won && currentStage === 4) {
    let moaiName = 'おすわりモアイペン立て';
    let moaiImg = './moai_shot.png';
    if (chosenMoaiType === 2) {
      moaiName = 'まちょいモアイルアースタンド';
      moaiImg = './moai_lure.png';
    } else if (chosenMoaiType === 3) {
      moaiName = 'まちょいモアイメガネスタンド';
      moaiImg = './moai_glasses.png';
    }

    couponHtml = `
      <div style="background: linear-gradient(135deg, #1e2d38, #0b151b); border: 3px dashed #ffbc69; border-radius: 12px; padding: 18px; margin: 15px auto 20px; max-width: 440px; box-shadow: 0 12px 32px rgba(0,0,0,0.6); text-align: center; box-sizing: border-box;">
        <h3 style="color: #ffbc69; margin: 0 0 8px 0; font-size: 17px; font-weight: 900; letter-spacing: 1px;">🎁 クーポン獲得！ 🎁</h3>
        <p style="margin: 0 0 12px 0; font-size: 13px; color: #fff6cf; font-weight: bold; line-height: 1.45;">おめでとうございます！あなたが選んだ<br><span style="color:#ffd700; font-size:14px;">「${moaiName}」</span>の割引特典です！</p>
        
        <div style="display: flex; align-items: center; justify-content: center; gap: 15px; margin: 10px 0 14px;">
          <img src="${moaiImg}" alt="moai" style="width: 80px; height: 95px; object-fit: contain; filter: drop-shadow(0 6px 12px rgba(0,0,0,0.55)); background: rgba(255,255,255,0.06); padding: 6px; border-radius: 8px; border: 1.5px solid rgba(255,255,255,0.12);">
          <div style="text-align: left;">
            <div style="font-size: 16px; font-weight: 900; color: #77f4ff; margin-bottom: 2px;">特典：300円引き</div>
            <div style="font-size: 10px; color: rgba(255,255,255,0.6); line-height: 1.3;">※お会計時に本画面をご提示ください。<br>※他クーポンとの併用はできません。</div>
          </div>
        </div>

        <div style="background: rgba(255, 215, 0, 0.12); color: #ffd700; border: 2.2px solid #ffd700; font-size: 15px; font-weight: 900; padding: 12px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); font-family: 'DotGothic16', sans-serif; line-height: 1.5; display: inline-block; width: 100%; box-sizing: border-box; text-shadow: 0 1px 4px rgba(0,0,0,0.8);">
          📍 HMJブース: J-80<br>Kanazawa Moataroブースで待っているよ！
        </div>
        
        <div style="margin-top: 14px; font-size: 12px; color: #ff5555; font-weight: 900; letter-spacing: 0.5px; animation: pulse 1s infinite alternate;">
          📸 この画面をスクリーンショットして保存してください！
        </div>
      </div>
    `;
  }

  hud.start.style.display = 'flex';
  hud.start.style.opacity = '1';
  hud.start.innerHTML = `
    <div class="start-card open-world-card">
      <h1>${title}</h1>
      <p class="tap-msg">${body}</p>
      ${couponHtml}
      <div class="mission-readout">
        <span>ステージ 4 (HMJ HALL)</span>
        <span>ヨーグルト ${crystals}</span>
        <span>スタミナ ${Math.max(0, Math.round(energy))}</span>
      </div>
      <div class="stage-select">
        <button class="stage-button" type="button" data-stage="4" style="font-size: 16px; padding: 14px 28px; min-width: 180px;">もう一度挑戦<br><span>STAGE 4: HMJ HALL</span></button>
      </div>
    </div>
  `;
  startBgm('menu');
}

function resetGame(stage = 4) {
  gameStarted = true;
  gameOver = false;
  victory = false;
  playerHealth = 100;
  authorHealth = 140;
  energy = 100;
  currentStage = THREE.MathUtils.clamp(Number(stage) || 1, 1, STAGES.length);
  crystals = currentStage === 4 ? 2 : 0;
  totalSeals = currentStage === 4 ? 2 : 0;
  stolenYogurts = 0;
  escapeOpen = false;
  finalSwarmActive = false;
  panicTimer = 0;
  stageTransitionTimer = 0;
  teleportCooldown = 0;
  teleportAlertTimer = 0;
  playerHitCooldown = 0;
  helperTimer = 0;
  helperCooldown = 0;
  helperTurnTimer = 0;
  helperVelocity.set(0, 0, 0);
  blueHelper.visible = false;
  moataroServiceActive = false;
  moataroSpeechTimer = 0;
  moataroPromptDismissed = false;
  moataroMoaiPurchased = false;

  // Restore every author sprite texture to user.png on game start/restart
  authors.forEach((enemy) => {
    const sprite = enemy.children[0];
    if (sprite && sprite.material) {
      sprite.material.map = userTexture;
      sprite.material.needsUpdate = true;
    }
  });

  inDarkMarketZone = false;
  stopDarkMarketBgm();
  darkMarketNpc = null;
  darkMarketDialogueShown = false;
  const darkMarketDialog = document.getElementById('dark-market-dialog');
  if (darkMarketDialog) darkMarketDialog.style.display = 'none';
  moataroInvincibleTimer = 0;
  moataroClerkSafeTimer = 0;
  yogurtTimeVoiceCooldown = 0;
  hudUpdateTimer = 0;
  petMoai.visible = false;
  if (hud.shop) hud.shop.style.display = 'none';
  if (authors[0]?.userData.serviceLabel) authors[0].userData.serviceLabel.visible = false;
  fireCooldown = 0;
  authorFireCooldown = 1.0;
  authorTauntTimer = 1.4;
  screenShake = 0;
  cameraYaw = Math.PI;
  cameraPitch = 0.46;
  cameraDistance = 10.5;
  playerVelocity.set(0, 0, 0);
  helperVelocity.set(0, 0, 0);
  stopMobileMove();

  playerShots.splice(0).forEach((shot) => scene.remove(shot));
  authorShots.splice(0).forEach((shot) => scene.remove(shot));
  pickupCrystals.splice(0).forEach((crystal) => world.remove(crystal));

  createWorld();
  moai.position.fromArray(getStageConfig().start);
  setEntityGroundHeight(moai);
  moai.rotation.set(0, 0, 0);
  resetAuthorPositions();

  if (hud.start) hud.start.style.display = 'none';
  if (audioCtx.state === 'suspended') audioCtx.resume();
  startBgm('game');
}

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.033);

  if (gameStarted && !gameOver && !gamePaused) {
    fireCooldown = Math.max(0, fireCooldown - dt);
    cameraYaw += (Number(keys.lookLeft) - Number(keys.lookRight)) * 2.8 * dt;
    panicTimer = Math.max(0, panicTimer - dt);
    stageTransitionTimer = Math.max(0, stageTransitionTimer - dt);
    teleportAlertTimer = Math.max(0, teleportAlertTimer - dt);
    playerHitCooldown = Math.max(0, playerHitCooldown - dt);
    moataroInvincibleTimer = Math.max(0, moataroInvincibleTimer - dt);
    moataroClerkSafeTimer = Math.max(0, moataroClerkSafeTimer - dt);
    yogurtTimeVoiceCooldown = Math.max(0, yogurtTimeVoiceCooldown - dt);
    movePlayer(dt);
    updateBlueHelper(dt);
    updateAuthors(dt);
    updateRegularCustomers(dt);
    updateCeleryCustomers(dt);
    updateMoataroService(dt);
    updateShots(dt);
    updatePickups(dt);
    updateTeleportRings(dt);
    updateContactEffects(dt);
    updateDarkMarketZone(dt);
    if (currentStage === 4 && !moataroMoaiPurchased && guideArrow) {
      guideArrow.visible = true;
      guideArrow.position.copy(moai.position).add(new THREE.Vector3(0, 3.8 + Math.sin(performance.now() * 0.0055) * 0.25, 0));
      const targetPos = MOATARO_SERVICE.center.clone();
      targetPos.y = guideArrow.position.y;
      guideArrow.lookAt(targetPos);
    } else if (guideArrow) {
      guideArrow.visible = false;
    }
  }

  props.forEach((prop) => {
    if (prop.userData.slowSpin) prop.rotation.y += prop.userData.slowSpin * dt;
    if (prop.userData.slowBob !== undefined) prop.position.y = prop.userData.baseY + Math.sin(performance.now() * 0.002 + prop.userData.slowBob) * 0.08;
    if (prop.userData.faceCamera && !prop.isSprite) prop.lookAt(camera.position);
    if (prop.userData.pulse && prop.material) {
      const glow = 0.75 + Math.sin(performance.now() * 0.0028 + prop.userData.pulse) * 0.35;
      if ('opacity' in prop.material) prop.material.opacity = THREE.MathUtils.clamp(glow * 0.22, 0.08, 0.82);
      if ('emissiveIntensity' in prop.material) prop.material.emissiveIntensity = 0.75 + glow * 0.85;
    }
  });

  updateCamera(dt);
  hudUpdateTimer -= dt;
  if (hudUpdateTimer <= 0) {
    setHud();
    hudUpdateTimer = IS_MOBILE_DEVICE ? 0.12 : 0.08;
  }
  renderer.render(scene, camera);
}

function bindKey(code, pressed) {
  if (code === 'KeyW' || code === 'ArrowUp') keys.forward = pressed;
  if (code === 'KeyS' || code === 'ArrowDown') keys.backward = pressed;
  if (code === 'KeyA' || code === 'ArrowLeft') keys.left = pressed;
  if (code === 'KeyD' || code === 'ArrowRight') keys.right = pressed;
  if (code === 'Space' || code === 'ShiftLeft' || code === 'ShiftRight' || code === 'KeyJ' || code === 'KeyK') keys.fire = pressed;
  if (code === 'KeyH' || code === 'KeyL') keys.help = pressed;
  if (pressed && (code === 'KeyH' || code === 'KeyL')) activateBlueHelper();
  if (code === 'KeyQ') keys.lookLeft = pressed;
  if (code === 'KeyE') keys.lookRight = pressed;
}

window.addEventListener('keydown', (event) => {
  bindKey(event.code, true);
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) event.preventDefault();
});

window.addEventListener('keyup', (event) => {
  bindKey(event.code, false);
});

window.addEventListener('pointermove', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  
  let hovered = false;
  if (moataroServiceActive && !moataroMoaiPurchased) {
    hovered = checkStarterMoaiHover();
  }
  if (!hovered) {
    checkDarkMarketHover();
  }
});

window.addEventListener('pointerdown', (event) => {
  if (isTouchUiTarget(event)) return;
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  
  if (moataroServiceActive && !moataroMoaiPurchased) {
    checkStarterMoaiClick();
  }
  checkDarkMarketClick();
});

function isTouchUiTarget(event) {
  return Boolean(event.target.closest?.('#controls, #start-screen, button'));
}

function updateMobileStickVisual(clientX, clientY) {
  if (!hud.mobileStick) return;
  const dx = mobileMove.x * 30;
  const dy = -mobileMove.z * 30;
  hud.mobileStick.style.display = mobileMove.active ? 'block' : 'none';
  hud.mobileStick.style.left = `${mobileMove.originX}px`;
  hud.mobileStick.style.top = `${mobileMove.originY}px`;
  hud.mobileStick.style.setProperty('--stick-x', `${dx}px`);
  hud.mobileStick.style.setProperty('--stick-y', `${dy}px`);
}

function stopMobileMove() {
  mobileMove.active = false;
  mobileMove.pointerId = null;
  mobileMove.x = 0;
  mobileMove.z = 0;
  if (hud.mobileStick) hud.mobileStick.style.display = 'none';
}

renderer.domElement.addEventListener('pointerdown', (event) => {
  primeSpeech();
  if (isTouchUiTarget(event) || !gameStarted || gameOver) return;
  event.preventDefault();
  renderer.domElement.setPointerCapture?.(event.pointerId);

  if (event.clientX < window.innerWidth * 0.48 && !mobileMove.active) {
    mobileMove.active = true;
    mobileMove.pointerId = event.pointerId;
    mobileMove.originX = event.clientX;
    mobileMove.originY = event.clientY;
    updateMobileStickVisual(event.clientX, event.clientY);
    return;
  }

  pointerLookActive = true;
  lastPointerX = event.clientX;
  lastPointerY = event.clientY;
});

renderer.domElement.addEventListener('pointermove', (event) => {
  if (mobileMove.active && event.pointerId === mobileMove.pointerId) {
    event.preventDefault();
    const dx = THREE.MathUtils.clamp(event.clientX - mobileMove.originX, -52, 52);
    const dy = THREE.MathUtils.clamp(event.clientY - mobileMove.originY, -52, 52);
    mobileMove.x = Math.abs(dx) < 6 ? 0 : dx / 52;
    mobileMove.z = Math.abs(dy) < 6 ? 0 : -dy / 52;
    const len = Math.hypot(mobileMove.x, mobileMove.z);
    if (len > 1) {
      mobileMove.x /= len;
      mobileMove.z /= len;
    }
    updateMobileStickVisual(event.clientX, event.clientY);
    return;
  }

  if (!pointerLookActive) return;
  event.preventDefault();
  const dx = event.clientX - lastPointerX;
  const dy = event.clientY - lastPointerY;
  lastPointerX = event.clientX;
  lastPointerY = event.clientY;
  cameraYaw -= dx * 0.006;
  cameraPitch = THREE.MathUtils.clamp(cameraPitch + dy * 0.0035, 0.18, 0.82);
});

renderer.domElement.addEventListener('pointerup', (event) => {
  if (event.pointerId === mobileMove.pointerId) stopMobileMove();
  pointerLookActive = false;
  renderer.domElement.releasePointerCapture?.(event.pointerId);
});

renderer.domElement.addEventListener('pointercancel', (event) => {
  if (event.pointerId === mobileMove.pointerId) stopMobileMove();
  pointerLookActive = false;
});

function setupTouchButton(button, keyName) {
  if (!button) return;
  const start = (event) => {
    event.preventDefault();
    keys[keyName] = true;
  };
  const end = (event) => {
    event.preventDefault();
    keys[keyName] = false;
  };
  button.addEventListener('touchstart', start, { passive: false });
  button.addEventListener('touchend', end, { passive: false });
  button.addEventListener('touchcancel', end, { passive: false });
  button.addEventListener('mousedown', start);
  button.addEventListener('mouseup', end);
  button.addEventListener('mouseleave', end);
}

setupTouchButton(hud.fire, 'fire');

if (hud.help) {
  const helpStart = (event) => {
    event.preventDefault();
    activateBlueHelper();
  };
  hud.help.addEventListener('touchstart', helpStart, { passive: false });
  hud.help.addEventListener('mousedown', helpStart);
}

const setupBuyButton = (btn, type) => {
  if (btn) {
    btn.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      event.stopPropagation();
      primeSpeech();
      buyMoataroMoai(type);
    });
  }
};
setupBuyButton(hud.buyMoai1, 1);
setupBuyButton(hud.buyMoai2, 2);
setupBuyButton(hud.buyMoai3, 3);

if (hud.confirmYes) {
  hud.confirmYes.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    event.stopPropagation();
    primeSpeech();
    buyMoataroMoai(tempSelectedMoaiType);
    if (hud.confirmDialog) hud.confirmDialog.style.display = 'none';
  });
}

if (hud.confirmNo) {
  hud.confirmNo.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    event.stopPropagation();
    primeSpeech();
    if (hud.confirmDialog) hud.confirmDialog.style.display = 'none';
  });
}

if (hud.replayLine) {
  hud.replayLine.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    event.stopPropagation();
    primeSpeech();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    if (!playRecordedVoice(moataroServiceVoiceSrc)) {
      speakText(moataroServiceLine, { rate: 1.05, pitch: 0.92, volume: 1 });
    }
  });
}

if (hud.viewCatalog) {
  hud.viewCatalog.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    event.stopPropagation();
    openCatalogPause();
  });
}

if (hud.confirmDetail) {
  hud.confirmDetail.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    event.stopPropagation();
    let term = 'おすわり';
    if (tempSelectedMoaiType === 2) term = 'まちょい';
    if (tempSelectedMoaiType === 3) term = 'メガネ';
    openCatalogPause(term);
  });
}

if (hud.rivalDialog) {
  hud.rivalDialog.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    event.stopPropagation();
    startRivalChase();
  });
}

const btnDarkYes = document.getElementById('btn-dark-yes');
if (btnDarkYes) {
  btnDarkYes.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    event.stopPropagation();
    handleDarkMarketResponse('yes');
  });
}
const btnDarkNo = document.getElementById('btn-dark-no');
if (btnDarkNo) {
  btnDarkNo.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    event.stopPropagation();
    handleDarkMarketResponse('no');
  });
}
const btnDarkClose = document.getElementById('btn-dark-close');
if (btnDarkClose) {
  btnDarkClose.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    event.stopPropagation();
    closeDarkMarketDialog();
  });
}

if (hud.viewCatalogFloating) {
  hud.viewCatalogFloating.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    event.stopPropagation();
    openCatalogPause();
  });
}

if (hud.catalogClose) {
  hud.catalogClose.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    event.stopPropagation();
    closeCatalogPause();
  });
}

if (hud.skipMoai) {
  hud.skipMoai.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    event.stopPropagation();
    moataroPromptDismissed = true;
    moataroClerkSafeTimer = 4.0;
    updateMoataroShopDialog();
  });
}

if (hud.start) {
  hud.start.addEventListener('pointerdown', (event) => {
    if (gameStarted && !gameOver) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    primeSpeech();
    warmRecordedVoices();
    startBgm('menu');
  });

  hud.start.addEventListener('click', (event) => {
    const stageButton = event.target.closest?.('[data-stage]');
    if (!stageButton) return;
    resetGame(stageButton.dataset.stage);
  });
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

loadMoaiModel();
createBlueHelperModel();
createPetMoaiModel();
guideArrow = createGuideArrow();
createAuthor();
createWorld();
moai.position.set(0, 0, 28);
setEntityGroundHeight(moai);
moai.rotation.y = 0;
resetAuthorPositions();
updateCamera(1);
setHud();
animate();
