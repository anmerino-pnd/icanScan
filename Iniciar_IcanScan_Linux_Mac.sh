#!/usr/bin/env bash
# Script de inicio rápido para iCanScan Studio en Linux / macOS

echo "========================================================="
echo "   iCanScan Studio - Launcher para Linux / macOS"
echo "========================================================="

# Verificar que uv y npm estén instalados
if ! command -v uv &> /dev/null; then
    echo "[ERROR] 'uv' no se encuentra instalado en tu sistema."
    echo "Instálalo con: curl -LsSf https://astral.sh/uv/install.sh | sh"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "[ERROR] 'npm' (Node.js) no se encuentra instalado en tu sistema."
    echo "Por favor instala Node.js v20+ antes de continuar."
    exit 1
fi

echo "Sincronizando dependencias de Python y Node.js..."
uv sync --quiet

cd frontend
if [ ! -d "node_modules" ]; then
    echo "Instalando paquetes de Node.js por primera vez..."
    npm install
fi

echo "Iniciando iCanScan Studio (Electron + Python Multi-Proceso)..."
npm run app
