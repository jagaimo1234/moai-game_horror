# Project Rules

## 📅 永続的な定期自動タスク設定 (Persistent Periodic Tasks)
本プロジェクトでは、AIによる定期的なイベント巡回タスクを永続化するために、エージェント起動時に毎回以下のタスクスケジュール状況を確認・復元します。

### 1. 出店イベント自動巡回タスク
エージェントが起動（セッション開始、または再起動）された際、以下のスケジュール設定が存在するか確認し、存在しない場合は再登録してください。

*   **実行スケジュール**: 毎週日曜日 0:00 (JST) - `0 0 * * 0`
*   **タスク指示内容 (Prompt)**:
    `Execute event crawler research and update exhibition plans based on user criteria (Kanto, Kansai, Hokuriku, Taiwan). Run 'scratch/update_exhibition_plans.py' and update 'event_research.md'.`
*   **巡回対象**: 関東中心、台湾、北陸、関西エリアのハンドメイド出店募集イベント情報。

### 2. OMOAI新作フォルダ自動受け皿生成・同期タスク (Auto Folder Setup)
ユーザーが「マスター登録」や「フォルダ作って」と明示的に指示しなくても、OMOAIで仮登録・完成宣言された新作の受け皿を自動準備します。
エージェントが起動（セッション開始、または再起動）された際、および定期スケジュールにて、自動で以下を実行してください。

*   **実行スクリプト**: `node scripts/sync_master.js`
*   **目的**: Firestore (`settings/custom_products`, `settings/works_master`) をスキャンし、`images/kurima/<作品ID>/` フォルダ（受け皿）を自動作成＆初期カバー画像（DataURL）をローカル保存する。
*   **報告**: もし新規にフォルダが作成された作品があれば、ユーザーに「📁 新作【作品名 (ID)】の受け皿フォルダを作成しました。背景処理した画像をここに配置してください」と案内する。
*   **定期監視スケジュール**: 毎日 9:00, 15:00, 21:00 (JST) - `0 9,15,21 * * *`
    *   Prompt: `Check Firestore for newly registered OMOAI ideas, auto-create receiving folders in images/kurima/<id>/, and sync master by running 'node scripts/sync_master.js'.`
