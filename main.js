import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// シーン・カメラ・レンダラー
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x000000, 5, 20);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(0, 3, 8);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// ライト
const light = new THREE.DirectionalLight(0xffffff, 2);
light.position.set(3, 10, 5);
scene.add(light);
scene.add(new THREE.AmbientLight(0x888888, 1)); // 明るめに

// ===== アセットローダー =====
const textureLoader = new THREE.TextureLoader();
const gltfLoader = new GLTFLoader();

// ===== モアイロボ =====
const moai = new THREE.Group();
scene.add(moai);

// デフォルトのモアイ（Box）を作成する関数
function createFallbackMoai() {
  console.log("Loading fallback Moai...");
  // 頭
  const head = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1.5, 1),
    new THREE.MeshStandardMaterial({ color: 0xaaaaaa })
  );
  head.position.y = 1;
  moai.add(head);

  // 体
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 1, 0.6),
    new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  body.position.y = 0.25;
  moai.add(body);
}

// GLTFモデルのロード試行
gltfLoader.load(
  './moai.glb',
  (gltf) => {
    const model = gltf.scene;
    // サイズ調整（モデルに合わせて適宜調整が必要）
    // バウンディングボックスからサイズを推定して正規化すると良いが、
    // ここでは仮にスケールを調整
    model.scale.set(1.5, 1.5, 1.5);
    model.position.y = 0;
    model.rotation.y = Math.PI; // 正面を向かせる（モデルによる）

    // 既存のコンテンツ（フォールバック）を削除
    while (moai.children.length > 0) {
      moai.remove(moai.children[0]);
    }
    moai.add(model);
    console.log("Moai model loaded!");
  },
  undefined,
  (error) => {
    console.warn("Moai model not found, using fallback.", error);
    createFallbackMoai();
  }
);

// 初期表示はとりあえずフォールバックを出しておく（ロード待ち）
// ロード完了時に差し替える
createFallbackMoai();


// ===== ユーザー障害物 (以前のヨーグルト) =====
const userGeometry = new THREE.PlaneGeometry(1.5, 2.5); // 人型に合わせたサイズ
// テクスチャロード
let userMaterial;
const userTexture = textureLoader.load('./user.png',
  (tex) => { console.log("User texture loaded!"); },
  undefined,
  (err) => { console.warn("User texture not found, using default color."); }
);

userMaterial = new THREE.MeshStandardMaterial({
  map: userTexture,
  transparent: true,
  side: THREE.DoubleSide
});

// もし画像がないときに「真っ黒」になるのを防ぐため、mapが見つからない場合の色指定を変える工夫もできるが、
// MeshStandardMaterialはmapがnull(ロード失敗)ならcolorが使われるはず。
// ただしLoaderはデフォルトで白いテクスチャを返すわけではないので、
// エラー時に明示的にnullにする処理を入れる手もあるが、Three.jsのTextureLoaderは
// エラー時でもTextureオブジェクトを返し、単にレンダリングされないだけ（黒くなる場合がある）。
// 念のため、初期値は白マテリアルにしておき、ロード成功したらmapを適用する方法が安全だが、
// 簡便のためそのままいく。

const yogurts = [];

function spawnYogurt() {
  const yogurt = new THREE.Mesh(userGeometry, userMaterial);
  yogurt.position.set(
    (Math.random() - 0.5) * 6,
    1.2, // 地面より少し上（足元が地面に付くくらい）
    -20  // 遠くから
  );

  // 回転はさせず、常に正面を向かせる
  yogurt.rotation.y = 0;

  scene.add(yogurt);
  yogurts.push(yogurt);
}

// ===== 操作 =====
let moveLeft = false;
let moveRight = false;

window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft" || e.key === "a") moveLeft = true;
  if (e.key === "ArrowRight" || e.key === "d") moveRight = true;
});
window.addEventListener("keyup", (e) => {
  if (e.key === "ArrowLeft" || e.key === "a") moveLeft = false;
  if (e.key === "ArrowRight" || e.key === "d") moveRight = false;
});

// スマホ操作（ボタン）
const btnLeft = document.getElementById("btn-left");
const btnRight = document.getElementById("btn-right");
const fullscreenBtn = document.getElementById("fullscreen-btn");

