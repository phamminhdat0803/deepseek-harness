Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "D:\Workspace\NodeJS\deepseek-harness"
Set oEnv = WshShell.Environment("PROCESS")
oEnv("DSH_WATCH_PARENT") = "1"
WshShell.Run """C:\nvm4w\nodejs\node.exe"" --import tsx/esm scripts\task\run-service.mjs", 0, True
