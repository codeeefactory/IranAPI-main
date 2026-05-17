@echo off
setlocal
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\docker-stack.ps1" -Mode prod -Action up
if errorlevel 1 (
  echo.
  echo IranAPI could not be started.
  pause
)
