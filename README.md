# Doc Scan PDF Scanner (icanScan)

[![Electron](https://img.shields.io/badge/Electron-43.1.1-2B2E3A?style=for-the-badge&logo=electron&logoColor=9FEAF9)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-19.2.7-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.139.2-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Vite](https://img.shields.io/badge/Vite-8.1.1-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev/)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg?style=for-the-badge)](https://opensource.org/licenses/Apache-2.0)

A high-performance, multi-process desktop and web application designed for professional document scanning, live image adjustments, drag-and-drop page organization, and advanced PDF compression. Built specifically for Windows desktop environments using an isolated Python/FastAPI backend and a modern React 19/Electron interface.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage Instructions](#usage-instructions)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

**Doc Scan PDF Scanner (icanScan)** solves common bottlenecks in heavy document workflows by separating the user interface from hardware-intensive operations. Traditional desktop scanners often freeze the UI during high-DPI scans or complex PDF compression tasks. 

By running the UI inside an **Electron/React 19** renderer process and executing heavy image manipulation, WIA hardware communication, and PDF generation inside an isolated **Python FastAPI (Uvicorn)** background process, `icanScan` ensures zero UI freezing, high responsiveness, and reliable memory management.

---

## Architecture

The application operates using a multi-process architecture communicating via local HTTP endpoints and Inter-Process Communication (IPC):

```
+---------------------------------------------------------------------------------+
|                               ELECTRON MAIN PROCESS                              |
|  - Spawns Uvicorn Subprocess via `python -m uvicorn`                            |
|  - Manages Native Windows Dialogs (Save As / Open File)                         |
|  - Monitors Port 8000 Readiness & Lifecycle Management                           |
+----------------------------------------+----------------------------------------+
                                         |
            +----------------------------+----------------------------+
            | IPC / Native Bridge                                     | Local HTTP (127.0.0.1:8000)
            v                                                         v
+----------------------------------------+       +----------------------------------------+
|          ELECTRON RENDERER             |       |        PYTHON FASTAPI BACKEND          |
|                                        |       |                                        |
|  - React 19 + Vite Single Page App     |       |  - Windows WIA Hardware Integration    |
|  - Drag-and-Drop (@dnd-kit)            |       |  - Pillow Image Adjustments            |
|  - Real-Time Preview & Workspace UI    |       |  - PyMuPDF / img2pdf Processing        |
+----------------------------------------+       +----------------------------------------+
                                                                      |
                                                                      v
                                                 +----------------------------------------+
                                                 |         LOCAL FILESYSTEM CACHE         |
                                                 |   (.scans_cache / Original & Processed)|
                                                 +----------------------------------------+
```

---

## Key Features

- **Hardware Scanner Integration (WIA):** Direct communication with Windows Image Acquisition (WIA) hardware scanners via `pywin32`. Supports dynamic DPI selection (150, 300, 600 DPI), custom color profiles (Color, Grayscale, Black & White), and standard paper sizes (Letter, Legal, A4).
- **Live Image Processing & Adjustments:** Real-time post-processing using Pillow. Users can apply non-destructive rotation, brightness tuning, contrast modifications, and threshold-based binarization filters directly to cached scanned pages.
- **Interactive Page Management:** Intuitive drag-and-drop workspace built on `@dnd-kit/sortable`, allowing rapid reordering, selection, previewing, and selective deletion of pages before compilation.
- **Lossless & Target-Size PDF Export:** High-fidelity PDF generation using `img2pdf` and `PyMuPDF`. Includes specialized compression profiles such as **Drive 25MB Mode** specifically tuned for email attachments and cloud storage limits.
- **Batch Processing & ZIP Archives:** Multi-file compression queue supporting simultaneous optimization of existing PDFs and batch export as standard ZIP archives.
- **Native Desktop Integration:** Seamless native Windows file dialogs triggered through Electron IPC and `pywebview`, providing intuitive "Open" and "Save As" workflows.

---

## Technology Stack

### Core & Backend
- **Python 3.10+**: Core backend runtime.
- **FastAPI & Uvicorn**: High-performance asynchronous REST API server (`127.0.0.1:8000`).
- **uv**: Fast Python package and virtual environment manager.
- **PyMuPDF (fitz) & img2pdf**: Document parsing, rasterization, and lossless PDF compilation.
- **Pillow**: Raster image processing and adjustment pipeline.
- **pywin32**: Windows COM bridge for WIA scanner driver control.
- **pywebview**: Standalone native window fallback mode.

### Frontend & Desktop
- **React 19 & Vite 8**: Modern, ultra-fast frontend rendering and build toolchain.
- **Electron 43**: Desktop wrapper for window lifecycle management and native OS capabilities.
- **@dnd-kit**: Accessible, performant drag-and-drop sorting library.
- **Lucide React**: Clean, consistent vector iconography.
- **Oxlint**: High-speed JavaScript/TypeScript linter.

---

## Project Structure

```
icanScan/
├── .scans_cache/                  # Runtime cache for original and processed scan images
├── frontend/                      # React 19 + Vite + Electron frontend project
│   ├── electron/                  # Electron main process and preload scripts
│   │   ├── main.cjs               # Main process: lifecycle, subprocess spawning, IPC handlers
│   │   └── preload.cjs            # Context bridge for secure native dialog invocation
│   ├── public/                    # Static assets
│   ├── src/                       # React components, state, and UI styling
│   ├── package.json               # Frontend dependencies and scripts
│   └── vite.config.js             # Vite bundler configuration
├── src/
│   └── icanscan/                  # Python backend package
│       ├── __init__.py            # Package initialization
│       ├── main.py                # FastAPI endpoints, CORS, static mounting, server entry point
│       ├── scanner_wia.py         # Hardware scanner interfacing via Windows Image Acquisition
│       ├── image_processor.py     # Image manipulation, adjustments, and PDF conversion
│       └── pdf_compressor.py      # Batch PDF compression engine and ZIP archiver
├── Iniciar_IcanScan_Como_App.bat  # Quick-launch Windows batch script with error trapping
├── pyproject.toml                 # Python package metadata and dependencies
├── uv.lock                        # Exact dependency lockfile for Python environment
├── LICENSE                        # Apache License 2.0
└── README.md                      # Project documentation
```

---

## Prerequisites

Before installing and running the application, ensure the following requirements are met:

1. **Operating System:** Microsoft Windows 10 or Windows 11 (required for WIA hardware scanner drivers and COM interfaces).
2. **Python:** Version **3.10** or higher installed and accessible in system PATH.
3. **Node.js:** Version **20.x** or higher installed along with `npm`.
4. **uv Package Manager:** Installed globally for Python environment management (`pip install uv` or via standalone installer).

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/angelmerino/icanScan.git
cd icanScan
```

### 2. Initialize Python Environment

Use `uv` to synchronize dependencies and build the isolated virtual environment:

```bash
uv sync
```

### 3. Install Frontend Dependencies

Navigate to the `frontend` directory and install the Node.js packages:

```bash
cd frontend
npm install
cd ..
```

---

## Usage Instructions

### Method 1: Desktop Application Mode (Recommended)

To launch the integrated Electron desktop application with the automated Python backend subprocess:

#### Option A: Using the Windows Batch Launcher
Double-click the provided batch file in the root directory:
```
Iniciar_IcanScan_Como_App.bat
```
*Note: The script automatically handles directory navigation, launches the desktop app, and keeps the terminal window open if any initialization errors occur.*

#### Option B: Using the Command Line
From the root directory, start the frontend and backend together via npm:
```bash
cd frontend
npm run app
```

### Method 2: Standalone API Server Mode

If you wish to run only the REST API server (useful for headless operations, web debugging, or custom clients):

```bash
uv run uvicorn icanscan.main:app --host 127.0.0.1 --port 8000
```
Once running, interactive Swagger API documentation is available at:
`http://127.0.0.1:8000/docs`

### Method 3: Development Mode with Live Reload

For active development on the React UI with hot module replacement (HMR):

1. Start the Python backend in a terminal:
   ```bash
   uv run -m uvicorn icanscan.main:app --host 127.0.0.1 --port 8000 --reload
   ```
2. Open a separate terminal, navigate to the frontend directory, and start the Vite dev server:
   ```bash
   cd frontend
   npm run dev
   ```

---

## API Reference

The FastAPI backend exposes the following REST endpoints:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/scanners` | Returns a list of connected physical WIA scanning devices. |
| `POST` | `/api/scan` | Triggers a scan job with specified parameters (DPI, color mode, paper size). |
| `POST` | `/api/pages/{page_id}/adjust` | Applies non-destructive adjustments (rotation, brightness, contrast, B&W filter). |
| `POST` | `/api/pages/delete` | Removes specified pages and their cached assets from the disk. |
| `POST` | `/api/export/pdf` | Compiles selected pages into a lossless or compressed PDF document. |
| `POST` | `/api/export/save-to-path` | Exports PDF directly to a target absolute filesystem path. |
| `POST` | `/api/compress/register` | Registers existing PDF files for the compression pipeline. |
| `POST` | `/api/compress/process` | Executes PDF compression based on target profiles (e.g., `drive_25mb`). |
| `GET` | `/api/compress/download/{id}` | Streams the processed compressed PDF file. |
| `POST` | `/api/compress/download-zip` | Bundles and downloads multiple compressed PDFs as a `.zip` archive. |
| `POST` | `/api/session/clear` | Clears all temporary image and PDF files from `.scans_cache`. |

---

## Troubleshooting

### 1. Uvicorn Startup Failure (`uv trampoline failed to canonicalize script path`)
If launching Uvicorn directly throws a canonicalization error on Windows, this is caused by absolute path mismatches in the virtual environment launcher scripts.
- **Solution:** Always invoke the server using Python module syntax: `uv run python -m uvicorn icanscan.main:app --host 127.0.0.1 --port 8000`. The Electron launcher is pre-configured to use this safe method automatically.

### 2. Port 8000 Conflict (`ERR_CONNECTION_REFUSED` or Server Busy)
If another service is utilizing TCP port 8000 on `127.0.0.1`, the backend cannot bind.
- **Solution:** The Electron process attempts to clean up stale Python instances on port 8000 before startup. If manual intervention is required, run in PowerShell:
  ```powershell
  Get-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess | Stop-Process -Force
  ```

### 3. WIA Hardware Scanner Not Detected
If `/api/scanners` returns an empty list:
- Ensure the scanner is powered on and properly connected via USB or network.
- Verify that the Windows Image Acquisition (WIA) service is actively running in `services.msc`.
- Check that official Windows WIA drivers from the hardware manufacturer are installed (TWAIN-only drivers require WIA compatibility layers).

---

## Contributing

Contributions, bug reports, and feature improvements are welcome. Please follow these guidelines:

1. Fork the repository and create your feature branch: `git checkout -b feature/enhanced-processing`.
2. Ensure JavaScript/TypeScript code passes linter checks: `cd frontend && npm run lint`.
3. Verify that Python syntax adheres to standard PEP 8 formatting.
4. Commit your changes with clear, descriptive commit messages.
5. Push to the branch (`git push origin feature/enhanced-processing`) and open a Pull Request.

---

## License

This project is licensed under the terms of the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). See the [LICENSE](file:///C:/Users/panda/Documents/Github/icanScan/LICENSE) file for complete details.

---

## Author

Developed by **Angel Merino** (`acedeno00@gmail.com`).
