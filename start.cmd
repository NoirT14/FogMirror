@echo off
cd /d "%~dp0"
if not exist node_modules (
  echo Chua cai thu vien. Hay chay npm.cmd install trong thu muc nay.
  pause
  exit /b 1
)
call npm.cmd run dev -- --open
pause
