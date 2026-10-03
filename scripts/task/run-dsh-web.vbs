Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "D:\Workspace\NodeJS\deepseek-harness"
WshShell.Run "cmd.exe /c """ & WshShell.CurrentDirectory & "\scripts\task\run-dsh-web.cmd""", 0, True
