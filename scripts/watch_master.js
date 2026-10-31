/**
 * ====================================================================
 * OMOAI ⇄ POS 新作リアルタイム常駐監視ウォッチャー (scripts/watch_master.js)
 * ====================================================================
 * 
 * 役割:
 *   Firestore を 30秒ごとに自動監視し、ユーザーがスマホやOMOAIで新作を
 *   仮登録・完成宣言した瞬間に【即座（最大30秒以内）】に受け皿フォルダ
 *   `images/kurima/<作品ID>/` を自動生成します。
 */

const { exec } = require('child_process');
const path = require('path');
const https = require('https');
const fs = require('fs');
const { syncDriveToLocal } = require('./sync_drive_to_local');

const ROOT_DIR = path.resolve(__dirname, '..');
const KURIMA_DIR = path.join(ROOT_DIR, 'images', 'kurima');
const SYNC_SCRIPT = path.join(__dirname, 'sync_master.js');
const FIRESTORE_URL = 'https://firestore.googleapis.com/v1/projects/moai-catalog/databases/(default)/documents/settings/custom_products';

const CHECK_INTERVAL_MS = 30 * 1000; // 30秒ごとにチェック

console.log('🗿 [OMOAI Watcher] 新作マスター常駐監視デーモンを起動しました (30秒間隔)');

function checkAndSync() {
  // 1. Google Drive の images/kurima/<ID>/raw からローカルへ自動同期
  try {
    const driveCount = syncDriveToLocal();
    if (driveCount > 0) {
      console.log(`📥 [OMOAI Watcher] Google Driveから ${driveCount} 件のRAW写真を同期しました`);
      exec(`node "${SYNC_SCRIPT}"`, () => {});
    }
  } catch (e) {
    // Gドライブ未マウント時はスキップ
  }

  // 2. Firestore をチェック
  https.get(FIRESTORE_URL, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      if (res.statusCode !== 200) return;
      try {
        const json = JSON.parse(body);
        const fields = json.fields || {};
        const remoteIds = Object.keys(fields).filter(k => k && !k.startsWith('dev_') && !k.startsWith('temp_') && !/^\d+$/.test(k));

        // ローカルに存在しないフォルダがあるかチェック
        let hasNew = false;
        for (const id of remoteIds) {
          const folder = path.join(KURIMA_DIR, id);
          if (!fs.existsSync(folder)) {
            hasNew = true;
            console.log(`✨ [OMOAI Watcher] 新規作品を検知しました: ${id} (${fields[id]?.mapValue?.fields?.name?.stringValue || ''})`);
            break;
          }
        }

        if (hasNew) {
          console.log('🚀 [OMOAI Watcher] sync_master.js を即座に実行します...');
          exec(`node "${SYNC_SCRIPT}"`, (err, stdout, stderr) => {
            if (err) {
              console.error('❌ 同期エラー:', err);
            } else {
              console.log(stdout);
            }
          });
        }
      } catch (e) {
        // 静かに無視
      }
    });
  }).on('error', () => {
    // ネットワーク一時エラーは無視
  });
}

// 起動時に1回実行
checkAndSync();

// 30秒ごとに定期監視
setInterval(checkAndSync, CHECK_INTERVAL_MS);

// ====================================================================
// 3. ローカル images/kurima フォルダのリアルタイムファイル監視 (fs.watch)
//    スタジオ生成画像やRAW画像が配置された瞬間に即検知し、
//    data.js更新 ＆ 自動Gitコミット・プッシュを実行します。
// ====================================================================

let localSyncTimer = null;
let autoGitPushTimer = null;

if (fs.existsSync(KURIMA_DIR)) {
  try {
    fs.watch(KURIMA_DIR, { recursive: true }, (eventType, filename) => {
      if (!filename) return;
      const lower = filename.toLowerCase();
      // 画像または動画ファイルの変更のみ対象
      if (!/\.(jpg|jpeg|png|webp|jfif|gif|mp4|mov)$/i.test(lower)) return;

      console.log(`📸 [OMOAI Watcher] ローカル画像変更を検知: ${filename} (${eventType})`);

      // 1.5秒デバウンスで sync_master.js 実行
      if (localSyncTimer) clearTimeout(localSyncTimer);
      localSyncTimer = setTimeout(() => {
        console.log('⚡ [OMOAI Watcher] sync_master.js を実行してローカルマスターを即時更新します...');
        exec(`node "${SYNC_SCRIPT}"`, (err, stdout) => {
          if (err) console.error('❌ sync_master 実行エラー:', err);
          else console.log('✅ ローカルマスター同期完了');
        });
      }, 1500);

      // 画像配置後、30秒間追加がなければ自動で GitHub にプッシュ（恒久保存）
      if (autoGitPushTimer) clearTimeout(autoGitPushTimer);
      autoGitPushTimer = setTimeout(() => {
        console.log('🚀 [OMOAI Watcher] 画像更新が安定したため、自動で GitHub にプッシュします...');
        const gitCmd = 'git add data.js images/ && git commit -m "auto(sync): 画像自動同期 (OMOAI Watcher)" && git push origin dev-escort-npc && git push origin HEAD:main';
        exec(gitCmd, { cwd: ROOT_DIR }, (err, stdout, stderr) => {
          if (err) {
            console.warn('⚠️ 自動プッシュ保留 (差分なし、またはネットワーク等):', err.message);
          } else {
            console.log('🎉 [OMOAI Watcher] GitHub Pagesへの自動プッシュが完了しました！');
          }
        });
      }, 30 * 1000);
    });
    console.log('👀 [OMOAI Watcher] images/kurima/ のローカル変更監視を開始しました');
  } catch (err) {
    console.warn('⚠️ fs.watch 開始エラー:', err.message);
  }
}
