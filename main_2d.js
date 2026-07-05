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
    model.rotation.y = Math.PI / 2; // 前向き（-Z）

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

// 金のモアイ: moai_shot (超低確率で混入。Three.jsマテリアルに黄金の輝きを追加！)
const moaiShotTexture = textureLoader.load('./moai_shot.png');
const moaiShotMaterial = new THREE.MeshStandardMaterial({
  map: moaiShotTexture,
  transparent: true,
  side: THREE.DoubleSide,
  emissive: new THREE.Color(0xffd700), // 黄金の自己発光
  emissiveMap: moaiShotTexture,
  emissiveIntensity: 0.35, // 神々しい発光
  metalness: 0.8, // 金属的な反射
  roughness: 0.15 // なめらかな光沢
});

// レアな敵: happy (スコア300以上で5%の確率)
const happyTexture = textureLoader.load('./happy.png');
const happyMaterial = new THREE.MeshStandardMaterial({
  map: happyTexture,
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

// 吹き飛ばしモード: スプライトを吹き飛ばす
function blastSprite(yogurt, index) {
  yogurts.splice(index, 1);
  blownSprites.push({
    mesh: yogurt,
    vx: (Math.random() - 0.5) * 0.6,
    vy: 0.22 + Math.random() * 0.25,
    vz: 0.4 + Math.random() * 0.35,
    rx: (Math.random() - 0.5) * 0.4,
    rz: (Math.random() - 0.5) * 0.4,
  });

  const isGold = yogurt.userData && yogurt.userData.isGoldenMoai;
  if (isGold) {
    // 💥 金のモアイを撃破！撃破数+10の超絶ビッグボーナス！
    revengeScore += 10;
    // モアイ全体を黄金にまばゆく輝かせる演出！
    moai.traverse(c => { 
      if (c.isMesh) { 
        const orig = c.material.emissive?.getHex() ?? 0; 
        c.material.emissive?.setHex(0xffd700); 
        setTimeout(() => c.material.emissive?.setHex(orig), 400); 
      } 
    });
  } else {
    revengeScore++;
    // 通常の赤色発光
    moai.traverse(c => { 
      if (c.isMesh) { 
        const orig = c.material.emissive?.getHex() ?? 0; 
        c.material.emissive?.setHex(0xff2200); 
        setTimeout(() => c.material.emissive?.setHex(orig), 120); 
      } 
    });
  }

  document.getElementById('current-score-val').innerText = revengeScore;

  // 作者（特殊ではない通常スプライト）に当たったときだけ悲鳴を再生
  if (yogurt.userData && !yogurt.userData.isSpecial) {
    playUserVoice();
  }
}

function spawnYogurt() {
  let material = userMaterial;
  let isSpecial = false;
  let isGoldenMoai = false;
  
  const targetTime = new Date('2026-05-30T18:00:00+09:00').getTime();
  const isBeforeStart = Date.now() < targetTime;
  const goldSpawnRate = isBeforeStart ? 0.10 : 0.07; // カウントダウン前は10%、18:00以降は「7%の奇跡」に合わせて常時7%に自動調整！

  const rand = Math.random();
  if (rand < goldSpawnRate || window.debugForceGold) {
    material = moaiShotMaterial;
    isSpecial = true;
    isGoldenMoai = true;
    window.debugForceGold = false; // フラグをリセット
  } else if (score > 300) {
    // スコア300以上なら確率で特殊キャラに差し替え
    const specialRand = Math.random();
    if (specialRand < 0.05) {
      // 5% の確率で happy
      material = happyMaterial;
      isSpecial = true;
    }
  }

  const yogurt = new THREE.Mesh(userGeometry, material);
  yogurt.userData.isSpecial = isSpecial;
  yogurt.userData.isGoldenMoai = isGoldenMoai; // 金のモアイ判定用

  if (isGoldenMoai) {
    yogurt.scale.set(1.4, 1.4, 1.4); // 金のモアイは1.4倍サイズ！存在感が抜群！
  }

  yogurt.position.set(
    (Math.random() - 0.5) * 6,
    1.2, // 地面より少し上
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
  if (e.key.toLowerCase() === "g") {
    window.debugForceGold = true;
    console.log("🔒 Debug: Next obstacle forced to Golden Moai!");
  }
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

// ===== 吹き飛ばしモード =====
let revengeMode = false;
let revengeScore = 0;
const blownSprites = []; // { mesh, vx, vy, vz, rx, rz }

function updateBestDisplay() {
  // 表示の更新自体は index.html の Firebase 監視側で行うため、
  // ここでは数字での強制上書きを停止します。
}
window.updateBestDisplay = updateBestDisplay;

// 初回表示用 (Firebaseの取得待ちを考慮して少し遅らせる)
setTimeout(updateBestDisplay, 1500);

let lookBehindTimer = 0;
let isLookingBehind = false;
let targetRotationY = Math.PI / 2; // 通常時: 前向き（-Z）

function animate() {
  requestAnimationFrame(animate);

  if (!gameStarted || gameOver) return;

  // スコア加算
  score++;
  document.getElementById('current-score-val').innerText = score;
  
  // 本日の全体ベスト更新チェック（リアルタイム表示用）
  if (score > (window.todayGlobalBestScore || 0)) {
    // 表示の更新は Firebase の onValue で自動で行われるため、ここでは保存せず通知だけ待つ
  }

  // ----- キョロキョロ演出: ランダムにあちこちを向く -----
  // 向きの候補: 前・後・左・右・斜め各種
  const LOOK_DIRS = [
    { rot: Math.PI / 2,       label: '前' },         // 山子山の後・画面山
    { rot: -Math.PI / 2,      label: '後ろ(カメラ)' }, // プレイヤー側
    { rot: 0,                 label: '左' },
    { rot: Math.PI,           label: '右' },
    { rot: Math.PI / 4,       label: '左斜め山子山' },
    { rot: -Math.PI / 4,      label: '左斜め後〰8' },
    { rot: Math.PI * 3 / 4,   label: '右斜め山子山' },
    { rot: -Math.PI * 3 / 4,  label: '右斜め後ろ' },
  ];

  if (!isLookingBehind && Math.random() < 0.003) {
    isLookingBehind = true;
    // まず山子山の方向以外からランダムに選ぶ
    const choices = LOOK_DIRS.filter(d => Math.abs(d.rot - Math.PI / 2) > 0.1);
    const picked = choices[Math.floor(Math.random() * choices.length)];
    targetRotationY = picked.rot;

    // 向く時間もランダム: 40フレーム〜180フレーム
    lookBehindTimer = 40 + Math.floor(Math.random() * 140);
  }

  if (isLookingBehind) {
    lookBehindTimer--;
    if (lookBehindTimer <= 0) {
      // たまに連続して別の方向を向く（行動がコミカルになる）
      if (Math.random() < 0.3) {
        const choices = LOOK_DIRS.filter(d => Math.abs(d.rot - Math.PI / 2) > 0.1 && Math.abs(d.rot - targetRotationY) > 0.1);
        const picked = choices[Math.floor(Math.random() * choices.length)];
        targetRotationY = picked.rot;
        lookBehindTimer = 30 + Math.floor(Math.random() * 60);
      } else {
        isLookingBehind = false;
        targetRotationY = Math.PI / 2; // 前に戻る
      }
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

    if (yogurt.userData && yogurt.userData.isGoldenMoai) {
      // 金のモアイの回転＆拡大縮小アニメーション（プレミアム演出！）
      // 左右にゆらゆら揺れながら、神々しく回転し、呼吸するように鼓動する
      yogurt.rotation.y += 0.08;
      yogurt.rotation.z = Math.sin(Date.now() * 0.006) * 0.25;
      
      const pulseScale = 1.4 + Math.sin(Date.now() * 0.015) * 0.18;
      yogurt.scale.set(pulseScale, pulseScale, pulseScale);
    } else {
      // 通常の回転演出
      yogurt.rotation.y += 0.05;
    }

    // 当たり判定
    const dx = yogurt.position.x - moai.position.x;
    const dz = yogurt.position.z - moai.position.z;
    if (Math.abs(dx) < 0.8 && Math.abs(dz) < 0.5) {

      // ===== 吹き飛ばしモード =====
      if (revengeMode) {
        blastSprite(yogurt, index);
        return; // このイテレーション終了
      }

      // ===== 通常ゲームオーバー =====
      gameOver = true;
      isPlayingBGM = false;

      if (window.logScore) window.logScore(score);

      const isGlobalUpdate = score > (window.globalHighScore || 0);
      const isTodayUpdate = score > (window.todayGlobalBestScore || 0);
      if ((isGlobalUpdate || isTodayUpdate) && window.showNameInput) {
        window.showNameInput(score, isGlobalUpdate, isTodayUpdate);
      }

      const hitByGold = yogurt.userData && yogurt.userData.isGoldenMoai;
      const targetTime = new Date('2026-05-30T18:00:00+09:00').getTime();
      const endTime = new Date('2026-06-05T23:59:00+09:00').getTime();
      const now = Date.now();
      
      const urlParams = new URLSearchParams(window.location.search);
      const testParam = urlParams.get('test');
      
      let isBeforeStart = now < targetTime;
      let isAfterEnd = now > endTime;

      if (testParam === 'countdown') {
        isBeforeStart = true;
        isAfterEnd = false;
      } else if (testParam === 'shop') {
        isBeforeStart = false;
        isAfterEnd = false;
      } else if (testParam === 'closed') {
        isBeforeStart = false;
        isAfterEnd = true;
      }

      document.getElementById('start-screen').style.display = 'flex';
      document.getElementById('start-screen').style.opacity = '1';
      document.getElementById('start-screen').style.overflow = 'auto';
      document.getElementById('start-screen').innerHTML = `
        <div class="retro-container">
          <img src="game_over_bg.jpg" alt="Game Over" class="retro-bg">
          <div class="retro-score">${score}</div>
          <button class="retro-btn btn-retry" onclick="location.reload()" aria-label="Retry"></button>
          <button class="retro-btn btn-follow" onclick="window.open('https://www.instagram.com/moataro_k/', '_blank')" aria-label="Follow"></button>
          <button class="retro-btn btn-x" onclick="window.open('https://x.com/kanazawamoataro', '_blank')" aria-label="Twitter/X"></button>
          <button class="retro-btn btn-insta" onclick="window.open('https://www.instagram.com/moataro_k/', '_blank')" aria-label="Instagram"></button>
        </div>

        ${hitByGold ? `
        <!-- 👑 金のモアイ衝突特典！極秘シークレット直売所 👑 -->
        <div onclick="event.stopPropagation()" style="
          background: linear-gradient(135deg, rgba(15,10,2,0.99) 0%, rgba(38,28,8,0.97) 100%);
          border: 3px double #ffd700;
          border-radius: 20px;
          padding: 24px 20px;
          margin-top: 15px;
          box-shadow: 0 0 40px rgba(255,215,0,0.5), inset 0 0 20px rgba(255,215,0,0.2);
          max-width: 500px;
          width: 92%;
          z-index: 102;
          text-align: center;
          font-family: 'Outfit', 'Inter', 'DotGothic16', sans-serif;
        ">
          <div style="font-size: clamp(18px, 5.5vw, 24px); font-weight: 900; color: #ffd700; text-shadow: 0 0 15px rgba(255,215,0,0.8); letter-spacing: 1.5px; animation: pulse 1.5s infinite;">
            👑 7%の奇跡！金のモアイ降臨 👑
          </div>
          
          ${isAfterEnd ? `
          <div style="font-size: 13px; color: #fff; margin-top: 10px; font-weight: 800; line-height: 1.6; letter-spacing: 0.8px;">
            <span style="background: linear-gradient(90deg, transparent, rgba(255,51,51,0.25) 50%, transparent 100%); padding: 6px 0; display: block; color: #ff4444; font-size: clamp(12px, 3.8vw, 14px); font-weight: 900; border-top: 1px solid rgba(255,51,51,0.3); border-bottom: 1px solid rgba(255,51,51,0.3); text-shadow: 0 0 5px rgba(255,51,51,0.5);">
              📢 本販売所は閉鎖されました 🗿
            </span>
            <span style="color: #ccc; font-size: 12px; display: block; margin-top: 10px; line-height: 1.6; text-align: center;">
              ご交信ありがとうございました！<br>
              本特別直売所は <strong style="color: #ffd700;">6月5日(金) 23:59</strong> をもって完全に終了し、閉鎖されました。<br>
              またの機会を楽しみにお待ちください！
            </span>
          </div>
          ` : isBeforeStart ? `
          <div style="font-size: 13px; color: #fff; margin-top: 10px; font-weight: 800; line-height: 1.6; letter-spacing: 0.8px;">
            <span style="background: linear-gradient(90deg, transparent, rgba(255,215,0,0.25) 50%, transparent 100%); padding: 6px 0; display: block; color: #fff; font-size: clamp(12px, 3.8vw, 14px); font-weight: 900; border-top: 1px solid rgba(255,215,0,0.3); border-bottom: 1px solid rgba(255,215,0,0.3); text-shadow: 0 0 5px rgba(255,215,0,0.5);">
              ✨ 秘密のシークレット直売所 ✨
            </span>
            <span style="color: #ffd700; font-size: 12px; display: block; margin-top: 10px; line-height: 1.6; text-align: center;">
              遭遇確率わずか <strong style="font-size: 14px; text-shadow: 0 0 4px #ffd700;">7%</strong> の「金のモアイ」との交信に成功したぞ！<br>
              だが、極秘直売所がオープンするのは...<br>
              <strong style="color: #ff3333; text-shadow: 0 0 8px rgba(255,51,51,0.6); font-size: 14px;">【本日 5月30日(土) 18:00】</strong>からじゃ！<br>
              ただいま次元のゲートが開くのを調整中。オープンまでわくわくしてお待ちくだされ！
            </span>
          </div>

          <!-- カウントダウン表示エリア -->
          <div style="margin-top: 20px; padding: 15px 10px; background: rgba(0,0,0,0.6); border-radius: 12px; border: 1px solid rgba(255,215,0,0.25); box-shadow: inset 0 0 10px rgba(255,215,0,0.1);">
            <div style="font-size: 10px; color: #ffd700; letter-spacing: 1.5px; font-weight: 900; margin-bottom: 8px; text-shadow: 0 0 4px rgba(255,215,0,0.3);">SECRET SHOP OPENING IN</div>
            <div id="gold-countdown-timer" style="display: flex; gap: 8px; justify-content: center; align-items: center; min-height: 50px;">
              <!-- JSで動的に更新されます -->
            </div>
          </div>

          <!-- 極秘商品の予告リスト -->
          <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 20px; text-align: left;">
            <div style="font-size: 11px; color: #ffd700; font-weight: bold; letter-spacing: 1px; margin-bottom: 2px; text-align: center; text-shadow: 0 0 5px rgba(255,215,0,0.3);">🔑 特別優待品ラインナップ（予告） 🔑</div>
            
            <!-- ① -->
            <div style="
              background: rgba(0,0,0,0.5);
              border: 1px dashed rgba(255,215,0,0.25);
              border-radius: 10px;
              padding: 10px 12px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              opacity: 0.85;
            ">
              <span style="font-size: 12px; font-weight: bold; color: rgba(255,255,255,0.85); line-height: 1.35;">① ヨーグルト好きモアイロボmark2 EXゴールドエディション 神スタンドセット</span>
              <span style="font-size: 9px; font-weight: 900; color: #ffd700; background: rgba(255,215,0,0.1); padding: 3px 6px; border-radius: 4px; border: 1px solid rgba(255,215,0,0.2); white-space: nowrap; margin-left: 8px;">🔒 予告</span>
            </div>

            <!-- ② -->
            <div style="
              background: rgba(0,0,0,0.5);
              border: 1px dashed rgba(255,215,0,0.25);
              border-radius: 10px;
              padding: 10px 12px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              opacity: 0.85;
            ">
              <span style="font-size: 12px; font-weight: bold; color: rgba(255,255,255,0.85); line-height: 1.35;">② モアイロボMark2専用 神スタンド</span>
              <span style="font-size: 9px; font-weight: 900; color: #ffd700; background: rgba(255,215,0,0.1); padding: 3px 6px; border-radius: 4px; border: 1px solid rgba(255,215,0,0.2); white-space: nowrap; margin-left: 8px;">🔒 予告</span>
            </div>

            <!-- ③ -->
            <div style="
              background: rgba(0,0,0,0.5);
              border: 1px dashed rgba(255,215,0,0.25);
              border-radius: 10px;
              padding: 10px 12px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              opacity: 0.85;
            ">
              <span style="font-size: 12px; font-weight: bold; color: rgba(255,255,255,0.85); line-height: 1.35;">③ ミニおすわりモアイキーホルダー</span>
              <span style="font-size: 9px; font-weight: 900; color: #ffd700; background: rgba(255,215,0,0.1); padding: 3px 6px; border-radius: 4px; border: 1px solid rgba(255,215,0,0.2); white-space: nowrap; margin-left: 8px;">🔒 予告</span>
            </div>

            <!-- ④ -->
            <div style="
              background: rgba(0,0,0,0.5);
              border: 1px dashed rgba(255,215,0,0.25);
              border-radius: 10px;
              padding: 10px 12px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              opacity: 0.85;
            ">
              <span style="font-size: 12px; font-weight: bold; color: rgba(255,255,255,0.85); line-height: 1.35;">④ まちょいモアイメガネスタンド</span>
              <span style="font-size: 9px; font-weight: 900; color: #ffd700; background: rgba(255,215,0,0.1); padding: 3px 6px; border-radius: 4px; border: 1px solid rgba(255,215,0,0.2); white-space: nowrap; margin-left: 8px;">🔒 予告</span>
            </div>
          </div>
          
          <div style="color: rgba(255,255,255,0.7); font-size: 11px; margin-top: 15px; line-height: 1.5;">
            ※18:00以降に再び「金のモアイ」に出会うと、特別優待品【各7セット限定】の極秘ショップがアンロックされるぞ！
          </div>
          ` : `
          <div style="font-size: 13px; color: #fff; margin-top: 10px; font-weight: 800; line-height: 1.6; letter-spacing: 0.8px;">
            <span style="background: linear-gradient(90deg, transparent, rgba(255,215,0,0.25) 50%, transparent 100%); padding: 6px 0; display: block; color: #fff; font-size: clamp(12px, 3.8vw, 14px); font-weight: 900; border-top: 1px solid rgba(255,215,0,0.3); border-bottom: 1px solid rgba(255,215,0,0.3); text-shadow: 0 0 5px rgba(255,215,0,0.5);">
              ✨ 【選ばれしVIP限定】秘密のシークレット直売所 ✨
            </span>
            <span style="color: #ffd700; font-size: 12px; display: block; margin-top: 10px; line-height: 1.6; text-align: center;">
              遭遇確率わずか <strong style="font-size: 14px; text-shadow: 0 0 4px #ffd700;">7%</strong> の「金のモアイ」と交信した時だけ開く、超激レアな直売所じゃ！<br>
              この画面を閉じると一旦閉まってしまうので、このラッキーな遭遇チャンスをお見逃しなく！<br>
              幸運を記念し、ラッキーセブン<strong style="color: #ff3333; text-shadow: 0 0 8px rgba(255,51,51,0.6); font-size: 13px;">【各7セット限定】</strong>の極秘・特別優待品を用意したぞ。<br>
              <span style="display: inline-block; background: rgba(255,51,51,0.15); border: 1px solid rgba(255,51,51,0.3); color: #ff4444; font-weight: 900; padding: 4px 12px; border-radius: 6px; margin-top: 8px; font-size: 11px; letter-spacing: 0.5px; animation: pulse 1.5s infinite;">
                ⚠️ 本販売所は 6月5日(金) 23:59 をもって完全に閉鎖されます 🗿
              </span>
            </span>
          </div>

          <!-- 極秘商品リスト -->
          <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 18px; text-align: left;">
            
            <!-- ① ヨーグルト好きモアイロボmark2 EXゴールドエディション 神スタンドセット -->
            <div onclick="window.open('https://minne.com/items/45604230?code=dnroLkLN3M', '_blank')" style="
              background: rgba(0,0,0,0.75);
              border: 1px solid rgba(255,215,0,0.4);
              border-radius: 12px;
              padding: 14px 16px;
              cursor: pointer;
              transition: all 0.2s ease-in-out;
              display: flex;
              flex-direction: column;
              box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            " onmouseover="this.style.transform='translateY(-2px)'; this.style.borderColor='#ffd700'; this.style.boxShadow='0 8px 20px rgba(255,215,0,0.35)';" onmouseout="this.style.transform='translateY(0)'; this.style.borderColor='rgba(255,215,0,0.4)'; this.style.boxShadow='0 4px 10px rgba(0,0,0,0.3)';" >
              <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;">
                <span style="font-size: 13px; font-weight: 800; color: #fff; line-height: 1.45;">① ヨーグルト好きモアイロボmark2 EXゴールドエディション 神スタンドセット</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
                <span style="font-size: 11px; font-weight: 900; color: #ffd700; text-shadow: 0 0 6px rgba(255,215,0,0.5); display: flex; align-items: center; gap: 4px; font-family: 'Outfit', 'Inter', sans-serif;">
                  🎁 神価格/送料無料
                </span>
                <span style="font-size: 11px; font-weight: bold; color: #ffd700; background: rgba(255,215,0,0.15); padding: 4px 10px; border-radius: 6px; border: 1px solid rgba(255,215,0,0.3); letter-spacing: 0.5px;">🔐 VIP専用ページへ (minne) ▶</span>
              </div>
            </div>

            <!-- ② モアイロボMark2専用 神スタンド -->
            <div onclick="window.open('https://minne.com/items/45611657?code=i6WAylwj9e', '_blank')" style="
              background: rgba(0,0,0,0.75);
              border: 1px solid rgba(255,215,0,0.4);
              border-radius: 12px;
              padding: 14px 16px;
              cursor: pointer;
              transition: all 0.2s ease-in-out;
              display: flex;
              flex-direction: column;
              box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            " onmouseover="this.style.transform='translateY(-2px)'; this.style.borderColor='#ffd700'; this.style.boxShadow='0 8px 20px rgba(255,215,0,0.35)';" onmouseout="this.style.transform='translateY(0)'; this.style.borderColor='rgba(255,215,0,0.4)'; this.style.boxShadow='0 4px 10px rgba(0,0,0,0.3)';" >
              <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;">
                <span style="font-size: 13px; font-weight: 800; color: #fff; line-height: 1.45;">② モアイロボMark2専用 神スタンド</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
                <span style="font-size: 11px; font-weight: 900; color: #00d2ff; text-shadow: 0 0 6px rgba(0,210,255,0.5); display: flex; align-items: center; gap: 4px; font-family: 'Outfit', 'Inter', sans-serif;">
                  🚚 送料無料
                </span>
                <span style="font-size: 11px; font-weight: bold; color: #ffd700; background: rgba(255,215,0,0.15); padding: 4px 10px; border-radius: 6px; border: 1px solid rgba(255,215,0,0.3); letter-spacing: 0.5px;">🔐 VIP専用ページへ (minne) ▶</span>
              </div>
            </div>

            <!-- ③ ミニおすわりモアイキーホルダー -->
            <div onclick="window.open('https://minne.com/items/45611506?code=j9JRfHjRYW', '_blank')" style="
              background: rgba(0,0,0,0.75);
              border: 1px solid rgba(255,215,0,0.4);
              border-radius: 12px;
              padding: 14px 16px;
              cursor: pointer;
              transition: all 0.2s ease-in-out;
              display: flex;
              flex-direction: column;
              box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            " onmouseover="this.style.transform='translateY(-2px)'; this.style.borderColor='#ffd700'; this.style.boxShadow='0 8px 20px rgba(255,215,0,0.35)';" onmouseout="this.style.transform='translateY(0)'; this.style.borderColor='rgba(255,215,0,0.4)'; this.style.boxShadow='0 4px 10px rgba(0,0,0,0.3)';" >
              <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;">
                <span style="font-size: 13px; font-weight: 800; color: #fff; line-height: 1.45;">③ ミニおすわりモアイキーホルダー</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
                <span style="font-size: 11px; font-weight: 900; color: #00d2ff; text-shadow: 0 0 6px rgba(0,210,255,0.5); display: flex; align-items: center; gap: 4px; font-family: 'Outfit', 'Inter', sans-serif;">
                  🚚 送料無料
                </span>
                <span style="font-size: 11px; font-weight: bold; color: #ffd700; background: rgba(255,215,0,0.15); padding: 4px 10px; border-radius: 6px; border: 1px solid rgba(255,215,0,0.3); letter-spacing: 0.5px;">🔐 VIP専用ページへ (minne) ▶</span>
              </div>
            </div>

            <!-- ④ まちょいモアイメガネスタンド -->
            <div onclick="window.open('https://minne.com/items/45340967?code=U0jp1xb7cl', '_blank')" style="
              background: rgba(0,0,0,0.75);
              border: 1px solid rgba(255,215,0,0.4);
              border-radius: 12px;
              padding: 14px 16px;
              cursor: pointer;
              transition: all 0.2s ease-in-out;
              display: flex;
              flex-direction: column;
              box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            " onmouseover="this.style.transform='translateY(-2px)'; this.style.borderColor='#ffd700'; this.style.boxShadow='0 8px 20px rgba(255,215,0,0.35)';" onmouseout="this.style.transform='translateY(0)'; this.style.borderColor='rgba(255,215,0,0.4)'; this.style.boxShadow='0 4px 10px rgba(0,0,0,0.3)';" >
              <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;">
                <span style="font-size: 13px; font-weight: 800; color: #fff; line-height: 1.45;">④ まちょいモアイメガネスタンド</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
                <span style="font-size: 11px; font-weight: 900; color: #ffd700; text-shadow: 0 0 6px rgba(255,215,0,0.5); display: flex; align-items: center; gap: 4px; font-family: 'Outfit', 'Inter', sans-serif;">
                  🎁 神価格/送料無料
                </span>
                <span style="font-size: 11px; font-weight: bold; color: #ffd700; background: rgba(255,215,0,0.15); padding: 4px 10px; border-radius: 6px; border: 1px solid rgba(255,215,0,0.3); letter-spacing: 0.5px;">🔐 VIP専用ページへ (minne) ▶</span>
              </div>
            </div>

          </div>
        </div>
        `}
        ` : ''}

        <!-- 💥 吹き飛ばしモード選択 -->
        <div onclick="event.stopPropagation()" style="
          background: rgba(20,0,0,0.95);
          border: 2px solid #ff3333;
          border-radius: 14px;
          padding: 20px 28px;
          text-align: center;
          max-width: 360px;
          width: 90%;
          margin-top: 4px;
          z-index: 200;
        ">
          <div style="font-size:18px; color:#ff4444; font-weight:bold; line-height:1.6; margin-bottom:14px;">
            😤 腹が立ってきた？<br>私を吹き飛ばしたい？
          </div>
          <div style="display:flex; gap:14px; justify-content:center;">
            <button onclick="window.startRevengeMode()" style="
              background: linear-gradient(135deg,#ff2200,#ff6600);
              color:white; border:none;
              padding:13px 30px; border-radius:10px;
              font-size:17px; font-weight:bold;
              cursor:pointer; letter-spacing:1px;
              box-shadow: 0 4px 14px rgba(255,50,0,0.5);
            ">はい 💥</button>
            <button onclick="location.reload()" style="
              background:#333; color:rgba(255,255,255,0.8);
              border:1px solid #555;
              padding:13px 30px; border-radius:10px;
              font-size:17px; cursor:pointer;
            ">いいえ</button>
          </div>
        </div>

        <!-- ▼▼▼ イベント情報 ▼▼▼ -->
        <div style="width: 100%; max-width: 550px; display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 20px 0; background: #000; z-index: 101;">
            <div style="text-align: center; color: #fff; font-family: 'Outfit', sans-serif; font-weight: bold; text-shadow: 0px 2px 5px rgba(0,0,0,1);">
                <div style="font-size: clamp(16px, 4.5vw, 22px); margin-bottom: 4px;">HMJ（ハンドメイドインジャパン）</div>
                <div style="font-size: clamp(14px, 4vw, 18px); margin-bottom: 4px;">日程: 7月11日(土)・12日(日)</div>
                <div style="font-size: clamp(14px, 4vw, 18px); margin-bottom: 4px;">会場: 東京ビッグサイト</div>
                <div style="font-size: clamp(14px, 4vw, 18px);">ブースNo: 後日発表！ (Kanazawa Moataro)</div>
            </div>
            <div style="display: flex; gap: 10px; flex-wrap: wrap; justify-content: center;">
                <button onclick="event.stopPropagation(); window.open('https://hmj-fes.jp/', '_blank')" style="
                    background: rgba(0,0,0,0.5); border: 2px solid rgba(255,255,255,0.6); color: #fff;
                    padding: clamp(6px, 1.5vw, 8px) clamp(12px, 3vw, 18px); border-radius: 20px;
                    font-size: clamp(12px, 3.5vw, 16px); font-weight: bold;
                    display: flex; align-items: center; gap: 6px; cursor: pointer;
                    backdrop-filter: blur(4px); box-shadow: 0 4px 6px rgba(0,0,0,0.5);
                ">HMJ公式サイト 🌐</button>
                <button onclick="event.stopPropagation(); location.href='catalog.html?v=20260526_1'" style="
                    background: rgba(0,210,255,0.15); border: 2px solid rgba(0,210,255,0.6); color: #00d2ff;
                    padding: clamp(6px, 1.5vw, 8px) clamp(12px, 3vw, 18px); border-radius: 20px;
                    font-size: clamp(12px, 3.5vw, 16px); font-weight: bold;
                    display: flex; align-items: center; gap: 6px; cursor: pointer;
                    backdrop-filter: blur(4px); box-shadow: 0 4px 12px rgba(0,210,255,0.2);
                ">📋 お品書き</button>
            </div>
        </div>
        <!-- ▲▲▲ イベント情報 ここまで ▲▲▲ -->
      `;

      if (hitByGold && isBeforeStart) {
        const timerEl = document.getElementById('gold-countdown-timer');
        if (timerEl) {
          const updateCountdown = () => {
            const now = Date.now();
            const diff = targetTime - now;
            if (diff <= 0) {
              clearInterval(window.goldCountdownInterval);
              location.reload();
              return;
            }
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            
            const pad = (n) => String(n).padStart(2, '0');
            timerEl.innerHTML = `
              <div style="background: rgba(255,215,0,0.1); border: 1px solid rgba(255,215,0,0.35); padding: 8px 12px; border-radius: 8px; min-width: 50px;">
                <div style="font-size: 20px; font-weight: 900; color: #ffd700; font-family: 'Outfit', sans-serif;">${pad(hours)}</div>
                <div style="font-size: 8px; color: rgba(255,255,255,0.6); font-weight: bold; margin-top: 1px;">時間</div>
              </div>
              <div style="font-size: 20px; font-weight: 900; color: #ffd700; animation: pulse 1s infinite;">:</div>
              <div style="background: rgba(255,215,0,0.1); border: 1px solid rgba(255,215,0,0.35); padding: 8px 12px; border-radius: 8px; min-width: 50px;">
                <div style="font-size: 20px; font-weight: 900; color: #ffd700; font-family: 'Outfit', sans-serif;">${pad(minutes)}</div>
                <div style="font-size: 8px; color: rgba(255,255,255,0.6); font-weight: bold; margin-top: 1px;">分</div>
              </div>
              <div style="font-size: 20px; font-weight: 900; color: #ffd700; animation: pulse 1s infinite;">:</div>
              <div style="background: rgba(255,215,0,0.1); border: 1px solid rgba(255,215,0,0.35); padding: 8px 12px; border-radius: 8px; min-width: 50px;">
                <div style="font-size: 20px; font-weight: 900; color: #ffd700; font-family: 'Outfit', sans-serif;">${pad(seconds)}</div>
                <div style="font-size: 8px; color: rgba(255,255,255,0.6); font-weight: bold; margin-top: 1px;">秒</div>
              </div>
            `;
          };
          updateCountdown();
          if (window.goldCountdownInterval) clearInterval(window.goldCountdownInterval);
          window.goldCountdownInterval = setInterval(updateCountdown, 1000);
        }
      }

      // ランキング機能（現在オフ）
      // const overlay = document.getElementById('name-input-overlay');
      // const scoreDisplay = document.getElementById('final-score-display');
      // if (overlay && scoreDisplay) {
      //   scoreDisplay.textContent = score;
      //   overlay.classList.add('active');
      // }
      // window._currentScore = score;
    }

    // 画面外削除
    if (yogurt.position.z > 10) {
      scene.remove(yogurt);
      yogurts.splice(index, 1);
    }
  });

  // 吹き飛びスプライト更新 (衰見モード)
  for (let i = blownSprites.length - 1; i >= 0; i--) {
    const b = blownSprites[i];
    b.mesh.position.x += b.vx;
    b.mesh.position.y += b.vy;
    b.mesh.position.z += b.vz;
    b.mesh.rotation.x += b.rx;
    b.mesh.rotation.z += b.rz;
    b.vy -= 0.012; // 重力
    if (b.mesh.position.z > 18 || b.mesh.position.y < -6) {
      scene.remove(b.mesh);
      blownSprites.splice(i, 1);
    }
  }

  renderer.render(scene, camera);
}

// ===== 8-bit BGM Generator =====
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

// ===== 作者の悲鳴（uservoice.m4a）のロード =====
let userVoiceBuffer = null;
fetch('./uservoice.m4a')
  .then(res => res.arrayBuffer())
  .then(arrayBuffer => audioCtx.decodeAudioData(arrayBuffer))
  .then(buffer => {
    userVoiceBuffer = buffer;
    console.log("🔊 uservoice.m4a loaded successfully!");
  })
  .catch(err => {
    console.warn("⚠️ Failed to load uservoice.m4a:", err);
  });

function playUserVoice() {
  if (!userVoiceBuffer || !audioCtx) return;
  // AudioContextが中断している場合は再開する
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  const source = audioCtx.createBufferSource();
  source.buffer = userVoiceBuffer;
  source.connect(audioCtx.destination);
  source.start(0);
}

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
  document.getElementById('current-score-val').innerText = 0;
  updateBestDisplay();

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

  // プレイ人数のカウントアップ
  if (window.logPlayerStart) window.logPlayerStart();

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

// ===== 吹き飛ばしモード起動 =====
window.startRevengeMode = () => {
  revengeMode = true;
  revengeScore = 0;
  gameOver = false;
  speed = 0.35; // 少し速めにして爽快感を出す！
  spawnTimer = 0;
  isLookingBehind = false;
  lookBehindTimer = 0;
  targetRotationY = Math.PI / 2;

  // スコア表示リセット
  document.getElementById('current-score-val').innerText = 0;
  
  // スコア表示のラベルを「💥 撃破数」的なものに変える（遊び心）
  const scoreLabel = document.querySelector('.score-label') || document.getElementById('score-label');
  if (scoreLabel) {
    scoreLabel.innerHTML = 'BLASTS: <span id="current-score-val">0</span>';
  } else {
    // もしラベル要素がなければ作成するか、既存の表示を更新
    const curVal = document.getElementById('current-score-val');
    if (curVal) curVal.innerText = 0;
  }

  // 既存のオブジェクトを全削除
  yogurts.forEach(y => scene.remove(y));
  yogurts.length = 0;
  blownSprites.forEach(b => scene.remove(b.mesh));
  blownSprites.length = 0;

  // モアイ位置リセット
  moai.position.set(0, 0, 0);
  moai.rotation.z = 0;

  // スタート画面を非表示
  document.getElementById('start-screen').style.display = 'none';

  // 💥 スッキリしたボタンを表示
  const backBtn = document.getElementById('revenge-back-btn');
  if (backBtn) backBtn.style.display = 'block';

  // AudioContext再開
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  isPlayingBGM = true;
  nextNoteTime = audioCtx.currentTime;
  scheduleMusic();

  if (!gameStarted) {
    gameStarted = true;
    animate();
  }
  gameStarted = true;
};

// ===== スタート画面に戻る =====
window.stopRevengeMode = () => {
  // ページを再読み込みして完全にクリーンな初期スタート画面に戻る
  location.reload();
};


