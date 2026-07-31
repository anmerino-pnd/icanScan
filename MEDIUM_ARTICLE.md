# iCanScan: Born from Subscription Fatigue

*How an unexpected paywall on a 21-page document scan inspired a 100% free, open-source desktop app.*

---

> **[FIGURE 01: COVER IMAGE]**
> - **Asset Description:** High-resolution screenshot of iCanScan Studio running on desktop, showcasing the sketchbook UI aesthetic on a dark background.
> - **Suggested Aspect Ratio:** 16:9.
> - **Caption:** *iCanScan Studio running on Windows 11 with its sketchbook UI and local processing engine.*

---

## Table of Contents

1. The 21-Page Friction: The Origin Story
2. Why Utility Software Should Be Fair
3. How to Get iCanScan (Windows Store & Source Code)
4. Under the Hood: Built for Speed & Design
5. Visual Asset Guide
6. Conclusion: Reclaiming Software Utility

---

## 1. The 21-Page Friction: The Origin Story

The story behind iCanScan is simple: I needed to scan an urgent stack of documents, and the default operating system scanner was not cutting it. 

I downloaded a third-party app from the store labeled "Free." The reviews were positive, and a quick test scan worked cleanly. Confident in the tool, I scanned 21 pages of official paperwork—aligning pages, checking visual clarity, and investing real effort.

Then came the moment of export. 

Instead of generating my PDF, a modal window popped up: saving multi-page PDFs required an immediate monthly or annual subscription. There was no warning upfront. My 21-page scan was effectively held hostage at the exact moment I needed it most.

Instead of paying a recurring fee for a basic local file conversion, I discarded the app, opened my code editor, and built **iCanScan**.

---

## 2. Why Utility Software Should Be Fair

Basic desktop operations—scanning a document, cropping an image, merging PDFs, or compressing a file—run locally on your machine. They consume minimal local resources and do not rely on expensive cloud servers. Yet, subscription fatigue has turned basic utilities into recurring monthly bills.

When "free" apps hide core features behind surprise paywalls, user trust breaks down. iCanScan was built on a different model:

- **100% Free Core Functionality:** Optical scanning, PDF export, multi-range splitting, page merging, image extraction, and target compression are permanently unlocked with zero artificial page limits or watermarks.
- **Privacy First:** 100% local processing. Your sensitive documents never leave your machine or touch external servers.
- **Transparent Model:** Completely free for everyone, supported by a single, 100% voluntary donation button for users who wish to support project maintenance.

---

## 3. How to Get iCanScan

Whether you want a simple one-click download or prefer compiling from source, iCanScan provides options for every workflow:

### Windows Installation Options

- **Direct Download via Microsoft Store (Recommended for Non-Technical Users):**
  Search for **iCanScan Studio** on the Microsoft Store to install with a single click. The store package automatically manages all backend Python dependencies and updates without touching a command line.

- **Building from Source (For Developers and Power Users):**
  Clone the repository and launch locally:
  ```bash
  git clone https://github.com/anmerino-pnd/icanScan.git
  cd icanScan
  uv sync
  cd frontend && npm install
  Iniciar_IcanScan_Como_App.bat
  ```

> **[FIGURE 02: MICROSOFT STORE UI PLACEHOLDER]**
> - **Asset Description:** Screenshot of the official iCanScan Studio page on the Microsoft Store with the "Get / Install" button.
> - **Caption:** *iCanScan Studio listing on the Microsoft Store for one-click installation on Windows 10 and 11.*

### macOS and Linux Options

- **Execution from Source:** Execute locally via terminal:
  ```bash
  chmod +x Iniciar_IcanScan_Linux_Mac.sh
  ./Iniciar_IcanScan_Linux_Mac.sh
  ```
- **Mac App Store Roadmap:** Active development is underway to bring iCanScan directly to the Mac App Store for a native, one-click Apple installation experience.

---

## 4. Under the Hood: Built for Speed & Design

iCanScan was engineered to ensure local high-DPI scanning and document manipulation never freeze the user interface:

