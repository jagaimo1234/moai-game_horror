# Project Rules

## 📅 永続的な定期自動タスク設定 (Persistent Periodic Tasks)
本プロジェクトでは、AIによる定期的なイベント巡回タスクを永続化するために、エージェント起動時に毎回以下のタスクスケジュール状況を確認・復元します。

### 1. 出店イベント自動巡回タスク
エージェントが起動（セッション開始、または再起動）された際、以下のスケジュール設定が存在するか確認し、存在しない場合は再登録してください。

*   **実行スケジュール**: 毎週日曜日 0:00 (JST) - `0 0 * * 0`
*   **タスク指示内容 (Prompt)**:
    `Execute event crawler research and update exhibition plans based on user criteria (Kanto, Kansai, Hokuriku, Taiwan). Run 'scratch/update_exhibition_plans.py' and update 'event_research.md'.`
*   **巡回対象**: 関東中心、台湾、北陸、関西エリアのハンドメイド出店募集イベント情報。
