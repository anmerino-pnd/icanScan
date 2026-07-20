@echo off
title Doc Scan PDF Scanner - Aplicación de Escritorio
cd /d "%~dp0\frontend"

echo Iniciando Doc Scan PDF Scanner (Electron + Python Multi-Proceso)...
npm run app

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo =========================================================
    echo [ERROR] La aplicacion se cerro con un codigo de error (%ERRORLEVEL%).
    echo Revisa el mensaje anterior para ver la causa del problema.
    echo =========================================================
    pause
)
