/**
 * ====================================================================
 * OMOAI ⇄ POS 作品マスター一括本登録＆同期スクリプト (scripts/sync_master.js)
 * ====================================================================
 * 
 * 使い方:
 *   node scripts/sync_master.js
 * 
 * 役割:
 *   1. 【受け皿フォルダ自動作成】
 *      OMOAIで新作仮登録された作品IDの受け皿フォルダ `images/kurima/<作品ID>/` を自動作成。
 *   2. 【マスター本登録】
 *      ユーザーが背景処理した画像を配置後、「マスター登録」の指示により、
 *      未登録の作品（複数作品でも可）を一括検知して `data.js` へ安全に本登録。
 *   3. 【既存作品の安全性維持】
 *      既存作品のデータを破壊することなく、新規作品のみを確実に登録します。
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { syncDriveToLocal } = require('./sync_drive_to_local');

const ROOT_DIR = path.resolve(__dirname, '..');
const KURIMA_DIR = path.join(ROOT_DIR, 'images', 'kurima');
const DATA_JS_PATH = path.join(ROOT_DIR, 'data.js');

const FIRESTORE_BASE = 'https://firestore.googleapis.com/v1/projects/moai-catalog/databases/(default)/documents/settings';

function fetchJson(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      res.setEncoding('utf8');
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve(null);
          }
        } else {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

function decodeFirestoreValue(val) {
  if (!val) return null;
  if ('stringValue' in val) return val.stringValue;
  if ('integerValue' in val) return parseInt(val.integerValue, 10);
  if ('doubleValue' in val) return parseFloat(val.doubleValue);
  if ('booleanValue' in val) return val.booleanValue;
  if ('nullValue' in val) return null;
  if ('mapValue' in val) {
    const obj = {};
    const fields = val.mapValue.fields || {};
    for (const k of Object.keys(fields)) {
      obj[k] = decodeFirestoreValue(fields[k]);
    }
    return obj;
  }
  if ('arrayValue' in val) {
    const list = val.arrayValue.values || [];
    return list.map(decodeFirestoreValue);
  }
  return null;
}

function decodeFirestoreDoc(docJson) {
  if (!docJson || !docJson.fields) return {};
  const res = {};
  for (const [key, val] of Object.entries(docJson.fields)) {
    res[key] = decodeFirestoreValue(val);
  }
  return res;
}

function isImageOrMedia(file) {
  const ext = path.extname(file).toLowerCase();
  return ['.jpg', '.jpeg', '.png', '.webp', '.mp4'].includes(ext);
}

async function main() {
  console.log('🗿 ========================================================');
  console.log('🗿  OMOAI ⇄ POS 作品マスター一括本登録＆同期システム');
  console.log('🗿 ========================================================\n');

  if (!fs.existsSync(KURIMA_DIR)) {
    fs.mkdirSync(KURIMA_DIR, { recursive: true });
  }

  // 0. Google Driveからローカル images/kurima/<ID>/raw への同期を実行
  try {
    const driveSynced = syncDriveToLocal();
    if (driveSynced > 0) {
      console.log(`📥 Google Driveから ${driveSynced} 件のRAW写真をローカル同期しました`);
    }
  } catch (e) {
    // Gドライブ未マウント時はスキップ
  }

  // 1. クラウド設定を取得
  console.log('📡 1. クラウド設定を取得中...');
  const [cpDoc, wmDoc] = await Promise.all([
    fetchJson(`${FIRESTORE_BASE}/custom_products`),
    fetchJson(`${FIRESTORE_BASE}/works_master`)
  ]);

  const customProducts = decodeFirestoreDoc(cpDoc);
  const worksMaster = decodeFirestoreDoc(wmDoc);

  // 2. OMOAIで仮登録された作品IDの受け皿フォルダを作成
  const BLACKLIST_KEYS = ['moai_losscut', 'moai_losscut_RAW_20261105_201128_001', 'cover', 'ハイレグモアイ_master', 'ChatGPT 画像 2026年11月5日 20_27_08-1'];
  const remoteProductKeys = Array.from(new Set([
    ...Object.keys(customProducts),
    ...Object.keys(worksMaster)
  ])).filter(k => k && !k.startsWith('dev_') && !k.startsWith('temp_') && !k.includes('.') && !/^\d+$/.test(k) && !BLACKLIST_KEYS.includes(k));

  for (const posId of remoteProductKeys) {
    const itemFolder = path.join(KURIMA_DIR, posId);
    let created = false;
    if (!fs.existsSync(itemFolder)) {
      fs.mkdirSync(itemFolder, { recursive: true });
      created = true;
    }
    const rawFolder = path.join(itemFolder, 'raw');
    const studioFolder = path.join(itemFolder, 'studio');
    if (!fs.existsSync(rawFolder)) fs.mkdirSync(rawFolder, { recursive: true });
    if (!fs.existsSync(studioFolder)) fs.mkdirSync(studioFolder, { recursive: true });

    // 手動アップロード・差し替えされたDataURL画像がFirestoreにあればローカルカバー画像・サブ画像として完全同期
    const candidates = [];
    const mainDataUrl = worksMaster[posId]?.image || customProducts[posId]?.image || '';
    if (typeof mainDataUrl === 'string' && mainDataUrl.startsWith('data:image/')) {
      candidates.push({ type: 'main', data: mainDataUrl });
    }
    const subList = worksMaster[posId]?.images || customProducts[posId]?.images || [];
    if (Array.isArray(subList)) {
      subList.forEach((s, sIdx) => {
        if (typeof s === 'string' && s.startsWith('data:image/')) {
          candidates.push({ type: 'sub_' + sIdx, data: s });
        }
      });
    }

    candidates.forEach(c => {
      const match = c.data.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
      if (match) {
        const rawExt = match[1].toLowerCase();
        const ext = rawExt.includes('png') ? 'png' : (rawExt.includes('webp') ? 'webp' : 'jpg');
        const buf = Buffer.from(match[2], 'base64');
        if (c.type === 'main') {
          const directFile = path.join(KURIMA_DIR, `${posId}.${ext}`);
          const itemFolderFile = path.join(itemFolder, `${posId}.${ext}`);
          const existingSize = fs.existsSync(directFile) ? fs.statSync(directFile).size : -1;
          if (existingSize !== buf.length) {
            fs.writeFileSync(directFile, buf);
            fs.writeFileSync(itemFolderFile, buf);
            console.log(`   🖼️ 手動追加・差し替えのカバー画像をローカル同期: images/kurima/${posId}.${ext}`);
          }
        } else {
          const subFile = path.join(itemFolder, `${posId}_${c.type}.${ext}`);
          const existingSize = fs.existsSync(subFile) ? fs.statSync(subFile).size : -1;
          if (existingSize !== buf.length) {
            fs.writeFileSync(subFile, buf);
            console.log(`   🖼️ サブ画像をローカル同期: images/kurima/${posId}/${posId}_${c.type}.${ext}`);
          }
        }
      }
    });

    if (created) {
      const name = worksMaster[posId]?.name || customProducts[posId]?.name || posId;
      console.log(`   📁 新規受け皿フォルダを自動作成: images/kurima/${posId}/ (作品名: ${name})`);
    }
  }

  // 3. data.js を読み込み、未登録の新作を一括検出
  console.log('\n🔍 2. 未登録の新作をスキャン中...');
  if (!fs.existsSync(DATA_JS_PATH)) {
    console.error('❌ data.js が見つかりません');
    return;
  }

  let dataJsContent = fs.readFileSync(DATA_JS_PATH, 'utf8');

  // kurima ディレクトリ内の全作品フォルダをチェック
  const subDirs = fs.readdirSync(KURIMA_DIR).filter(f => {
    if (f.startsWith('dev_') || f.startsWith('.')) return false;
    const full = path.join(KURIMA_DIR, f);
    return fs.statSync(full).isDirectory();
  });

  const newlyAdded = [];

  for (const posId of subDirs) {
    const wm = worksMaster[posId] || {};
    const cp = customProducts[posId] || {};
    const name = wm.name || cp.name || posId.replace(/_/g, ' ');
    const desc = wm.desc || cp.desc || wm.features || '';

    // 既に data.js に登録されているか確認
    // 1) 画像パスやIDとして含まれているか
    const existsPathPattern = new RegExp(`['"]images/kurima/${escapeRegex(posId)}(?:\\.[a-zA-Z0-9]+|/)`, 'i');
    const idPattern = new RegExp(`['"]${escapeRegex(posId)}['"]`, 'i');
    
    // 2) 作品名で既に登録されているか
    const namePattern = name ? new RegExp(`name:\\s*['"]${escapeRegex(name)}['"]`, 'i') : null;

    if (existsPathPattern.test(dataJsContent) || idPattern.test(dataJsContent) || (namePattern && namePattern.test(dataJsContent))) {
      continue; // 既に登録済みなら安全のためスキップ
    }

    const itemFolder = path.join(KURIMA_DIR, posId);
    
    // 直下ファイル、studio内、raw内を走査
    const directFiles = fs.existsSync(itemFolder) ? fs.readdirSync(itemFolder).filter(f => {
      const full = path.join(itemFolder, f);
      return !fs.statSync(full).isDirectory() && isImageOrMedia(f);
    }).map(f => `images/kurima/${posId}/${f}`) : [];

    const studioDir = path.join(itemFolder, 'studio');
    const studioFiles = fs.existsSync(studioDir) ? fs.readdirSync(studioDir).filter(isImageOrMedia).map(f => `images/kurima/${posId}/studio/${f}`) : [];

    const rawDir = path.join(itemFolder, 'raw');
    const rawFiles = fs.existsSync(rawDir) ? fs.readdirSync(rawDir).filter(isImageOrMedia).map(f => `images/kurima/${posId}/raw/${f}`) : [];

    // カバー画像（メイン画像）の決定: studio > direct （※RAW写真は未処理のため絶対に公開カバーに自動設定しない）
    let mainImgRel = '';
    const directPng = path.join(KURIMA_DIR, `${posId}.png`);
    const directJpg = path.join(KURIMA_DIR, `${posId}.jpg`);
    if (fs.existsSync(directPng)) {
      mainImgRel = `images/kurima/${posId}.png`;
    } else if (fs.existsSync(directJpg)) {
      mainImgRel = `images/kurima/${posId}.jpg`;
    } else if (studioFiles.length > 0) {
      mainImgRel = studioFiles[0];
    } else if (directFiles.length > 0) {
      mainImgRel = directFiles[0];
    } else {
      mainImgRel = '';
    }

    // 公開用のサブ画像リスト（スタジオフォルダ内の画像は候補プールWORK_FOLDER_ASSETS用とし、ユーザーがPOSで明示選択する前に勝手に全画像を data.js の公開 images に自動登録しない）
    const subImgPaths = directFiles.length > 0 ? directFiles : [];

    const imagesCode = subImgPaths.length > 0
      ? `\n    images: [\n${subImgPaths.map(p => `      '${p}',`).join('\n')}\n    ],`
      : '';

    const safeName = String(name || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\r?\n/g, '\\n');
    const safeDesc = String(desc || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\r?\n/g, '\\n');

    const newEntry = `  {
    id: '${posId}',
    image: '${mainImgRel}',${imagesCode}
    name: '${safeName}',
    desc: '${safeDesc}',
  },
`;
    // MASTER_PRODUCTS の先頭に安全に挿入
    const marker = 'const MASTER_PRODUCTS = [';
    const mIdx = dataJsContent.indexOf(marker);
    if (mIdx !== -1) {
      const insertAt = mIdx + marker.length;
      dataJsContent = dataJsContent.slice(0, insertAt) + '\n' + newEntry + dataJsContent.slice(insertAt);
      newlyAdded.push(`✨ ${name} (${posId}) - サブ画像: ${subImgPaths.length}枚`);
    }
  }

  // 4. ローカル内の全作品フォルダの raw / studio 画像アセット辞書を更新
  const workAssets = {};
  for (const posId of subDirs) {
    const itemFolder = path.join(KURIMA_DIR, posId);
    const rawDir = path.join(itemFolder, 'raw');
    const studioDir = path.join(itemFolder, 'studio');
    const rawFiles = fs.existsSync(rawDir) ? fs.readdirSync(rawDir).filter(isImageOrMedia).map(f => `images/kurima/${posId}/raw/${f}`) : [];
    const studioFiles = fs.existsSync(studioDir) ? fs.readdirSync(studioDir).filter(isImageOrMedia).map(f => `images/kurima/${posId}/studio/${f}`) : [];
    if (rawFiles.length > 0 || studioFiles.length > 0) {
      workAssets[posId] = { raw: rawFiles, studio: studioFiles };
    }
  }

  const assetsMarker = '// === WORK_FOLDER_ASSETS_START ===';
  const assetsEndMarker = '// === WORK_FOLDER_ASSETS_END ===';
  const assetsBlock = `${assetsMarker}\nwindow.WORK_FOLDER_ASSETS = ${JSON.stringify(workAssets, null, 2)};\n${assetsEndMarker}`;

  if (dataJsContent.includes(assetsMarker) && dataJsContent.includes(assetsEndMarker)) {
    const aStart = dataJsContent.indexOf(assetsMarker);
    const aEnd = dataJsContent.indexOf(assetsEndMarker) + assetsEndMarker.length;
    dataJsContent = dataJsContent.slice(0, aStart) + assetsBlock + dataJsContent.slice(aEnd);
  } else {
    dataJsContent = dataJsContent.trimEnd() + '\n\n' + assetsBlock + '\n';
  }

  fs.writeFileSync(DATA_JS_PATH, dataJsContent, 'utf8');

  if (newlyAdded.length > 0) {
    console.log(`\n💾 data.js に新作を一括本登録しました！（${newlyAdded.length}作品）`);
    newlyAdded.forEach(msg => console.log(`   ${msg}`));
  } else {
    console.log('\n✅ 新規に本登録する作品はありませんでした（すべて最新です）。');
  }
  console.log(`📸 ローカル画像アセット（raw / studio）を data.js へ同期しました。`);

  console.log('\n========================================================');
  console.log('🎉 処理が完了しました！');
  console.log('========================================================\n');
}

function escapeRegex(string) {
  return string.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
}

main().catch(err => {
  console.error('❌ エラー:', err);
});
