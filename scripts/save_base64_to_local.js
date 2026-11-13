const fs = require('fs');
const path = require('path');
const https = require('https');

const KURIMA_DIR = path.resolve(__dirname, '..', 'images', 'kurima');

function fetchJson(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { resolve(null); }
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

async function run() {
  console.log('📡 Firestoreから custom_products と works_master を取得中...');
  const [cpDoc, wmDoc] = await Promise.all([
    fetchJson('https://firestore.googleapis.com/v1/projects/moai-catalog/databases/(default)/documents/settings/custom_products'),
    fetchJson('https://firestore.googleapis.com/v1/projects/moai-catalog/databases/(default)/documents/settings/works_master')
  ]);
  const cp = decodeFirestoreDoc(cpDoc);
  const wm = decodeFirestoreDoc(wmDoc);

  const allKeys = Array.from(new Set([...Object.keys(cp), ...Object.keys(wm)]));
  let savedCount = 0;

  for (const key of allKeys) {
    const item = { ...(wm[key] || {}), ...(cp[key] || {}) };
    const candidates = [];
    if (typeof item.image === 'string' && item.image.startsWith('data:image/')) {
      candidates.push({ type: 'main', data: item.image });
    }
    if (Array.isArray(item.images)) {
      item.images.forEach((img, idx) => {
        if (typeof img === 'string' && img.startsWith('data:image/')) {
          candidates.push({ type: 'sub_' + idx, data: img });
        }
      });
    }

    if (candidates.length > 0) {
      console.log(`🔍 作品【${key}】のBase64画像を検出 (${candidates.length} 枚)`);
      const targetFolder = path.join(KURIMA_DIR, key);
      if (!fs.existsSync(targetFolder)) fs.mkdirSync(targetFolder, { recursive: true });

      candidates.forEach(c => {
        const match = c.data.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
        if (match) {
          const rawExt = match[1].toLowerCase();
          const ext = rawExt.includes('png') ? 'png' : (rawExt.includes('webp') ? 'webp' : 'jpg');
          const buf = Buffer.from(match[2], 'base64');
          if (c.type === 'main') {
            const outPathDirect = path.join(KURIMA_DIR, `${key}.${ext}`);
            const outPathFolder = path.join(targetFolder, `${key}.${ext}`);
            fs.writeFileSync(outPathDirect, buf);
            fs.writeFileSync(outPathFolder, buf);
            console.log(`  💾 カバー画像を保存: images/kurima/${key}.${ext} (${buf.length} bytes)`);
            savedCount++;
          } else {
            const outPathSub = path.join(targetFolder, `${key}_${c.type}.${ext}`);
            fs.writeFileSync(outPathSub, buf);
            console.log(`  💾 サブ画像を保存: images/kurima/${key}/${key}_${c.type}.${ext} (${buf.length} bytes)`);
            savedCount++;
          }
        }
      });
    }
  }
  console.log(`\n🎉 合計 ${savedCount} 枚のBase64画像をローカル images/kurima/ に正常保存しました！`);
}

run();
