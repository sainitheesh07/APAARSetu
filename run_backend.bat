@echo off
title APAARSetu Backend (FastAPI :8001)
echo ========================================================
echo   Starting APAARSetu Backend on http://127.0.0.1:8001
echo ========================================================
cd /d "%~dp0backend"
.\venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload
pause
