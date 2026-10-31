/**
 * ====================================================================
 * Studio Moai バッチ処理補助スクリプト (scripts/studio_batch.js)
 * ====================================================================
 * 
 * 役割:
 *   1. `images/kurima/<作品ID>/raw/` および `スタジオモアイ/` 内の未処理RAW画像をスキャン
 *   2. `images/kurima/<作品ID>/studio/` に対応するSTUDIO画像が存在するか突合
 *   3. 未処理のRAW画像リストを出力し、アンチグラビティが `studio_rules.md` に基づき
 *      image-generator サブエージェントで背景処理を実行するための準備を行う。
 * 
 * ※ ユーザーからの明示的な「Studio Moai」または「スタジオ開始」の指示があるまで
 *    自動では画像生成を実行しません（API枠とコストの保護）。
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const KURIMA_DIR = path.join(ROOT_DIR, 'images', 'kurima');
const LEGACY_DIR = path.join(ROOT_DIR, 'スタジオモアイ');

function isImage(f) {
  const ext = path.extname(f).toLowerCase();
  return ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
}

function scanPendingImages(targetWorkId = null) {
  const pending = [];

  // 1. 各作品の raw フォルダをスキャン
  if (fs.existsSync(KURIMA_DIR)) {
    const workDirs = fs.readdirSync(KURIMA_DIR).filter(d => {
      if (d.startsWith('.') || d.startsWith('dev_')) return false;
      const full = path.join(KURIMA_DIR, d);
      return fs.statSync(full).isDirectory();
    });

    for (const workId of workDirs) {
      if (targetWorkId && workId !== targetWorkId) continue;

      const rawDir = path.join(KURIMA_DIR, workId, 'raw');
      const studioDir = path.join(KURIMA_DIR, workId, 'studio');

      if (!fs.existsSync(rawDir)) continue;
      if (!fs.existsSync(studioDir)) fs.mkdirSync(studioDir, { recursive: true });

      const rawFiles = fs.readdirSync(rawDir).filter(isImage);
      const studioFiles = fs.readdirSync(studioDir).filter(isImage);

      for (const rFile of rawFiles) {
        // すでに studio に同等または接尾辞 _studio を含む生成画像があるか確認
        const baseName = path.parse(rFile).name.replace(/_RAW_/i, '_');
        const hasStudio = studioFiles.some(s => {
          const sBase = path.parse(s).name;
          return sBase.includes(baseName) || sBase.startsWith(`${workId}_STUDIO_`);
        });

        if (!hasStudio) {
          pending.push({
            workId,
            filename: rFile,
            rawPath: path.join(rawDir, rFile),
            rawRel: `images/kurima/${workId}/raw/${rFile}`,
            studioDir: studioDir,
            expectedStudioRel: `images/kurima/${workId}/studio/${workId}_STUDIO_${path.parse(rFile).name}.png`
          });
        }
      }
    }
  }

  // 2. 従来の「スタジオモアイ」フォルダ（互換性維持）
  if (fs.existsSync(LEGACY_DIR)) {
    const legacyOut = path.join(LEGACY_DIR, '撮影会場');
    if (!fs.existsSync(legacyOut)) fs.mkdirSync(legacyOut, { recursive: true });

    const legacyFiles = fs.readdirSync(LEGACY_DIR).filter(f => {
      const full = path.join(LEGACY_DIR, f);
      return !fs.statSync(full).isDirectory() && isImage(f) && !f.startsWith('processed_');
    });

    for (const lFile of legacyFiles) {
      pending.push({
        workId: 'legacy',
        filename: lFile,
        rawPath: path.join(LEGACY_DIR, lFile),
        rawRel: `スタジオモアイ/${lFile}`,
        studioDir: legacyOut,
        expectedStudioRel: `スタジオモアイ/撮影会場/${path.parse(lFile).name}_studio.png`
      });
    }
  }

  return pending;
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const targetId = args[0] || null;

  console.log('🗿 ========================================================');
  console.log('🗿 Studio Moai: 未処理RAW画像スキャナー');
  console.log('🗿 ========================================================');

  const pending = scanPendingImages(targetId);
  if (pending.length === 0) {
    console.log('✅ 未処理のRAW画像はありません（すべて処理済み、または待機中）。');
  } else {
    console.log(`📸 未処理のRAW画像: ${pending.length} 件`);
    pending.forEach((p, idx) => {
      console.log(` [${idx + 1}] 作品: ${p.workId} | ファイル: ${p.filename}`);
      console.log(`     入力: ${p.rawRel}`);
      console.log(`     予定出力: ${p.expectedStudioRel}`);
    });
    console.log('\n💡 ユーザーから「Studio Moai」の指示を受けた際に、studio_rules.md に従って背景処理を実行します。');
  }
}

module.exports = { scanPendingImages };
