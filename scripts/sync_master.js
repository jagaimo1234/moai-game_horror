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

const ROOT_DIR = path.resolve(__dirname, '..');
const KURIMA_DIR = path.join(ROOT_DIR, 'images', 'kurima');
const DATA_JS_PATH = path.join(ROOT_DIR, 'data.js');

const FIRESTORE_BASE = 'https://firestore.googleapis.com/v1/projects/moai-catalog/databases/(default)/documents/settings';

function fetchJson(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
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

  // 1. クラウド設定を取得
  console.log('📡 1. クラウド設定を取得中...');
  const [cpDoc, wmDoc] = await Promise.all([
    fetchJson(`${FIRESTORE_BASE}/custom_products`),
    fetchJson(`${FIRESTORE_BASE}/works_master`)
  ]);

  const customProducts = decodeFirestoreDoc(cpDoc);
  const worksMaster = decodeFirestoreDoc(wmDoc);

  // 2. OMOAIで仮登録された作品IDの受け皿フォルダを作成
  const remoteProductKeys = Array.from(new Set([
    ...Object.keys(customProducts),
    ...Object.keys(worksMaster)
  ])).filter(k => k && !k.startsWith('dev_') && !k.startsWith('temp_') && !/^\d+$/.test(k) && k !== 'moai_lure_stand' && k !== 'moai_robo_mk2_gray');

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

    // カバー画像（メイン画像）の決定: studio > direct > raw
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
    } else if (rawFiles.length > 0) {
      mainImgRel = rawFiles[0];
    } else {
      mainImgRel = `images/kurima/${posId}.jpg`;
    }

    const subImgPaths = [...studioFiles, ...directFiles, ...rawFiles];

    const imagesCode = subImgPaths.length > 0
      ? `\n    images: [\n${subImgPaths.map(p => `      '${p}',`).join('\n')}\n    ],`
      : '';

    const newEntry = `  {
    image: '${mainImgRel}',${imagesCode}
    name: '${name.replace(/'/g, "\\'")}',
    desc: '${desc.replace(/'/g, "\\'")}',
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

  if (newlyAdded.length > 0) {
    fs.writeFileSync(DATA_JS_PATH, dataJsContent, 'utf8');
    console.log(`\n💾 data.js に新作を一括本登録しました！（${newlyAdded.length}作品）`);
    newlyAdded.forEach(msg => console.log(`   ${msg}`));
  } else {
    console.log('\n✅ 新規に本登録する作品はありませんでした（すべて最新です）。');
  }

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
