@echo off
setlocal
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\docker-stack.ps1" -Mode all -Action down -SkipBrowser
if errorlevel 1 (
  echo.
  echo IranAPI could not be stopped cleanly.
  pause
)
