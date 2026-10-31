' ====================================================================
' OMOAI ⇄ POS PC起動時バックグラウンド自動同期スクリプト (VBScript)
' 黒いコマンドプロンプト画面を出さずに完全非表示（サイレント）で実行します
' ====================================================================
Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "c:\dev\moaigame3D - コピー"
WshShell.Run "node scripts/sync_master.js", 0, False