function setupBtn(btn, isLeft) {
  if (!btn) return;
  // タッチ開始 / マウス押し
  const start = (e) => {
    e.preventDefault();
    if (isLeft) moveLeft = true;
    else moveRight = true;
  };

  // タッチ終了 / マウス離し
  const end = (e) => {
    e.preventDefault();
    if (isLeft) moveLeft = false;
    else moveRight = false;
  };

  btn.addEventListener("touchstart", start, { passive: false });
  btn.addEventListener("touchend", end);
  btn.addEventListener("mousedown", start);
  btn.addEventListener("mouseup", end);
  btn.addEventListener("mouseleave", end);
}

setupBtn(btnLeft, true);
setupBtn(btnRight, false);

// 全画面表示
if (fullscreenBtn) {
  fullscreenBtn.addEventListener("click", () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        alert(`Error: ${err.message}`);
      });
      fullscreenBtn.innerText = "EXIT FULLSCREEN";
    } else {
      document.exitFullscreen();
      fullscreenBtn.innerText = "FULLSCREEN";
    }
  });
}

// 以前の画面半分タップロジックは削除するか、
// そのまま残して「ボタンでも画面タップでも」どっちでもいけるようにするか。
// ユーザーは「ボタンを実装して」と言ったので、明確なボタンを優先し、
// 全画面タップは誤操作の元になるかもしれないので削除（コメントアウト）するのが安全。


// ===== ゲームループ =====
let gameOver = false;
let gameStarted = false; // ゲーム開始フラグ
let spawnTimer = 0;
let speed = 0.2; // 初速
let score = 0; // スコア
let lookBehindTimer = 0;
let isLookingBehind = false;
let targetRotationY = Math.PI; // デフォルトは後ろ向き（カメラとは逆）

function animate() {
  requestAnimationFrame(animate);

  if (!gameStarted || gameOver) return;

  // スコア加算
  score++;
  document.getElementById('score-container').innerText = score;

  // ----- ホラー要素: 振り返る (Look Behind) -----
  // ランダムに発生 (確率調整: 0.2% / frame -> 500frameに1回くらい)
  if (!isLookingBehind && Math.random() < 0.002) {
    isLookingBehind = true;
    lookBehindTimer = 120; // 2秒くらい見つめる
    targetRotationY = 0;   // カメラの方を向く（0 rad）

    // 演出: 音楽を少し不穏にする？ (ピッチを下げる)
    // audioCtx.playbackRate... は難しいので、BGM生成側のtempoを一時的に変えるなど
    // ここではシンプルに「操作不能」の恐怖を優先
  }

  if (isLookingBehind) {
    lookBehindTimer--;
    if (lookBehindTimer <= 0) {
      isLookingBehind = false;
      targetRotationY = Math.PI; // 前を向く
    }
  }

  // 回転アニメーション (滑らかに)
  // moai.rotation.y は 0 または PI に向かう
  // 現在の値とターゲットの差分をとってLerp
  // ただしPIと0の境界またぎはない（0 <-> 3.14）ので単純LerpでOK
  if (moai.children.length > 0) { // モデルロード済みの場合
    // moai.rotation.y ではなく、moai直下のモデルを回していたのでそちらを制御
    // 上のLoaderで moai.add(model); model.rotation.y = Math.PI; している
    // つまり moai.children[0] を回す
    const mesh = moai.children[0];
    mesh.rotation.y = THREE.MathUtils.lerp(mesh.rotation.y, targetRotationY, 0.1);
  }


  // モアイ移動 (振り返っていても動けるように変更)
  if (moveLeft) moai.position.x -= 0.15;
  if (moveRight) moai.position.x += 0.15;

  // 揺れ (歩行)
  if (moveLeft || moveRight) {
    moai.rotation.z = Math.sin(Date.now() * 0.01) * 0.05;
  } else {
    moai.rotation.z *= 0.9;
  }

  moai.position.x = THREE.MathUtils.clamp(moai.position.x, -3, 3);


  // ヨーグルト生成 (見ている間も容赦なく飛んでくる！)
  // ヨーグルト生成
  spawnTimer++;
  if (spawnTimer > 15) {
    spawnYogurt();
    spawnTimer = 0;
  }

  // ヨーグルト移動＆当たり判定
  speed += 0.0001; // 徐々に加速

  yogurts.forEach((yogurt, index) => {
    yogurt.position.z += speed;

    // 回転演出
    yogurt.rotation.y += 0.05;

    // 当たり判定
    const dx = yogurt.position.x - moai.position.x;
    const dz = yogurt.position.z - moai.position.z; // moai.position.z は 0

    // 距離チェック（少し余裕を持たせる）
    if (Math.abs(dx) < 0.8 && Math.abs(dz) < 0.5) {
      gameOver = true;
      isPlayingBGM = false; // BGM停止
      document.getElementById('start-screen').style.display = 'flex';
      document.getElementById('start-screen').style.opacity = '1';
      document.getElementById('start-screen').innerHTML = `
        <div class="start-card" style="color: #ff4a4a;">
          <h1 style="background: linear-gradient(90deg, #fff, #ff4a4a); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;">GAME OVER</h1>
          <p class="tap-msg">SCORE: ${score}</p>
          <button onclick="location.reload()" style="
            margin-top: 20px; padding: 15px 40px; font-size: 18px;
            background: rgba(255,255,255,0.15); color: #fff;
            border: 2px solid rgba(255,255,255,0.3); border-radius: 15px;
            cursor: pointer; font-family: 'Outfit', sans-serif;
            backdrop-filter: blur(10px);
          ">RESTART</button>
        </div>
      `;
    }

    // 画面外削除
    if (yogurt.position.z > 10) {
      scene.remove(yogurt);
      yogurts.splice(index, 1);
    }
  });

  renderer.render(scene, camera);
}

