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
    this.setupHeaderListeners();
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

    // Palette toggle
    const paletteToggleBtn = document.getElementById("palette-toggle");
    if (paletteToggleBtn) {
      paletteToggleBtn.addEventListener("click", () => this.togglePalette());
    }

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
          wrapper.classList.remove("mode-select", "mode-marquee", "mode-text");
          wrapper.classList.add("mode-connect");
          this.showToast(`Selected ${btn.getAttribute("title")} Tool`, "info");
        } else if (mode === "marquee") {
          wrapper.classList.remove("mode-connect", "mode-select", "mode-text");
          wrapper.classList.add("mode-marquee");
          this.showToast(
            "Select Tool: Drag to box-select multiple nodes",
            "info"
          );
        } else if (mode === "text") {
          wrapper.classList.remove(
            "mode-connect",
            "mode-marquee",
            "mode-select"
          );
          wrapper.classList.add("mode-text");
          this.showToast("Text Tool: Click on canvas to add text", "info");
        } else {
          wrapper.classList.remove("mode-connect", "mode-marquee", "mode-text");
          wrapper.classList.add("mode-select");
          this.showToast(
            "Pan/Drag Tool: Interact with individual nodes",
            "info"
          );
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

    // Shortcuts Modal Listeners
    document
      .getElementById("btn-close-shortcuts")
      ?.addEventListener("click", () => this.closeShortcutsModal());
    document
      .getElementById("btn-close-shortcuts-footer")
      ?.addEventListener("click", () => this.closeShortcutsModal());
    document
      .getElementById("shortcuts-modal-overlay")
      ?.addEventListener("click", () => this.closeShortcutsModal());

    // Show on load
    this.showShortcutsModal();
  }

  setupHeaderListeners() {
    const titleInput = document.getElementById("diagram-title");
    if (titleInput) {
      titleInput.addEventListener("change", (e) => {
        this.updateDiagramName(e.target.value);
      });

      titleInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.target.blur();
        }
      });
    }

    // ===== Mobile UI Handlers =====
    this.setupMobileHandlers();

    // ===== Coordinates Display Update =====
    if (window.innerWidth < 768) {
      this.setupCoordinatesDisplay();
    }
  }

  setupMobileHandlers() {
    // FAB - Palette Toggle
    const fabBtn = document.getElementById("fab-palette-toggle");
    if (fabBtn) {
      fabBtn.addEventListener("click", () => {
        const palette = document.getElementById("palette");
        if (palette) {
          palette.classList.toggle("visible");
        }
      });
    }

    // Mobile File Menu
    const btnFile = document.getElementById("btn-mobile-file");
    const fileMenu = document.getElementById("mobile-file-menu");
    if (btnFile && fileMenu) {
      btnFile.addEventListener("click", (e) => {
        e.stopPropagation();
        const editMenu = document.getElementById("mobile-edit-menu");
        if (editMenu) editMenu.classList.remove("visible");
        fileMenu.classList.toggle("visible");
      });

      // File Menu Actions
      fileMenu.querySelectorAll(".mobile-dropdown-item").forEach((btn) => {
        btn.addEventListener("click", () => {
          const action = btn.dataset.action;
          fileMenu.classList.remove("visible");

          switch (action) {
            case "new":
              this.confirmNewDiagram();
              break;
            case "save":
              this.app.file.save();
              break;
            case "load":
              this.app.file.load();
              break;
            case "export":
              this.exportPNG();
              break;
          }
        });
      });
    }

    // Mobile Edit Menu
    const btnEdit = document.getElementById("btn-mobile-edit");
    const editMenu = document.getElementById("mobile-edit-menu");
    if (btnEdit && editMenu) {
      btnEdit.addEventListener("click", (e) => {
        e.stopPropagation();
        const fileMenu = document.getElementById("mobile-file-menu");
        if (fileMenu) fileMenu.classList.remove("visible");
        editMenu.classList.toggle("visible");
      });

      // Edit Menu Actions
      editMenu.querySelectorAll(".mobile-dropdown-item").forEach((btn) => {
        btn.addEventListener("click", () => {
          const action = btn.dataset.action;
          editMenu.classList.remove("visible");

          switch (action) {
            case "undo":
              this.app.undo();
              break;
            case "redo":
              this.app.redo();
              break;
          }
        });
      });
    }

    // Close menus on click outside
    document.addEventListener("click", (e) => {
      if (
        !e.target.closest(".mobile-menu-btn") &&
        !e.target.closest(".mobile-dropdown")
      ) {
        document.querySelectorAll(".mobile-dropdown").forEach((menu) => {
          menu.classList.remove("visible");
        });
      }
    });

    // Properties Popup Close
    const closePropsBtn = document.getElementById("close-properties-popup");
    if (closePropsBtn) {
      closePropsBtn.addEventListener("click", () => {
        this.hideMobilePropertiesPopup();
      });
    }
  }

  setupCoordinatesDisplay() {
    const coordsDisplay = document.getElementById("mobile-coordinates");
    if (!coordsDisplay) return;

    // Update on mouse/touch move
    const updateCoords = (e) => {
      const canvasController = this.app.canvas;
      if (!canvasController) return;

      const x =
        e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
      const y =
        e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
      const canvasPos = canvasController.screenToCanvas(x, y);

      coordsDisplay.textContent = `${Math.round(canvasPos.x)}, ${Math.round(
        canvasPos.y
      )}`;
    };

    document.addEventListener("mousemove", updateCoords);
    document.addEventListener("touchmove", updateCoords);
  }

  showMobilePropertiesPopup(node) {
    if (window.innerWidth >= 768) return; // Desktop only

    const popup = document.getElementById("properties-popup");
    const content = document.getElementById("properties-popup-content");

    if (!popup || !content) return;

    // Build property fields
    content.innerHTML = `
      <div class="property-group">
        <label class="property-label">Name</label>
        <input type="text" class="property-input" id="mobile-prop-name" value="${
          node.properties.name || ""
        }" />
      </div>
      <div class="property-group">
        <label class="property-label">Description</label>
        <textarea class="property-input" id="mobile-prop-desc" rows="3">${
          node.properties.description || ""
        }</textarea>
      </div>
      <div class="property-group">
        <label class="property-label">IP Address</label>
        <input type="text" class="property-input" id="mobile-prop-ip" value="${
          node.properties.ip || ""
        }" />
      </div>
    `;

    // Attach live update listeners
    const nameInput = document.getElementById("mobile-prop-name");
    nameInput?.addEventListener("input", (e) => {
      this.app.diagram.updateNode(node.id, {
        properties: { ...node.properties, name: e.target.value },
      });
      this.app.nodeRenderer.updateNodeElement(
        node.id,
        this.app.diagram.nodes.get(node.id)
      );
    });

    const descInput = document.getElementById("mobile-prop-desc");
    descInput?.addEventListener("input", (e) => {
      this.app.diagram.updateNode(node.id, {
        properties: { ...node.properties, description: e.target.value },
      });
    });

    const ipInput = document.getElementById("mobile-prop-ip");
    ipInput?.addEventListener("input", (e) => {
      this.app.diagram.updateNode(node.id, {
        properties: { ...node.properties, ip: e.target.value },
      });
    });

    // Show popup
    popup.classList.add("visible");
  }

  hideMobilePropertiesPopup() {
    const popup = document.getElementById("properties-popup");
    if (popup) {
      popup.classList.remove("visible");
    }
  }

  updateDiagramName(newName) {
    if (!newName || newName.trim() === "") {
      // Revert to current name if empty
      const titleInput = document.getElementById("diagram-title");
      if (titleInput) {
        titleInput.value = this.app.diagram.metadata.name;
      }
      return;
    }

    const name = newName.trim();
    this.app.diagram.metadata.name = name;
    this.app.diagram.updateModified();

    // Update document title
    document.title = `${name} - HomeLab Studio`;
    this.showToast(`Diagram renamed to "${name}"`, "success");
  }

  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("homelab-theme", newTheme);
  }

  togglePalette() {
    const palette = document.getElementById("palette");
    if (palette) {
      palette.classList.toggle("collapsed");
      // Optionally update icon if needed, but handled via CSS transform
    }
  }

  // Context Menu
  showContextMenu(x, y, nodeId = null, connectionId = null) {
    this.contextNodeId = nodeId;
    this.contextConnectionId = connectionId;

    // Adjust for Multi-Select
    const groupBtn = this.contextMenu.querySelector(
      '[data-action="group-network"]'
    );
    const isMultiSelect =
      this.app.canvas.selectedNodeIds &&
      this.app.canvas.selectedNodeIds.size > 1;

    if (groupBtn) {
      groupBtn.style.display = isMultiSelect ? "flex" : "none";
    }

    // Show/hide "Add to Group" based on existing groups
    const addToGroupBtn = this.contextMenu.querySelector(
      '[data-action="add-to-group"]'
    );
    const hasGroups = this.app.diagram.groups.size > 0;
    const hasSingleSelection = nodeId && !isMultiSelect;

    if (addToGroupBtn) {
      addToGroupBtn.style.display =
        hasGroups && (hasSingleSelection || isMultiSelect) ? "flex" : "none";
    }

    // Populate groups submenu
    if (hasGroups && (hasSingleSelection || isMultiSelect)) {
      this.populateGroupsSubmenu();
    }

    // Show/hide "Remove from Group" based on whether node(s) are in any group
    const removeFromGroupBtn = this.contextMenu.querySelector(
      '[data-action="remove-from-group"]'
    );
    let nodeIsInGroup = false;

    if (nodeId) {
      // Check if this single node is in any group
      nodeIsInGroup = Array.from(this.app.diagram.groups.values()).some(
        (group) => group.nodeIds.includes(nodeId)
      );
    } else if (isMultiSelect) {
      // Check if any selected node is in a group
      const selectedIds = Array.from(this.app.canvas.selectedNodeIds);
      nodeIsInGroup = selectedIds.some((id) =>
        Array.from(this.app.diagram.groups.values()).some((group) =>
          group.nodeIds.includes(id)
        )
      );
    }

    if (removeFromGroupBtn) {
      removeFromGroupBtn.style.display = nodeIsInGroup ? "flex" : "none";
    }

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
    const submenu = document.getElementById("groups-submenu");
    if (submenu) {
      submenu.classList.remove("visible");
    }
    this.contextNodeId = null;
    this.contextConnectionId = null;
  }

  handleContextAction(action) {
    switch (action) {
      case "duplicate":
        if (this.app.canvas.selectedNodeIds.size > 0) {
          this.app.duplicateSelectedNodes();
        } else if (this.contextNodeId) {
          this.app.duplicateNode(this.contextNodeId);
        }
        break;
      case "delete":
        if (this.app.canvas.selectedNodeIds.size > 0) {
          this.app.removeSelectedNodes();
        } else if (this.app.canvas.selectedConnectionIds.size > 0) {
          this.app.removeSelectedConnections();
        } else if (this.contextNodeId) {
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
      case "group-network":
        // Group currently selected nodes
        if (
          this.app.canvas.selectedNodeIds &&
          this.app.canvas.selectedNodeIds.size > 1
        ) {
          this.app.createGroup(Array.from(this.app.canvas.selectedNodeIds));
        } else if (this.contextNodeId) {
          this.showToast("Select multiple nodes to group", "warning");
        }
        break;
      case "remove-from-group":
        // Remove node(s) from their group(s)
        let nodesToRemove = [];
        if (this.contextNodeId) {
          nodesToRemove = [this.contextNodeId];
        } else if (this.app.canvas.selectedNodeIds) {
          nodesToRemove = Array.from(this.app.canvas.selectedNodeIds);
        }

        const removedCount = this.app.removeNodesFromGroup(nodesToRemove);

        if (removedCount > 0) {
          this.showToast(
            `Removed ${removedCount} node(s) from group(s)`,
            "success"
          );
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
      // Get the canvas wrapper
      const wrapper = document.getElementById("canvas-wrapper");
      if (!wrapper) {
        this.showToast("Canvas not found", "error");
        return;
      }

      // Calculate bounds including groups
      let minX = Infinity,
        minY = Infinity;
      let maxX = -Infinity,
        maxY = -Infinity;

      // Check nodes
      this.app.diagram.nodes.forEach((node) => {
        const h =
          node.expanded && node.category === "hardware" ? 350 : node.height;
        minX = Math.min(minX, node.x);
        minY = Math.min(minY, node.y);
        maxX = Math.max(maxX, node.x + node.width);
        maxY = Math.max(maxY, node.y + h);
      });

      // Check groups
      this.app.diagram.groups.forEach((group) => {
        const bounds = this.app.canvas.getGroupBounds(group);
        if (bounds) {
          minX = Math.min(minX, bounds.x);
          minY = Math.min(minY, bounds.y);
          maxX = Math.max(maxX, bounds.x + bounds.width);
          maxY = Math.max(maxY, bounds.y + bounds.height);
        }
      });

      if (minX === Infinity) {
        this.showToast("Nothing to export", "warning");
        return;
      }

      const padding = 50;
      const width = maxX - minX + padding * 2;
      const height = maxY - minY + padding * 2;

      // Create an SVG element
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("width", width);
      svg.setAttribute("height", height);
      svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");

      // Add background
      const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      bg.setAttribute("width", width);
      bg.setAttribute("height", height);
      bg.setAttribute("fill", "#0d1117");
      svg.appendChild(bg);

      // Create defs for markers
      const defs = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "defs"
      );

      // Add arrow markers for each connection type
      const connectionTypes = ["ethernet", "wireless", "fiber", "usb"];
      connectionTypes.forEach((type) => {
        const marker = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "marker"
        );
        marker.setAttribute("id", `arrow-${type}-export`);
        marker.setAttribute("markerWidth", "10");
        marker.setAttribute("markerHeight", "10");
        marker.setAttribute("refX", "9");
        marker.setAttribute("refY", "3");
        marker.setAttribute("orient", "auto");
        marker.setAttribute("markerUnits", "strokeWidth");

        const path = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "path"
        );
        path.setAttribute("d", "M0,0 L0,6 L9,3 z");

        // Set color based on type
        const colors = {
          ethernet: "#58a6ff",
          wireless: "#a371f7",
          fiber: "#3fb950",
          usb: "#f85149",
        };
        path.setAttribute("fill", colors[type] || "#58a6ff");
        marker.appendChild(path);
        defs.appendChild(marker);
      });
      svg.appendChild(defs);

      // Draw groups
      this.app.diagram.groups.forEach((group) => {
        const bounds = this.app.canvas.getGroupBounds(group);
        if (bounds) {
          const x = bounds.x - minX + padding;
          const y = bounds.y - minY + padding;

          // Group rectangle
          const rect = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "rect"
          );
          rect.setAttribute("x", x);
          rect.setAttribute("y", y);
          rect.setAttribute("width", bounds.width);
          rect.setAttribute("height", bounds.height);
          rect.setAttribute("fill", "none");
          rect.setAttribute("stroke", group.color || "#58a6ff");
          rect.setAttribute("stroke-width", "2");
          rect.setAttribute("stroke-dasharray", "5,5");
          rect.setAttribute("rx", "8");
          svg.appendChild(rect);

          // Group label
          const text = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "text"
          );
          text.setAttribute("x", x + 10);
          text.setAttribute("y", y - 5);
          text.setAttribute("fill", group.color || "#58a6ff");
          text.setAttribute("font-size", "12");
          text.setAttribute("font-weight", "600");
          text.setAttribute("font-family", "Inter, sans-serif");
          text.textContent = group.name;
          svg.appendChild(text);
        }
      });

      // Draw connections
      this.app.diagram.connections.forEach((connection) => {
        const endpoints = this.app.diagram.getConnectionEndpoints(
          connection.id
        );
        if (endpoints) {
          const path = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "path"
          );

          const sx = endpoints.source.x - minX + padding;
          const sy = endpoints.source.y - minY + padding;
          const tx = endpoints.target.x - minX + padding;
          const ty = endpoints.target.y - minY + padding;

          // Calculate straight line
          const pathData = `M ${sx} ${sy} L ${tx} ${ty}`;
          path.setAttribute("d", pathData);
          path.setAttribute("fill", "none");
          path.setAttribute("stroke-width", "2");
          path.setAttribute(
            "marker-end",
            `url(#arrow-${connection.type}-export)`
          );

          // Set stroke style based on type
          const styles = {
            ethernet: { stroke: "#58a6ff", dasharray: "" },
            wireless: { stroke: "#a371f7", dasharray: "5,5" },
            fiber: { stroke: "#3fb950", dasharray: "" },
            usb: { stroke: "#f85149", dasharray: "" },
          };
          const style = styles[connection.type] || styles.ethernet;
          path.setAttribute("stroke", style.stroke);
          if (style.dasharray) {
            path.setAttribute("stroke-dasharray", style.dasharray);
          }

          svg.appendChild(path);

          // Draw Label
          const midX = (sx + tx) / 2;
          const midY = (sy + ty) / 2;
          const sourceNode = this.app.diagram.nodes.get(connection.sourceId);
          const targetNode = this.app.diagram.nodes.get(connection.targetId);

          if (sourceNode && targetNode) {
            const isUserDevice =
              sourceNode.category === "user-device" ||
              targetNode.category === "user-device";

            const bandwidth = connection.properties.bandwidth || "1000";
            const bandwidthUnit = connection.properties.bandwidthUnit || "Mbit";

            // Label Group
            const labelGroup = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "g"
            );

            // Background Rect
            const bgRect = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "rect"
            );
            bgRect.setAttribute("fill", "#0d1117"); // Match background color for overlay effect
            bgRect.setAttribute("rx", "3");

            // Label Text
            const text = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "text"
            );
            text.setAttribute("x", midX);
            text.setAttribute("y", midY);
            text.setAttribute("text-anchor", "middle");
            text.setAttribute("dominant-baseline", "middle");
            text.setAttribute("font-family", "Inter, sans-serif");
            text.setAttribute("fill", "var(--text-primary)"); // Will fail in export, hardcode color
            text.setAttribute("fill", "#f0f6fc");

            if (isUserDevice) {
              // Simplified Label
              text.textContent = `${bandwidth} ${bandwidthUnit}`;
              text.setAttribute("font-size", "10");
              text.setAttribute("font-weight", "600");

              // Approx bg size
              bgRect.setAttribute("x", midX - 30);
              bgRect.setAttribute("y", midY - 10);
              bgRect.setAttribute("width", 60);
              bgRect.setAttribute("height", 20);
            } else {
              // Full Label logic omitted for brevity in SVG export usually, but let's try to match editor
              // For simplicity in export, let's just show connection name OR bandwidth + type
              const connectionName = connection.properties.name;

              if (connectionName) {
                const tspanName = document.createElementNS(
                  "http://www.w3.org/2000/svg",
                  "tspan"
                );
                tspanName.textContent = connectionName;
                tspanName.setAttribute("x", midX);
                tspanName.setAttribute("dy", "-10");
                tspanName.setAttribute("font-weight", "600");
                text.appendChild(tspanName);
              }

              const tspanNodes = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "tspan"
              );
              tspanNodes.textContent = `${
                sourceNode.properties.name || sourceNode.type
              } → ${targetNode.properties.name || targetNode.type}`;
              tspanNodes.setAttribute("x", midX);
              tspanNodes.setAttribute("dy", connectionName ? "14" : "0");
              tspanNodes.setAttribute("font-size", "11");
              text.appendChild(tspanNodes);

              const tspanSpeed = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "tspan"
              );
              tspanSpeed.textContent = `${bandwidth} ${bandwidthUnit}`;
              tspanSpeed.setAttribute("x", midX);
              tspanSpeed.setAttribute("dy", "14");
              tspanSpeed.setAttribute("font-size", "10");
              tspanSpeed.setAttribute("opacity", "0.8");
              text.appendChild(tspanSpeed);

              // Approx bg size for full label
              bgRect.setAttribute("x", midX - 60);
              bgRect.setAttribute("y", midY - 30);
              bgRect.setAttribute("width", 120);
              bgRect.setAttribute("height", 60);
            }

            labelGroup.appendChild(bgRect);
            labelGroup.appendChild(text);
            svg.appendChild(labelGroup);
          }
        }
      });

      // Draw nodes
      this.app.diagram.nodes.forEach((node) => {
        const x = node.x - minX + padding;
        const y = node.y - minY + padding;
        const h =
          node.expanded && node.category === "hardware" ? 350 : node.height;

        // Find the group this node belongs to
        let nodeColor = "#58a6ff";
        this.app.diagram.groups.forEach((group) => {
          if (group.nodeIds.includes(node.id)) {
            nodeColor = group.color || "#58a6ff";
          }
        });

        // Node background
        const rect = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "rect"
        );
        rect.setAttribute("x", x);
        rect.setAttribute("y", y);
        rect.setAttribute("width", node.width);
        rect.setAttribute("height", h);
        rect.setAttribute("fill", "#161b22");
        rect.setAttribute("stroke", "#30363d");
        rect.setAttribute("stroke-width", "2");
        rect.setAttribute("rx", "12");
        svg.appendChild(rect);

        // Add simple icon representation
        const iconY = y + 35;
        const iconX = x + 20;
        const iconSize = 24;

        // Draw a simple icon based on node type
        const iconGroup = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "g"
        );

        if (node.type === "server" || node.category === "hardware") {
          // Server icon - simple rectangle with lines
          const serverRect = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "rect"
          );
          serverRect.setAttribute("x", iconX);
          serverRect.setAttribute("y", iconY - iconSize / 2);
          serverRect.setAttribute("width", iconSize);
          serverRect.setAttribute("height", iconSize);
          serverRect.setAttribute("fill", "none");
          serverRect.setAttribute("stroke", nodeColor);
          serverRect.setAttribute("stroke-width", "2");
          serverRect.setAttribute("rx", "3");
          iconGroup.appendChild(serverRect);

          // Add horizontal lines
          for (let i = 1; i <= 2; i++) {
            const line = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "line"
            );
            line.setAttribute("x1", iconX + 4);
            line.setAttribute("y1", iconY - iconSize / 2 + (i * iconSize) / 3);
            line.setAttribute("x2", iconX + iconSize - 4);
            line.setAttribute("y2", iconY - iconSize / 2 + (i * iconSize) / 3);
            line.setAttribute("stroke", nodeColor);
            line.setAttribute("stroke-width", "2");
            iconGroup.appendChild(line);
          }
        } else if (node.type === "router" || node.type === "switch") {
          // Router/Switch icon - diamond shape
          const points = `${iconX + iconSize / 2},${iconY - iconSize / 2} ${
            iconX + iconSize
          },${iconY} ${iconX + iconSize / 2},${
            iconY + iconSize / 2
          } ${iconX},${iconY}`;
          const diamond = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "polygon"
          );
          diamond.setAttribute("points", points);
          diamond.setAttribute("fill", "none");
          diamond.setAttribute("stroke", nodeColor);
          diamond.setAttribute("stroke-width", "2");
          iconGroup.appendChild(diamond);
        } else {
          // Default icon - circle
          const circle = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "circle"
          );
          circle.setAttribute("cx", iconX + iconSize / 2);
          circle.setAttribute("cy", iconY);
          circle.setAttribute("r", iconSize / 2);
          circle.setAttribute("fill", "none");
          circle.setAttribute("stroke", nodeColor);
          circle.setAttribute("stroke-width", "2");
          iconGroup.appendChild(circle);
        }

        svg.appendChild(iconGroup);

        // Node title (adjusted position to make room for icon)
        const title = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "text"
        );
        title.setAttribute("x", x + 55);
        title.setAttribute("y", y + 40);
        title.setAttribute("fill", nodeColor);
        title.setAttribute("font-size", "16");
        title.setAttribute("font-weight", "600");
        title.setAttribute("font-family", "Inter, sans-serif");
        title.setAttribute("text-anchor", "start");
        title.textContent = node.properties.name || node.type;
        svg.appendChild(title);

        // Node type
        const typeText = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "text"
        );
        typeText.setAttribute("x", x + 55);
        typeText.setAttribute("y", y + 58);
        typeText.setAttribute("fill", "#8b949e");
        typeText.setAttribute("font-size", "11");
        typeText.setAttribute("font-family", "Inter, sans-serif");
        typeText.setAttribute("text-anchor", "start");
        typeText.textContent = node.type;
        svg.appendChild(typeText);

        // If expanded hardware node, show details
        if (node.expanded && node.category === "hardware") {
          let yOffset = 80;

          // CPU
          const cpuLabel = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "text"
          );
          cpuLabel.setAttribute("x", x + 20);
          cpuLabel.setAttribute("y", y + yOffset);
          cpuLabel.setAttribute("fill", "#8b949e");
          cpuLabel.setAttribute("font-size", "11");
          cpuLabel.setAttribute("font-family", "Inter, sans-serif");
          cpuLabel.textContent = `CPU (${
            node.properties.cpu ||
            NODE_TYPES[node.type]?.properties?.cpu ||
            "1.0"
          } GHz)`;
          svg.appendChild(cpuLabel);

          const cpuValue = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "text"
          );
          cpuValue.setAttribute("x", x + node.width - 20);
          cpuValue.setAttribute("y", y + yOffset);
          cpuValue.setAttribute("fill", "#c9d1d9");
          cpuValue.setAttribute("font-size", "11");
          cpuValue.setAttribute("font-family", "Inter, sans-serif");
          cpuValue.setAttribute("text-anchor", "end");

          const load = this.app.canvas.nodeRenderer.calculateResources(node);
          cpuValue.textContent = `${load.cpu.percent.toFixed(0)}%`;
          svg.appendChild(cpuValue);

          yOffset += 30;

          // RAM
          const ramLabel = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "text"
          );
          ramLabel.setAttribute("x", x + 20);
          ramLabel.setAttribute("y", y + yOffset);
          ramLabel.setAttribute("fill", "#8b949e");
          ramLabel.setAttribute("font-size", "11");
          ramLabel.setAttribute("font-family", "Inter, sans-serif");
          ramLabel.textContent = `RAM (${
            load.ram.max >= 1024
              ? (load.ram.max / 1024).toFixed(0) + "GB"
              : load.ram.max + "MB"
          })`;
          svg.appendChild(ramLabel);

          const ramValue = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "text"
          );
          ramValue.setAttribute("x", x + node.width - 20);
          ramValue.setAttribute("y", y + yOffset);
          ramValue.setAttribute("fill", "#c9d1d9");
          ramValue.setAttribute("font-size", "11");
          ramValue.setAttribute("font-family", "Inter, sans-serif");
          ramValue.setAttribute("text-anchor", "end");
          ramValue.textContent = `${load.ram.percent.toFixed(0)}%`;
          svg.appendChild(ramValue);

          yOffset += 30;

          // Storage
          const storageLabel = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "text"
          );
          storageLabel.setAttribute("x", x + 20);
          storageLabel.setAttribute("y", y + yOffset);
          storageLabel.setAttribute("fill", "#8b949e");
          storageLabel.setAttribute("font-size", "11");
          storageLabel.setAttribute("font-family", "Inter, sans-serif");
          storageLabel.textContent = `Storage (${load.storage.max}GB)`;
          svg.appendChild(storageLabel);

          const storageValue = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "text"
          );
          storageValue.setAttribute("x", x + node.width - 20);
          storageValue.setAttribute("y", y + yOffset);
          storageValue.setAttribute("fill", "#c9d1d9");
          storageValue.setAttribute("font-size", "11");
          storageValue.setAttribute("font-family", "Inter, sans-serif");
          storageValue.setAttribute("text-anchor", "end");
          storageValue.textContent = `${load.storage.percent.toFixed(0)}%`;
          svg.appendChild(storageValue);
        }

        // Status indicator
        const statusCircle = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "circle"
        );
        statusCircle.setAttribute("cx", x + node.width - 15);
        statusCircle.setAttribute("cy", y + 15);
        statusCircle.setAttribute("r", "5");
        statusCircle.setAttribute(
          "fill",
          node.properties.status === "online" ? "#3fb950" : "#6e7681"
        );
        svg.appendChild(statusCircle);
      });

      // Convert SVG to PNG
      const svgData = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgData], {
        type: "image/svg+xml;charset=utf-8",
      });
      const url = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        canvas.toBlob((blob) => {
          const link = document.createElement("a");
          link.download = `homelab-diagram-${Date.now()}.png`;
          link.href = URL.createObjectURL(blob);
          link.click();
          URL.revokeObjectURL(url);
          this.showToast("Diagram exported as PNG", "success");
        });
      };
      img.src = url;
    } catch (error) {
      console.error("Export failed:", error);
      this.showToast("Export failed", "error");
    }
  }

  populateGroupsSubmenu() {
    const submenu = document.getElementById("groups-submenu");
    if (!submenu) return;

    // Clear existing items
    submenu.innerHTML = "";

    // Add each group as an option
    this.app.diagram.groups.forEach((group) => {
      const item = document.createElement("button");
      item.className = "context-item";
      item.dataset.groupId = group.id;

      // Color indicator
      const colorDot = document.createElement("span");
      colorDot.style.cssText = `
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: ${group.color};
        flex-shrink: 0;
      `;

      const label = document.createElement("span");
      label.textContent = group.name || "Unnamed Group";

      item.appendChild(colorDot);
      item.appendChild(label);
      submenu.appendChild(item);
    });

    this.setupGroupsSubmenuListeners();
  }

  setupGroupsSubmenuListeners() {
    const addToGroupBtn = document.getElementById("add-to-group-btn");
    const submenu = document.getElementById("groups-submenu");

    if (!addToGroupBtn || !submenu) return;

    // Show submenu on hover
    addToGroupBtn.addEventListener("mouseenter", () => {
      const btnRect = addToGroupBtn.getBoundingClientRect();
      submenu.style.left = `${btnRect.right + 5}px`;
      submenu.style.top = `${btnRect.top}px`;
      submenu.classList.add("visible");
    });

    // Keep submenu open when hovering over it
    submenu.addEventListener("mouseenter", () => {
      submenu.classList.add("visible");
    });

    // Close submenu when mouse leaves both button and submenu
    const closeSubmenu = () => {
      setTimeout(() => {
        if (!addToGroupBtn.matches(":hover") && !submenu.matches(":hover")) {
          submenu.classList.remove("visible");
        }
      }, 100);
    };

    addToGroupBtn.addEventListener("mouseleave", closeSubmenu);
    submenu.addEventListener("mouseleave", closeSubmenu);

    // Handle group selection
    submenu.querySelectorAll(".context-item").forEach((item) => {
      item.addEventListener("click", () => {
        const groupId = item.dataset.groupId;
        const group = this.app.diagram.groups.get(groupId);

        if (group) {
          // Get nodes to add
          let nodesToAdd = [];
          if (this.contextNodeId) {
            nodesToAdd = [this.contextNodeId];
          } else if (this.app.canvas.selectedNodeIds) {
            nodesToAdd = Array.from(this.app.canvas.selectedNodeIds);
          }

          // Add nodes to group using the method with history tracking
          const addedCount = this.app.addNodesToGroup(groupId, nodesToAdd);

          this.closeContextMenu();

          if (addedCount > 0) {
            this.showToast(
              `Added ${addedCount} node(s) to ${group.name}`,
              "success"
            );
          }
        }
      });
    });
  }
  // Shortcuts Modal
  showShortcutsModal() {
    // Check if user has opted out
    const dontShow = localStorage.getItem("homelab-shortcuts-optout");
    if (dontShow === "true") {
      return;
    }

    const modal = document.getElementById("shortcuts-modal");
    const overlay = document.getElementById("shortcuts-modal-overlay");

    if (modal && overlay) {
      modal.classList.add("visible");
      overlay.classList.add("visible");
    }
  }

  closeShortcutsModal() {
    const modal = document.getElementById("shortcuts-modal");
    const overlay = document.getElementById("shortcuts-modal-overlay");
    const checkbox = document.getElementById("dont-show-shortcuts");

    if (checkbox && checkbox.checked) {
      localStorage.setItem("homelab-shortcuts-optout", "true");
    }

    if (modal && overlay) {
      modal.classList.remove("visible");
      overlay.classList.remove("visible");
    }
  }
}
