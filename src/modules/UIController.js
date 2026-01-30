/**
 * UIController - Handles UI interactions, modals, toasts, and context menus
 */

import { downloadFile } from "./utils.js";

export class UIController {
  constructor(app) {
    this.app = app;

    this.modal = document.getElementById("modal");
    this.modalOverlay = document.getElementById("modal-overlay");
    this.contextMenu = document.getElementById("context-menu");
    this.toastContainer = document.getElementById("toast-container");

    this.setupEventListeners();
  }

  setupEventListeners() {
    // Toolbar buttons
    document
      .getElementById("btn-new")
      .addEventListener("click", () => this.confirmNewDiagram());
    document
      .getElementById("btn-save")
      .addEventListener("click", () => this.app.file.save());
    document
      .getElementById("btn-load")
      .addEventListener("click", () => this.app.file.load());
    document
      .getElementById("btn-export")
      .addEventListener("click", () => this.exportPNG());

    document
      .getElementById("btn-undo")
      .addEventListener("click", () => this.app.undo());
    document
      .getElementById("btn-redo")
      .addEventListener("click", () => this.app.redo());

    document
      .getElementById("btn-zoom-in")
      .addEventListener("click", () => this.app.canvas.zoomIn());
    document
      .getElementById("btn-zoom-out")
      .addEventListener("click", () => this.app.canvas.zoomOut());
    document
      .getElementById("btn-fit")
      .addEventListener("click", () => this.app.canvas.fitToContent());

    // Theme toggle
    document
      .getElementById("btn-theme")
      .addEventListener("click", () => this.toggleTheme());

    // Tool Selector (Flat pen-style row)
    const toolButtons = document.querySelectorAll("#tool-selector .tool-btn");
    toolButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        toolButtons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        const mode = btn.dataset.mode;
        const type = btn.dataset.type;

        this.app.editMode = mode;
        if (type) {
          this.app.activeConnectionType = type;
        }

        // Update canvas cursor and wrapper classes
        const wrapper = document.getElementById("canvas-wrapper");
        if (mode === "connect") {
          wrapper.classList.remove("mode-select");
          wrapper.classList.add("mode-connect");
          this.showToast(`Selected ${btn.getAttribute("title")} Tool`, "info");
        } else {
          wrapper.classList.remove("mode-connect");
          wrapper.classList.add("mode-select");
          this.showToast("Select Mode: Drag or edit nodes", "info");
        }
      });
    });

    // Modal close buttons
    document
      .getElementById("modal-close")
      .addEventListener("click", () => this.closeModal());
    document
      .getElementById("modal-cancel")
      .addEventListener("click", () => this.closeModal());
    this.modalOverlay.addEventListener("click", (e) => {
      if (e.target === this.modalOverlay) {
        this.closeModal();
      }
    });

    // Context menu items
    this.contextMenu.querySelectorAll(".context-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        const action = item.dataset.action;
        this.handleContextAction(action);
        this.closeContextMenu();
      });
    });
  }

  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("homelab-theme", newTheme);
  }

  // Context Menu
  showContextMenu(x, y, nodeId = null, connectionId = null) {
    this.contextNodeId = nodeId;
    this.contextConnectionId = connectionId;

    // Position menu
    this.contextMenu.style.left = `${x}px`;
    this.contextMenu.style.top = `${y}px`;
    this.contextMenu.classList.add("visible");

    // Adjust if off screen
    const rect = this.contextMenu.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      this.contextMenu.style.left = `${x - rect.width}px`;
    }
    if (rect.bottom > window.innerHeight) {
      this.contextMenu.style.top = `${y - rect.height}px`;
    }
  }

  closeContextMenu() {
    this.contextMenu.classList.remove("visible");
    this.contextNodeId = null;
    this.contextConnectionId = null;
  }

  handleContextAction(action) {
    switch (action) {
      case "duplicate":
        if (this.contextNodeId) {
          this.app.duplicateNode(this.contextNodeId);
        }
        break;
      case "delete":
        if (this.contextNodeId) {
          this.app.removeNode(this.contextNodeId);
          this.showToast("Node deleted", "success");
        } else if (this.contextConnectionId) {
          this.app.removeConnection(this.contextConnectionId);
          this.showToast("Connection deleted", "success");
        }
        break;
      case "bring-front":
        if (this.contextNodeId) {
          this.bringToFront(this.contextNodeId);
        }
        break;
      case "send-back":
        if (this.contextNodeId) {
          this.sendToBack(this.contextNodeId);
        }
        break;
      case "connect":
        if (this.contextNodeId) {
          this.startConnecting(this.contextNodeId);
        }
        break;
    }
  }

  bringToFront(nodeId) {
    const node = this.app.diagram.nodes.get(nodeId);
    if (!node) return;

    // Find max z-index
    let maxZ = 0;
    this.app.diagram.nodes.forEach((n) => {
      if (n.zIndex > maxZ) maxZ = n.zIndex;
    });

    node.zIndex = maxZ + 1;

    const element = document.querySelector(`[data-node-id="${nodeId}"]`);
    if (element) {
      element.style.zIndex = node.zIndex;
    }
  }

  sendToBack(nodeId) {
    const node = this.app.diagram.nodes.get(nodeId);
    if (!node) return;

    // Find min z-index
    let minZ = Infinity;
    this.app.diagram.nodes.forEach((n) => {
      if (n.zIndex < minZ) minZ = n.zIndex;
    });

    node.zIndex = minZ - 1;

    const element = document.querySelector(`[data-node-id="${nodeId}"]`);
    if (element) {
      element.style.zIndex = Math.max(1, node.zIndex);
    }
  }

  startConnecting(nodeId) {
    this.showToast("Click on another node to create a connection", "info");
    this.app.canvas.startConnecting(nodeId);
  }

  // Modal
  showModal(title, content, onConfirm) {
    document.getElementById("modal-title").textContent = title;
    document.getElementById("modal-content").innerHTML = content;

    const confirmBtn = document.getElementById("modal-confirm");
    confirmBtn.onclick = () => {
      if (onConfirm) onConfirm();
      this.closeModal();
    };

    this.modalOverlay.classList.add("visible");
  }

  closeModal() {
    this.modalOverlay.classList.remove("visible");
  }

  confirmNewDiagram() {
    if (this.app.diagram.nodes.size === 0) {
      this.app.clearDiagram();
      this.showToast("New diagram created", "success");
      return;
    }

    this.showModal(
      "New Diagram",
      "<p>Are you sure you want to create a new diagram? All unsaved changes will be lost.</p>",
      () => {
        this.app.clearDiagram();
        this.showToast("New diagram created", "success");
      }
    );
  }

  showNodeEditor(node) {
    const content = `
      <div class="property-row">
        <label class="property-label" for="edit-name">Name</label>
        <input type="text" class="property-input" id="edit-name" value="${
          node.properties.name || ""
        }">
      </div>
      <div class="property-row">
        <label class="property-label" for="edit-description">Description</label>
        <textarea class="property-input" id="edit-description" rows="3">${
          node.properties.description || ""
        }</textarea>
      </div>
    `;

    this.showModal("Edit Node", content, () => {
      const name = document.getElementById("edit-name").value;
      const description = document.getElementById("edit-description").value;

      this.app.diagram.updateNode(node.id, {
        properties: { ...node.properties, name, description },
      });

      this.app.nodeRenderer.updateNodeElement(
        node.id,
        this.app.diagram.nodes.get(node.id)
      );
      this.showToast("Node updated", "success");
    });
  }

  // Toast notifications
  showToast(message, type = "info") {
    const icons = {
      success: `<svg class="toast-icon success" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>`,
      error: `<svg class="toast-icon error" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="15" y1="9" x2="9" y2="15"></line>
        <line x1="9" y1="9" x2="15" y2="15"></line>
      </svg>`,
      warning: `<svg class="toast-icon warning" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
        <line x1="12" y1="9" x2="12" y2="13"></line>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
      </svg>`,
      info: `<svg class="toast-icon info" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
      </svg>`,
    };

    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = `
      ${icons[type]}
      <span class="toast-message">${message}</span>
      <button class="toast-close">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    `;

    toast.querySelector(".toast-close").addEventListener("click", () => {
      this.removeToast(toast);
    });

    this.toastContainer.appendChild(toast);

    // Auto-remove after 4 seconds
    setTimeout(() => {
      this.removeToast(toast);
    }, 4000);
  }

  removeToast(toast) {
    toast.classList.add("hiding");
    setTimeout(() => {
      toast.remove();
    }, 300);
  }

  // Export to PNG
  async exportPNG() {
    this.showToast("Preparing export...", "info");

    try {
      // Create a canvas element
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      // Get bounds of all nodes
      let minX = Infinity,
        minY = Infinity;
      let maxX = -Infinity,
        maxY = -Infinity;

      this.app.diagram.nodes.forEach((node) => {
        minX = Math.min(minX, node.x);
        minY = Math.min(minY, node.y);
        maxX = Math.max(maxX, node.x + node.width);
        maxY = Math.max(maxY, node.y + node.height);
      });

      if (minX === Infinity) {
        this.showToast("Nothing to export", "warning");
        return;
      }

      const padding = 50;
      const width = maxX - minX + padding * 2;
      const height = maxY - minY + padding * 2;

      canvas.width = width;
      canvas.height = height;

      // Fill background
      ctx.fillStyle = getComputedStyle(document.documentElement)
        .getPropertyValue("--bg-primary")
        .trim();
      ctx.fillRect(0, 0, width, height);

      // Draw connections
      ctx.strokeStyle = "#30363d";
      ctx.lineWidth = 2;

      this.app.diagram.connections.forEach((connection) => {
        const endpoints = this.app.diagram.getConnectionEndpoints(
          connection.id
        );
        if (endpoints) {
          ctx.beginPath();
          ctx.moveTo(
            endpoints.source.x - minX + padding,
            endpoints.source.y - minY + padding
          );
          ctx.lineTo(
            endpoints.target.x - minX + padding,
            endpoints.target.y - minY + padding
          );
          ctx.stroke();
        }
      });

      // Draw nodes as simple rectangles
      this.app.diagram.nodes.forEach((node) => {
        const x = node.x - minX + padding;
        const y = node.y - minY + padding;

        // Node background
        ctx.fillStyle = "#161b22";
        ctx.strokeStyle = "#30363d";
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.roundRect(x, y, node.width, node.height, 12);
        ctx.fill();
        ctx.stroke();

        // Node name
        ctx.fillStyle = "#f0f6fc";
        ctx.font = "14px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(
          node.properties.name || node.type,
          x + node.width / 2,
          y + 35
        );
      });

      // Export
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `homelab-diagram-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();

      this.showToast("Diagram exported as PNG", "success");
    } catch (error) {
      console.error("Export failed:", error);
      this.showToast("Export failed", "error");
    }
  }
}