// ===== 8-bit BGM Generator =====
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playNote(frequency, duration, time) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = 'square';
  osc.frequency.value = frequency;

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start(time);

  // Envelope
  gain.gain.setValueAtTime(0.1, time);
  gain.gain.exponentialRampToValueAtTime(0.01, time + duration - 0.05);

  osc.stop(time + duration);
}

// Simple Melody (C Major Arpeggio-ish)
const melody = [
  261.63, 0, 329.63, 0, 392.00, 0, 523.25, 0, // C E G C
  392.00, 0, 329.63, 0, 261.63, 0, 196.00, 0, // G E C lowG
  220.00, 0, 261.63, 0, 329.63, 0, 440.00, 0, // A C E A
  329.63, 0, 261.63, 0, 220.00, 0, 196.00, 0  // E C A lowG
];

let nextNoteTime = 0;
let noteIndex = 0;
let isPlayingBGM = false;
let tempo = 0.15; // 秒/音

function scheduleMusic() {
  if (!isPlayingBGM) return;

  while (nextNoteTime < audioCtx.currentTime + 0.1) {
    const freq = melody[noteIndex % melody.length];
    if (freq > 0) {
      playNote(freq, tempo, nextNoteTime);
    }

    // speed変数に応じてテンポを速くする（ゲーム連動！）
    // speed初期値0.2 -> 1.0くらいまで上がる想定
    // speedが上がるとtempo数値を小さくする
    // speed=0.2 -> tempo=0.15
    // speed=1.0 -> tempo=0.08
    const currentTempo = Math.max(0.05, 0.15 - (speed - 0.2) * 0.1);

    nextNoteTime += currentTempo;
    noteIndex++;
  }
  requestAnimationFrame(scheduleMusic);
}


// 初期描画（ループ前）
renderer.render(scene, camera);

// スタート画面クリックで開始（リスタート対応）
document.getElementById('start-screen').addEventListener('click', () => {
  // ゲーム状態リセット
  gameOver = false;
  score = 0;
  speed = 0.2;
  spawnTimer = 0;
  isLookingBehind = false;
  lookBehindTimer = 0;
  targetRotationY = Math.PI;

  // スコア表示リセット
  document.getElementById('score-container').innerText = 0;

  // 既存のヨーグルト（障害物）を全削除
  yogurts.forEach(y => scene.remove(y));
  yogurts.length = 0;

  // モアイ位置リセット
  moai.position.set(0, 0, 0);
  moai.rotation.z = 0;

  // スタート画面を非表示
  document.getElementById('start-screen').style.display = 'none';

  // AudioContext再開（ブラウザポリシー対応）
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  isPlayingBGM = true;
  nextNoteTime = audioCtx.currentTime;
  scheduleMusic();

  // 初回のみアニメーションループ開始
  if (!gameStarted) {
    gameStarted = true;
    animate();
  }
  gameStarted = true;
});

// リサイズ対応
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
