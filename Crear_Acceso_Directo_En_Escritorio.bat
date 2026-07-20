@echo off
title Crear Acceso Directo de iCanScan en el Escritorio
echo =========================================================
echo Creando Acceso Directo "iCanScan Studio" en tu Escritorio...
echo =========================================================

cd /d "%~dp0"
uv run python -c "import os, win32com.client; shell = win32com.client.Dispatch('WScript.Shell'); desktop = shell.SpecialFolders('Desktop'); shortcut = shell.CreateShortCut(os.path.join(desktop, 'iCanScan Studio.lnk')); shortcut.Targetpath = os.path.abspath('Iniciar_IcanScan_Como_App.bat'); shortcut.WorkingDirectory = os.path.abspath('.'); shortcut.IconLocation = os.path.abspath('icons/icon.ico'); shortcut.Description = 'iCanScan Studio - PDF Scanner & Optical Studio'; shortcut.save(); print('Acceso directo creado exitosamente en tu Escritorio:', os.path.join(desktop, 'iCanScan Studio.lnk'))"

echo.
echo ¡Listo! Ahora tienes un ícono "iS" en tu Escritorio para iniciar la app con un doble clic.
pause