- **v1.2.0 Desktop Application Viewport Architecture (`100vh`):** A desktop-first workspace layout that eliminates window scrollbars. The scanner controls, parameter adjustments, notebook report metrics, quality settings, session clearing, and **Export All to PDF** CTA are consolidated into a fixed 380px left sidebar, freeing up 100% of the right canvas exclusively for document page thumbnails.
- **Artisanal Sketchbook Design & Responsive Navigation:** Warm paper textures (`#fdfbf7`), organic borders, authentic handwritten typography (`Kalam` and `Patrick Hand`), and overlapping connected folder tabs that dynamically collapse text to centered icon-only mode on compact screens.
- **Dual-Process Architecture & Smooth Studio Transitions:** Electron + React 19 deliver a smooth 60 FPS presentation layer, while an isolated Python FastAPI backend handles WIA hardware drivers, Pillow image filters, and PyMuPDF compilation. The Lightbox Studio features zero-latency CSS hardware acceleration with completely flicker-free page transitions, LQIP caching, and native auto-Fit zooming.
- **Interactive Visual Page Preview Engine in PDF Tools:** Real-time mini-photographs/thumbnails for every PDF manipulation step:
  - **Extract PDF Pages to Images:** Live thumbnail gallery rendering exact pages for range specs (e.g. `1, 3, 5-9, 10`) before extraction.
  - **Multi-Range PDF Split:** Visual group cards displaying page thumbnail strips for each output PDF (e.g., pages 1-3, page 4, pages 5-10).
  - **PDF Merge & Union:** Page thumbnail preview stacks for every uploaded PDF document in the sequence.
- **100% Dynamic i18n & Centered UI Alignment:** Dynamic language switching (`Español` ↔ `English`) across the entire suite (including Drive Compression), automatic input default alignment (`"todas"` ↔ `"all"`), and hand-drawn drilldown action buttons with decoupled CSS states to prevent layout teleportation.
- **Zero-Lag PyMuPDF Thumbnail Caching:** Fast in-memory hash caching for rendered 100 DPI page thumbnails (`_thumb.jpg`), delivering sub-10ms preview response times without UI stutter or memory bloat.

> **[FIGURE 03: MAIN WORKSPACE UI PLACEHOLDER]**
> - **Asset Description:** Screenshot of the iCanScan main workspace, highlighting page grid sorting, scanner parameters, and sketchbook theme.
> - **Caption:** *The primary iCanScan workspace featuring sketchbook aesthetics and page management controls.*

> **[FIGURE 04: LIGHTBOX STUDIO & PDF TOOLS PLACEHOLDER]**
> - **Asset Description:** Screenshot of the Lightbox Studio modal and the PDF Tools view demonstrating real-time adjustments and conversion utilities.
> - **Caption:** *Interactive Lightbox Studio modal and integrated PDF manipulation suite.*

---

## 5. Visual Asset Guide

*Note for Medium Draft Preparation: Replace these placeholders with actual screenshots before publishing.*

| Figure | Target Component | Asset Type | Key Focus |
| :--- | :--- | :--- | :--- |
| **Figure 01** | Cover Graphic | Image (16:9) | iCanScan running on desktop with dark sketchbook theme. |
| **Figure 02** | Microsoft Store Page | Image | Windows 11 Microsoft Store product listing page. |
| **Figure 03** | Workspace Grid | Image / GIF | Scanned page cards, drag-and-drop handles, selection checkboxes. |
| **Figure 04** | Lightbox Studio & PDF Tools | Image | Studio modal with contrast/B&W sliders and PDF extraction tools. |

---

## 6. Conclusion: Reclaiming Software Utility

iCanScan started out of frustration, but it evolved into a tool built for the community. Utility software should empower users at critical moments, not lock their hard work behind unexpected paywalls.

- **GitHub Repository:** [github.com/anmerino-pnd/icanScan](https://github.com/anmerino-pnd/icanScan)
- **Microsoft Store:** Search **iCanScan Studio** on the Microsoft Store.
- **License:** Apache License 2.0 (Open Source).
