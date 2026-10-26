@echo off
title APAARSetu Launcher
echo ========================================================
echo        Starting APAARSetu Full Stack Application
echo ========================================================
echo.
echo Launching Backend on http://127.0.0.1:8001 ...
start "APAARSetu Backend (:8001)" cmd /k "cd /d ""%~dp0backend"" && .\venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload"

echo Launching Frontend on http://localhost:5173 ...
start "APAARSetu Frontend (Vite)" cmd /k "cd /d ""%~dp0frontend"" && npm run dev"

echo.
echo Both servers are launching in separate windows!
echo - Frontend URL: http://localhost:5173
echo - Backend Swagger Docs: http://127.0.0.1:8001/docs
echo.
timeout /t 5
