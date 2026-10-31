' ====================================================================
' OMOAI ⇄ POS PC起動時バックグラウンド常駐監視スクリプト (VBScript)
' 黒い画面を出さずに完全非表示（サイレント）で30秒間隔のリアルタイム監視を行います
' ====================================================================
Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "c:\dev\moaigame3D - コピー"
WshShell.Run "node scripts/watch_master.js", 0, False
