# 🏠 HomeLab Studio

> A visual, browser-based infrastructure editor for designing and documenting your homelab topology diagrams — no backend required.

<img width="1898" height="1027" alt="HomeLab Studio interface" src="https://github.com/user-attachments/assets/b2d9d2ec-732f-45ec-a5b0-4a8382647d36" />


## ✨ Features

### 🖥️ Visual Canvas Editor

- **Infinite, pannable/zoomable canvas** with a dot-grid background
- **Drag-and-drop** nodes from the component palette onto the canvas
- **Multi-select** nodes, connections, and text items with marquee selection or `Shift+Click`
- **Copy, Paste, Duplicate** elements with full clipboard support
- **Text annotations** — add free-floating labels anywhere on the canvas
- **Node grouping** — group nodes visually into named network segments
- **Arrow-key nudging** for precise element positioning (5px / 20px with Shift)

### 🔌 Node Types

| Category              | Nodes                                                                                                                                                                                                                                                      |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Hardware**          | Server, NAS, Raspberry Pi, Custom Hardware                                                                                                                                                                                                                 |
| **Network**           | Router, Switch, Custom Network Device                                                                                                                                                                                                                      |
| **User Devices**      | TV, Smartphone, Tablet, Laptop, Desktop PC, Printer, IP Camera, Smart Speaker, Game Console, IoT Device                                                                                                                                                    |
| **Operating Systems** | Ubuntu, Debian, Windows Server, macOS, CentOS, CasaOS, UmbrelOS, YunoHost, Unraid, TrueNAS, OpenMediaVault, StartOS, and more                                                                                                                              |
| **Hypervisors**       | Proxmox VE, XCP-ng, VMware ESXi, Harvester, oVirt, OpenNebula, Citrix Hypervisor, Oracle VM, SmartOS                                                                                                                                                       |
| **Applications**      | Pi-hole, Docker, Plex, Home Assistant, Nginx, Portainer, Grafana, Traefik, WireGuard, Tailscale, Jellyfin, Immich, PhotoPrism, MinIO, Syncthing, InfluxDB, Redis, PostgreSQL, MariaDB, MongoDB, Prometheus, Uptime Kuma, Node-RED, Paperless-ngx, and more |
| **Local LLM**         | Ollama, Open WebUI, Llama.cpp, LM Studio, LocalAI, Text Gen WebUI, GPT4All, vLLM, Hugging Face, PrivateGPT, Jan, AnythingLLM                                                                                                                               |

### 🔗 Connection Types

- **Ethernet** (solid line, cable)
- **Wireless / Wi-Fi** (dashed line)
- **Fiber** (dotted line)
- **USB** (dotted line)

Each connection supports custom labels and bandwidth metadata (e.g. "1000 Mbit").

### 🗂️ File Management

- **Save / Load** diagrams as portable `.json` files
- **Drag-and-drop** a `.json` file directly onto the canvas to load it
- **Autosave** every 30 seconds to `localStorage` — auto-restored on reload
- **Export** the canvas as a PNG image (via `html2canvas`)

### ↩️ History

- **Undo / Redo** with up to 50 steps (batched for multi-element operations)

### 🎨 Theming

- **Dark mode** and **Light mode**, persisted via `localStorage`

---

## ⌨️ Keyboard Shortcuts

| Shortcut                     | Action                              |
| ---------------------------- | ----------------------------------- |
| `Cmd/Ctrl + Z`               | Undo                                |
| `Cmd/Ctrl + Shift + Z` / `Y` | Redo                                |
| `Cmd/Ctrl + S`               | Save diagram                        |
| `Cmd/Ctrl + O`               | Load diagram                        |
| `Cmd/Ctrl + N`               | New diagram                         |
| `Cmd/Ctrl + A`               | Select all                          |
| `Cmd/Ctrl + D`               | Duplicate selected                  |
| `Cmd/Ctrl + C`               | Copy selected nodes                 |
| `Cmd/Ctrl + V`               | Paste nodes                         |
| `Cmd/Ctrl + G`               | Group selected nodes (≥2)           |
| `Cmd/Ctrl + Shift + G`       | Remove selected nodes from group    |
| `Cmd/Ctrl + F`               | Fit diagram to viewport             |
| `Cmd/Ctrl + +/-`             | Zoom in / out                       |
| `Cmd/Ctrl + 0`               | Reset zoom to 100%                  |
| `Delete` / `Backspace`       | Delete selected elements            |
| `Escape`                     | Clear selection / cancel connecting |
| `Space`                      | Center view on nodes                |
| `V`                          | Switch to Drag (move) tool          |
| `C`                          | Switch to Connect tool              |
| `T`                          | Switch to Text tool                 |
| `1`                          | Drag tool                           |
| `2`                          | Marquee select tool                 |
| `3`                          | Text tool                           |
| `4`                          | Ethernet connection                 |
| `5`                          | Wireless connection                 |
| `6`                          | Fiber connection                    |
| `7`                          | USB connection                      |
| `Arrow keys`                 | Nudge selected node (5px)           |
| `Shift + Arrow keys`         | Nudge selected node (20px)          |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- npm

