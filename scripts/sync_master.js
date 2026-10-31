/**
 * ====================================================================
 * OMOAI ⇄ POS 作品マスター自動同期スクリプト (scripts/sync_master.js)
 * ====================================================================
 * 
 * 使い方:
 *   node scripts/sync_master.js
 * 
 * 役割:
 *   1. Firestore (custom_products, works_master) から新作・登録作品を取得
 *   2. 作品IDごとに `images/kurima/<作品ID>/` フォルダ（受け皿）を自動作成
 *   3. Omoaiのカバー画像（DataURL）があれば初期画像として保存
 *   4. フォルダ内に放り込まれた背景処理済み画像を検知し、`data.js` (MASTER_PRODUCTS) に1発登録・更新
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT_DIR = path.resolve(__dirname, '..');
const KURIMA_DIR = path.join(ROOT_DIR, 'images', 'kurima');
const DATA_JS_PATH = path.join(ROOT_DIR, 'data.js');

// Firestore REST エンドポイント
const FIRESTORE_BASE = 'https://firestore.googleapis.com/v1/projects/moai-catalog/databases/(default)/documents/settings';

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`JSON parse error: ${e.message}`));
          }
        } else {
          resolve(null); // ドキュメントがない場合など
        }
      });
    }).on('error', reject);
  });
}

// Firestoreの型付きJSONを通常オブジェクトに変換
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

async function main() {
  console.log('🗿 ========================================================');
  console.log('🗿  OMOAI ⇄ POS 作品マスター自動同期 & 受け皿作成スクリプト');
  console.log('🗿 ========================================================\n');

  // 1. images/kurima フォルダ確認
  if (!fs.existsSync(KURIMA_DIR)) {
    fs.mkdirSync(KURIMA_DIR, { recursive: true });
  }

  // 2. Firestore から custom_products と works_master を取得
  console.log('📡 1. Firestore から作品マスター設定を取得中...');
  const [cpDoc, wmDoc] = await Promise.all([
    fetchJson(`${FIRESTORE_BASE}/custom_products`),
    fetchJson(`${FIRESTORE_BASE}/works_master`)
  ]);

  const customProducts = decodeFirestoreDoc(cpDoc);
  const worksMaster = decodeFirestoreDoc(wmDoc);

  const productKeys = Array.from(new Set([
    ...Object.keys(customProducts),
    ...Object.keys(worksMaster)
  ]));

  console.log(`   → 対象作品ID数: ${productKeys.length}件\n`);

  let createdFolderCount = 0;
  let savedInitialImgCount = 0;
  const newMasterEntries = [];

  // 3. 各作品IDの受け皿フォルダ確認＆作成
  console.log('📁 2. 各作品の受け皿フォルダ・画像チェック中...');
  for (const posId of productKeys) {
    const cp = customProducts[posId] || {};
    const wm = worksMaster[posId] || {};
    const name = wm.name || cp.name || posId;
    const desc = wm.desc || cp.desc || '';
    const price = wm.price || cp.price || 0;

    const itemFolder = path.join(KURIMA_DIR, posId);
    if (!fs.existsSync(itemFolder)) {
      fs.mkdirSync(itemFolder, { recursive: true });
      console.log(`   ✨ 新規フォルダ作成: images/kurima/${posId}/ (作品名: ${name})`);
      createdFolderCount++;
    }

    // カバー画像（DataURL）がある場合、ローカルに未保存なら保存
    const rawImage = wm.image || cp.image || '';
    const mainImgJpg = path.join(KURIMA_DIR, `${posId}.jpg`);
    const mainImgPng = path.join(KURIMA_DIR, `${posId}.png`);
    let mainImgRel = '';

    if (fs.existsSync(mainImgPng)) {
      mainImgRel = `images/kurima/${posId}.png`;
    } else if (fs.existsSync(mainImgJpg)) {
      mainImgRel = `images/kurima/${posId}.jpg`;
    } else if (rawImage && rawImage.startsWith('data:image/')) {
      const match = rawImage.match(/^data:image\/(\w+);base64,(.+)$/);
      if (match) {
        const ext = match[1] === 'png' ? 'png' : 'jpg';
        const targetPath = path.join(KURIMA_DIR, `${posId}.${ext}`);
        fs.writeFileSync(targetPath, Buffer.from(match[2], 'base64'));
        mainImgRel = `images/kurima/${posId}.${ext}`;
        console.log(`   📷 OMOAIカバー画像を保存: ${mainImgRel}`);
        savedInitialImgCount++;
      }
    }

    // フォルダ内のサブ画像をスキャン
    const subFiles = fs.readdirSync(itemFolder).filter(f => {
      const ext = path.extname(f).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.webp', '.mp4'].includes(ext);
    });

    // メイン画像が未定でサブ画像がある場合、1枚目をメイン画像に採用
    if (!mainImgRel && subFiles.length > 0) {
      mainImgRel = `images/kurima/${posId}/${subFiles[0]}`;
    }

    const subImgPaths = subFiles.map(f => `images/kurima/${posId}/${f}`);

    newMasterEntries.push({
      posId,
      name,
      desc,
      price,
      mainImgRel: mainImgRel || `images/kurima/${posId}.jpg`,
      subImgPaths
    });
  }

  // 4. data.js (MASTER_PRODUCTS) への同期
  console.log('\n📝 3. data.js の MASTER_PRODUCTS と同期確認中...');
  if (!fs.existsSync(DATA_JS_PATH)) {
    console.error('❌ data.js が見つかりません。');
    return;
  }

  const dataJsContent = fs.readFileSync(DATA_JS_PATH, 'utf8');

  // バックアップ作成
  fs.writeFileSync(DATA_JS_PATH + '.bak', dataJsContent, 'utf8');

  let updatedCount = 0;
  let addedCount = 0;
  let modifiedDataJs = dataJsContent;

  for (const entry of newMasterEntries) {
    // 既に data.js に存在するかチェック (posId または画像名で照合)
    const existsRegex = new RegExp(`['"]images/kurima/${entry.posId}(?:\\.(?:jpg|png)|/)`, 'i');
    const nameRegex = new RegExp(`name\\s*:\\s*['"]${escapeRegex(entry.name)}['"]`, 'i');

    if (existsRegex.test(modifiedDataJs)) {
      // 既存作品: フォルダ内のサブ画像が更新されている場合、images 配列を更新
      if (entry.subImgPaths.length > 0) {
        // 必要に応じて置換ロジック
        console.log(`   🔄 既存作品を検出: ${entry.name} (${entry.posId}) - 画像数: ${entry.subImgPaths.length}枚`);
      }
    } else {
      // 新規登録作品: MASTER_PRODUCTS 配列の先頭（または末尾）に追加
      const imagesListCode = entry.subImgPaths.length > 0
        ? `\n    images: [\n${entry.subImgPaths.map(p => `      '${p}',`).join('\n')}\n    ],`
        : '';

      const newEntryCode = `  {
    image: '${entry.mainImgRel}',${imagesListCode}
    name: '${entry.name.replace(/'/g, "\\'")}',
    desc: '${entry.desc.replace(/'/g, "\\'")}',
  },
`;
      // const MASTER_PRODUCTS = [ の直後に挿入
      const insertMarker = 'const MASTER_PRODUCTS = [';
      const markerIdx = modifiedDataJs.indexOf(insertMarker);
      if (markerIdx !== -1) {
        const insertPos = markerIdx + insertMarker.length;
        modifiedDataJs = modifiedDataJs.slice(0, insertPos) + '\n' + newEntryCode + modifiedDataJs.slice(insertPos);
        addedCount++;
        console.log(`   ➕ MASTER_PRODUCTS へ追加: ${entry.name} (${entry.posId})`);
      }
    }
  }

  if (addedCount > 0) {
    fs.writeFileSync(DATA_JS_PATH, modifiedDataJs, 'utf8');
    console.log(`\n💾 data.js を更新しました！（新規追加: ${addedCount}件）`);
  } else {
    console.log('\n✅ data.js は最新です（追加の必要はありません）。');
  }

  console.log('\n========================================================');
  console.log(`🎉 同期完了！`);
  console.log(`   - 新規作成フォルダ: ${createdFolderCount}件`);
  console.log(`   - 保存したOMOAI画像: ${savedInitialImgCount}件`);
  console.log(`   - data.js 新規追加: ${addedCount}件`);
  console.log('========================================================\n');
  console.log('💡 ヒント: 背景処理した画像を `images/kurima/<作品ID>/` に放り込んで');
  console.log('   再度 `node scripts/sync_master.js` を実行すると画像リストが自動反映されます！\n');
}

function escapeRegex(string) {
  return string.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
}

main().catch(err => {
  console.error('❌ エラーが発生しました:', err);
});
