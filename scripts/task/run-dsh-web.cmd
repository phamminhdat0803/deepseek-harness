@echo off
setlocal
cd /d "D:\Workspace\NodeJS\deepseek-harness"
"C:\nvm4w\nodejs\node.exe" --import tsx/esm scripts\task\run-service.mjs %*
