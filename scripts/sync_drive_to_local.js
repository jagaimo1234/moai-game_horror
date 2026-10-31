/**
 * ====================================================================
 * Google Drive ⇄ ローカル images/kurima/<ID>/raw 同期スクリプト
 * ====================================================================
 * 
 * iPhoneのSnapSortアプリが Google Drive の「images/kurima/<作品ID>/raw/」
 * にアップロードした写真を検知し、Windowsローカルの
 * 「C:\dev\moaigame3D - コピー\images\kurima\<作品ID>\raw\」へ自動コピー・同期します。
 */

const fs = require('fs');
const path = require('path');

const LOCAL_KURIMA = path.resolve(__dirname, '..', 'images', 'kurima');
const GDRIVE_ROOTS = [
  'G:\\マイドライブ\\images\\kurima',
  'G:\\マイドライブ\\モアイ作品写真管理'
];

function isImageOrMedia(file) {
  const ext = path.extname(file).toLowerCase();
  return ['.jpg', '.jpeg', '.png', '.webp', '.mp4', '.mov'].includes(ext);
}

function syncDriveToLocal() {
  let copiedCount = 0;

  for (const driveRoot of GDRIVE_ROOTS) {
    if (!fs.existsSync(driveRoot)) continue;

    const subDirs = fs.readdirSync(driveRoot).filter(f => {
      try {
        return fs.statSync(path.join(driveRoot, f)).isDirectory() && !f.startsWith('.');
      } catch (e) {
        return false;
      }
    });

    for (const workId of subDirs) {
      // G:\マイドライブ\images\kurima\<workId>\raw または 直下
      const driveWorkDir = path.join(driveRoot, workId);
      const driveRawDir = path.join(driveWorkDir, 'raw');
      const targetLocalRawDir = path.join(LOCAL_KURIMA, workId, 'raw');

      if (!fs.existsSync(targetLocalRawDir)) {
        fs.mkdirSync(targetLocalRawDir, { recursive: true });
      }

      // raw フォルダが存在する場合
      const dirsToScan = [];
      if (fs.existsSync(driveRawDir)) dirsToScan.push(driveRawDir);
      dirsToScan.push(driveWorkDir);

      for (const d of dirsToScan) {
        let files = [];
        try {
          files = fs.readdirSync(d).filter(f => {
            try {
              const full = path.join(d, f);
              return !fs.statSync(full).isDirectory() && isImageOrMedia(f);
            } catch (e) { return false; }
          });
        } catch (e) { continue; }

        for (const f of files) {
          const src = path.join(d, f);
          const dest = path.join(targetLocalRawDir, f);
          if (!fs.existsSync(dest)) {
            try {
              fs.copyFileSync(src, dest);
              console.log(`📥 [Google Drive -> Local RAW] コピー完了: ${workId}/raw/${f}`);
              copiedCount++;
            } catch (err) {
              console.error(`❌ コピー失敗: ${f}`, err.message);
            }
          }
        }
      }
    }
  }

  return copiedCount;
}

if (require.main === module) {
  console.log('🔄 Google Drive ⇄ ローカル RAW 同期を実行中...');
  const count = syncDriveToLocal();
  console.log(`✅ 同期完了: ${count} 件の新規ファイルをローカル RAW へ反映しました。`);
}

module.exports = { syncDriveToLocal };
