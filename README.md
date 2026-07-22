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

- **Artisanal Hand-Drawn / Sketchbook Interface:** Distinctive cut-paper and sketchbook aesthetic (`#fdfbf7` warm dotted paper background, organic wobbly borders, solid offset shadows, tape and tack decorations) powered by authentic handwritten typography (`Kalam` for headers/stamps and `Patrick Hand` for readable body text).
- **Instant GPU-Accelerated Optical Studio (0ms Latency):** Dual-engine preview studio applying real-time browser GPU hardware filters (`brightness`, `contrast`, `rotation`, and `B&W binarization threshold`) at 60 FPS without UI block or network delay, while asynchronously synchronizing high-resolution raster adjustments on disk.
- **Advanced PDF Toolbox & Extraction Suite (`Herramientas PDF`):**
  - **Extract PDF Pages to Images:** Extract full documents or specific page ranges (e.g., `1-3, 5, 8`) to high-resolution `PNG` (Lossless) or `JPG` at `150`, `300`, or `600 DPI` with one-click `.ZIP` archive bundling. Includes **Automatic Page Counter (`TOTAL: X PÁGS`)** metadata detection when selecting any document.
  - **Images to PDF Union:** Concatenate and organize multiple `PNG/JPG` image files into a single clean, unified PDF document. Equipped with **Universal Multi-Mode File Import (`Electron`, `pywebview` & Web Form Fallback)** for guaranteed image loading.
  - **Multi-Range PDF Split & Extraction:** Split a single document into multiple distinct PDFs in one step using comma-separated range rules (`1-3, 4, 5-10` automatically creates `Document_pages_1-3.pdf`, `Document_pages_4.pdf`, and `Document_pages_5-10.pdf`) with instant page count indicators.
  - **Merge / Combine Multiple PDFs (`Unir / Combinar PDFs`):** Combine multiple independent PDF files into a single unified document with custom reordering (`↑` / `↓`), instant page counting (`TOTAL: X PÁGS`), and standardized MB size reporting.
  - **Interactive Lightbox Inspection Studio (`<Eye />` Inspector):** High-resolution full-screen preview and inspection modal for both extracted images and generated PDF documents, allowing users to verify quality, zoom, and scroll before exporting or downloading.
- **Dual-Resolution Thumbnail Engine & Zero-Lag Page Sorting:** Fast web-optimized thumbnail generation (`_thumb.jpg`) for grid display ensuring zero UI stutter or memory bloat during drag-and-drop page sorting, while reserving full-resolution (300+ DPI) scans for inspection and lossless PDF generation.
- **Hardened Local API & Path Bounds Protection:** Strict filesystem path traversal prevention (`os.path.commonpath`) on local file download and save endpoints, securing user assets while providing seamless native desktop integration.
- **Hardware Scanner Integration (WIA):** Direct communication with Windows Image Acquisition (WIA) hardware scanners via `pywin32`. Supports dynamic DPI selection (150, 300, 600 DPI), custom color profiles (Color, Grayscale, Black & White), and standard paper sizes (Letter, Legal, A4).
- **Interactive Page Management:** Intuitive drag-and-drop workspace built on `@dnd-kit/sortable`, allowing rapid reordering, selection, custom `.wobbly-checkbox` toggling, and selective deletion of pages before compilation.
- **Lossless & Target-Size PDF Export:** High-fidelity PDF generation using `img2pdf` and `PyMuPDF`. Includes specialized compression profiles such as **Drive 25MB Mode** specifically tuned for email attachments and cloud storage limits.
- **Native Desktop Integration:** Seamless native Windows file dialogs triggered through Electron IPC and `pywebview`, providing intuitive "Open" and "Save As" workflows for PDFs and images.

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
│   │   └── components/            # UI components (`ScannerControls`, `PageGrid`, `PdfToolsView`, etc.)
│   ├── package.json               # Frontend dependencies and scripts
│   └── vite.config.js             # Vite bundler configuration
├── src/
│   └── icanscan/                  # Python backend package
│       ├── __init__.py            # Package initialization
│       ├── main.py                # FastAPI endpoints, CORS, static mounting, server entry point
│       ├── scanner_wia.py         # Hardware scanner interfacing via Windows Image Acquisition
│       ├── image_processor.py     # Image manipulation, adjustments, and PDF conversion
│       ├── pdf_compressor.py      # Batch PDF compression engine and ZIP archiver
│       └── pdf_tools.py           # Advanced PDF page extraction, union, and multi-range split suite
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

## Usage Instructions (Multi-Platform Guide)

`iCanScan Studio` is designed to run natively across major operating systems. Depending on your platform, choose the appropriate workflow below:

### Method 1: Desktop Application Mode (Recommended)

#### 🪟 For Windows Users
Windows users have two ways to run the application:
1. **Direct App Download (Microsoft Store / Packaged App):** If downloading from the **Microsoft Store** or via the pre-built `.appx` package, simply install and launch `iCanScan Studio` directly. No manual dependencies or command-line steps are required.
2. **From Source (Cloned Repository):** If you cloned the git repository (`git clone https://github.com/anmerino-pnd/icanScan.git`), double-click the provided Windows batch launcher in the root directory:
   ```
   Iniciar_IcanScan_Como_App.bat
   ```
   *Note: This script automatically syncs your `uv` Python environment, starts the backend, and launches the Electron desktop app.*

#### 🐧 / 🍏 For Linux & macOS Users
If you are running on **Linux (Ubuntu, Debian, Fedora, Arch, etc.)** or **macOS (Apple Silicon M1/M2/M3 or Intel)**, you can run the full suite directly from the cloned repository. 
*(Note: Physical WIA scanner driver support is Windows-exclusive. On Linux/macOS, the app automatically activates the **High-Fidelity Virtual Scanner Simulator** along with the complete **PDF & Image Extraction Suite**, **Drive 25MB Compressor**, **Page Splitter/Merger**, and **Inspection Studio**).*

1. Clone the repository and navigate into the project folder:
   ```bash
   git clone https://github.com/anmerino-pnd/icanScan.git
   cd icanScan
   ```
2. Make the launcher script executable and run it:
   ```bash
   chmod +x Iniciar_IcanScan_Linux_Mac.sh
   ./Iniciar_IcanScan_Linux_Mac.sh
   ```
   *Note: Or manually via command line: `cd frontend && npm run app`.*

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
| `POST` | `/api/tools/pdf-info` | Returns page count, filename, and size metadata of a target PDF document. |
| `POST` | `/api/tools/upload-temp` | Accepts multipart form uploads for PDF/Image processing when native paths are restricted. |
| `POST` | `/api/tools/extract-images` | Extracts specific PDF page ranges to high-res PNG or JPG images at target DPI (`150`, `300`, `600`). |
| `POST` | `/api/tools/images-to-pdf` | Concatenates multiple uploaded PNG/JPG images into a single unified PDF. |
| `POST` | `/api/tools/split-pdf` | Splits a document into multiple independent PDF files based on comma-separated range specifications (`1-3, 4, 5-10`). |
| `POST` | `/api/tools/merge-pdfs` | Merges multiple selected PDF files into a single continuous PDF document with custom ordering. |
| `GET` | `/api/tools/download/{task_id}/{filename}` | Streams individual tool outputs (`.pdf` / `.png` / `.jpg`) or generated `.zip` packages. |
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
