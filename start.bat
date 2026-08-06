@echo off
setlocal
cd /d "%~dp0"

echo ============================================
echo   METAWORK portfolio (local preview)
echo ============================================
echo.
echo Serving this folder at http://localhost:8765
echo (Ctrl+C or close this window to stop)
echo.

start "" "http://localhost:8765"

REM Python 3 http server (works with the metaverse's ES modules / assets)
python -m http.server 8765
