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

const ROOT_DIR = path.resolve(__dirname, '..');
const KURIMA_DIR = path.join(ROOT_DIR, 'images', 'kurima');
const SYNC_SCRIPT = path.join(__dirname, 'sync_master.js');
const FIRESTORE_URL = 'https://firestore.googleapis.com/v1/projects/moai-catalog/databases/(default)/documents/settings/custom_products';

const CHECK_INTERVAL_MS = 30 * 1000; // 30秒ごとにチェック

console.log('🗿 [OMOAI Watcher] 新作マスター常駐監視デーモンを起動しました (30秒間隔)');

function checkAndSync() {
  https.get(FIRESTORE_URL, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      if (res.statusCode !== 200) return;
      try {
        const json = JSON.parse(body);
        const fields = json.fields || {};
        const remoteIds = Object.keys(fields);

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