### Installation

```bash
git clone https://github.com/HalimACeylan/homelabStudio.git
cd homelabStudio
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
```

The output will be in the `dist/` directory. Since this is a fully static app, you can host it on any static server (GitHub Pages, Vercel, Netlify, Cloudflare Pages, or your own nginx).

### Preview Production Build

```bash
npm run preview
```

---

## 🛠️ Tech Stack

| Technology                                      | Purpose                      |
| ----------------------------------------------- | ---------------------------- |
| [Vite](https://vitejs.dev/)                     | Build tool and dev server    |
| Vanilla JavaScript (ES Modules)                 | Core application logic       |
| HTML5 Canvas / SVG                              | Rendering connections        |
| CSS Custom Properties                           | Theming (dark/light mode)    |
| [html2canvas](https://html2canvas.hertzen.com/) | PNG export                   |
| `localStorage`                                  | Autosave & theme persistence |

No frameworks, no heavy dependencies — just plain, fast web tech.

---

## 🏗️ Architecture

The application is structured around a central `HomelabStudio` app class that coordinates independent, single-responsibility modules:

```
src/
├── main.js                   # App entry point & orchestrator
├── modules/
│   ├── CanvasController.js   # Pan, zoom, drag, selection, rendering
│   ├── ConnectionManager.js  # SVG connection rendering & routing
│   ├── DiagramManager.js     # Data model (nodes, connections, groups)
│   ├── FileManager.js        # Save, load, autosave, drag-drop import
│   ├── HistoryManager.js     # Undo/redo stack with batching
│   ├── InternalDragDrop.js   # Palette → canvas drag-and-drop
│   ├── KeyboardController.js # All keyboard shortcuts
│   ├── NodeRenderer.js       # Node HTML element creation & updates
│   ├── PaletteController.js  # Component sidebar & search
│   ├── PropertiesPanel.js    # Right-click / selected item properties
│   ├── UIController.js       # Toolbar, modals, toasts, context menus
│   ├── nodeTypes.js          # Node & application type definitions
│   └── utils.js              # Shared utility functions
└── styles/                   # CSS modules (style, nodes, icons, etc.)
```

### Diagram Data Format

Diagrams are saved as plain JSON with the following structure:

```json
{
  "metadata": { "name": "My Homelab", "version": "1.0", "modified": "..." },
  "nodes": [ { "id": "...", "type": "server", "x": 100, "y": 200, "properties": { ... } } ],
  "connections": [ { "id": "...", "sourceId": "...", "targetId": "...", "type": "ethernet" } ],
  "groups": [ { "id": "...", "name": "LAN", "nodeIds": ["..."] } ],
  "textItems": [ { "id": "...", "x": 50, "y": 50, "text": "My Label" } ]
}
```

---

## 🤝 Contributing

Contributions are very welcome! Here are some ways you can help:

- 🐛 **Report bugs** — open an issue with steps to reproduce
- 💡 **Request features** — open an issue describing the feature and use case
- 🎨 **Add new node/app icons** — place SVG icons in `public/icons/<category>/` and register the type in `src/modules/nodeTypes.js`
- 🔧 **Submit PRs** — for bug fixes, improvements, or new features

### Adding a New Application Type

1. Add an SVG icon to `public/icons/applications/your-app.svg`
2. Register the type in `src/modules/nodeTypes.js` under `APPLICATION_TYPES`:
   ```js
   "your-app": {
     name: "Your App",
     icon: "your-app",
     color: "#hexcolor",
     description: "Short description",
   },
   ```
3. That's it — the palette and properties panel will pick it up automatically.

---

## 📄 License

**PolyForm Noncommercial License 1.0.0** — see [LICENSE](LICENSE) for full terms.

- ✅ Free for personal, individual, and hobbyist use (homelab, self-hosting, learning)
- ✅ Free for educational and research use
- ❌ **Not** for use within any company, organization, or commercial product
- ❌ **Not** for closed-source distribution — source must remain available under the same license

For commercial licensing, please contact via [GitHub](https://github.com/HalimACeylan).

---

## 🙏 Acknowledgements

- Icons sourced from official project branding assets
- Inspired by tools like [draw.io](https://draw.io) and [NetBox](https://netbox.dev), built specifically for the homelab community
