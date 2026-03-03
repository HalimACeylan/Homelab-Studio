/**
 * UIController - Handles UI interactions, modals, toasts, and context menus
 */

import { downloadFile } from "./utils.js";
import html2canvas from "html2canvas";

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
    if (!this.isMobileViewport()) return;

    const popup = document.getElementById("properties-popup");
    const content = document.getElementById("properties-popup-content");
    const title = document.getElementById("mobile-properties-title");

    if (!popup || !content) return;
    const currentNode = this.app.diagram.nodes.get(node.id);
    if (!currentNode) return;

    const isHardware = currentNode.category === "hardware";
    const resourceLoad = this.app.canvas.nodeRenderer.calculateResources(currentNode);
    const cpuVal = parseFloat(currentNode.properties.cpu) || 1.0;
    const ramVal = parseInt(currentNode.properties.ram, 10) || 4;
    const storageVal = parseInt(currentNode.properties.storage, 10) || 128;

    if (title) {
      title.textContent = `${currentNode.properties.name || "Node"} Settings`;
    }

    content.innerHTML = `
      <div class="property-group">
        <div class="property-group-title">General</div>
        <div class="property-row">
          <label class="property-label" for="mobile-prop-name">Name</label>
          <input type="text" class="property-input" id="mobile-prop-name" value="${
            currentNode.properties.name || ""
          }" />
        </div>
        <div class="property-row">
          <label class="property-label" for="mobile-prop-description">Description</label>
          <textarea class="property-input" id="mobile-prop-description" rows="3" maxlength="2000">${
            currentNode.properties.description || ""
          }</textarea>
        </div>
      </div>

      ${
        resourceLoad
          ? `
      <div class="property-group">
        <div class="property-group-title">Resource Load</div>
        <div class="property-resource-group">
          <div class="resource-row">
            <div class="resource-info">
              <div style="display:flex;align-items:center;">
                <input type="number" step="0.1" min="0.1" max="10.0" class="spec-numeric-input" id="mobile-prop-cpu-num" value="${cpuVal.toFixed(
              1
            )}" />
                <span class="spec-unit">GHz</span>
              </div>
              <span class="resource-value" id="mobile-cpu-percent">${resourceLoad.cpu.percent.toFixed(
                0
              )}%</span>
            </div>
            <div class="resource-bar-bg">
              <div class="resource-bar-fill cpu" id="mobile-cpu-fill" style="width:${
                resourceLoad.cpu.percent
              }%"></div>
            </div>
            <div class="spec-input-container">
              <div class="spec-header">
                <label class="property-label">CPU Capacity</label>
              </div>
              <input type="range" step="0.1" min="0.1" max="10.0" class="spec-slider cpu" id="mobile-prop-cpu-range" value="${cpuVal.toFixed(
                1
              )}" />
            </div>
          </div>
          <div class="resource-row">
            <div class="resource-info">
              <div style="display:flex;align-items:center;">
                <input type="number" step="1" min="1" max="512" class="spec-numeric-input" id="mobile-prop-ram-num" value="${ramVal}" />
                <span class="spec-unit">GB</span>
              </div>
              <span class="resource-value" id="mobile-ram-percent">${resourceLoad.ram.percent.toFixed(
                0
              )}%</span>
            </div>
            <div class="resource-bar-bg">
              <div class="resource-bar-fill ram" id="mobile-ram-fill" style="width:${
                resourceLoad.ram.percent
              }%"></div>
            </div>
            <div class="spec-input-container">
              <div class="spec-header">
                <label class="property-label">RAM Capacity</label>
              </div>
              <input type="range" step="1" min="1" max="512" class="spec-slider ram" id="mobile-prop-ram-range" value="${ramVal}" />
            </div>
          </div>
          <div class="resource-row">
            <div class="resource-info">
              <div style="display:flex;align-items:center;">
                <input type="number" step="1" min="1" max="8192" class="spec-numeric-input" id="mobile-prop-storage-num" value="${storageVal}" />
                <span class="spec-unit">GB</span>
              </div>
              <span class="resource-value" id="mobile-storage-percent">${resourceLoad.storage.percent.toFixed(
                0
              )}%</span>
            </div>
            <div class="resource-bar-bg">
              <div class="resource-bar-fill storage" id="mobile-storage-fill" style="width:${
                resourceLoad.storage.percent
              }%"></div>
            </div>
            <div class="spec-input-container">
              <div class="spec-header">
                <label class="property-label">Storage Capacity</label>
              </div>
              <input type="range" step="1" min="1" max="8192" class="spec-slider storage" id="mobile-prop-storage-range" value="${storageVal}" />
            </div>
          </div>
        </div>
      </div>
      `
          : ""
      }

      <div class="property-group">
        <div class="property-group-title">Network</div>
        <div class="property-row">
          <label class="property-label" for="mobile-prop-ip">IP Address</label>
          <input type="text" class="property-input" id="mobile-prop-ip" value="${
            currentNode.properties.ip || ""
          }" />
        </div>
        <div class="property-row">
          <label class="property-label" for="mobile-prop-hostname">Hostname</label>
          <input type="text" class="property-input" id="mobile-prop-hostname" value="${
            currentNode.properties.hostname || ""
          }" />
        </div>
        <div class="property-row">
          <label class="property-label" for="mobile-prop-mac">MAC Address</label>
          <input type="text" class="property-input" id="mobile-prop-mac" value="${
            currentNode.properties.mac || ""
          }" />
        </div>
      </div>

      ${
        isHardware
          ? `
      <div class="property-group">
        <div class="property-group-title">Specifications</div>
        <div class="property-row">
          <label class="property-label" for="mobile-prop-os">Operating System</label>
          <input type="text" class="property-input" id="mobile-prop-os" value="${
            currentNode.properties.os || ""
          }" />
        </div>
      </div>
      `
          : ""
      }

      <div class="property-group">
        <div class="property-group-title">Position</div>
        <div class="property-row" style="display:flex;gap:8px;">
          <div style="flex:1;">
            <label class="property-label" for="mobile-prop-x">X</label>
            <input type="number" class="property-input" id="mobile-prop-x" value="${Math.round(
              currentNode.x
            )}">
          </div>
          <div style="flex:1;">
            <label class="property-label" for="mobile-prop-y">Y</label>
            <input type="number" class="property-input" id="mobile-prop-y" value="${Math.round(
              currentNode.y
            )}">
          </div>
        </div>
        <div class="property-row" style="display:flex;gap:8px;">
          <div style="flex:1;">
            <label class="property-label" for="mobile-prop-width">Width</label>
            <input type="number" class="property-input" id="mobile-prop-width" value="${currentNode.width}">
          </div>
          <div style="flex:1;">
            <label class="property-label" for="mobile-prop-height">Height</label>
            <input type="number" class="property-input" id="mobile-prop-height" value="${currentNode.height}">
          </div>
        </div>
      </div>

      <div class="property-group">
        <div class="property-group-title">Actions</div>
        <button class="btn btn-secondary" style="width:100%;margin-bottom:8px;" id="mobile-btn-duplicate-node">Duplicate Node</button>
        <button class="btn btn-danger" style="width:100%;" id="mobile-btn-delete-node">Delete Node</button>
      </div>
    `;

    const updateResourcePreview = () => {
      const liveNode = this.app.diagram.nodes.get(currentNode.id);
      if (!liveNode || !resourceLoad) return;
      const load = this.app.canvas.nodeRenderer.calculateResources(liveNode);
      if (!load) return;

      const cpuPct = document.getElementById("mobile-cpu-percent");
      const ramPct = document.getElementById("mobile-ram-percent");
      const storagePct = document.getElementById("mobile-storage-percent");
      const cpuFill = document.getElementById("mobile-cpu-fill");
      const ramFill = document.getElementById("mobile-ram-fill");
      const storageFill = document.getElementById("mobile-storage-fill");

      if (cpuPct) cpuPct.textContent = `${load.cpu.percent.toFixed(0)}%`;
      if (ramPct) ramPct.textContent = `${load.ram.percent.toFixed(0)}%`;
      if (storagePct) storagePct.textContent = `${load.storage.percent.toFixed(0)}%`;
      if (cpuFill) cpuFill.style.width = `${load.cpu.percent}%`;
      if (ramFill) ramFill.style.width = `${load.ram.percent}%`;
      if (storageFill) storageFill.style.width = `${load.storage.percent}%`;
    };

    const applyProperty = (key, value, refreshLoad = true) => {
      const liveNode = this.app.diagram.nodes.get(currentNode.id);
      if (!liveNode) return;
      this.app.diagram.updateNode(currentNode.id, { properties: { [key]: value } });
      this.app.nodeRenderer.updateNodeElement(currentNode.id, liveNode);
      this.app.canvas.updateGroupsForNode(currentNode.id);
      if (refreshLoad) updateResourcePreview();
    };

    const nameInput = document.getElementById("mobile-prop-name");
    nameInput?.addEventListener("input", (e) => {
      applyProperty("name", e.target.value);
    });

    const descInput = document.getElementById("mobile-prop-description");
    descInput?.addEventListener("input", (e) => {
      applyProperty("description", e.target.value, false);
    });

    const ipInput = document.getElementById("mobile-prop-ip");
    ipInput?.addEventListener("input", (e) => {
      applyProperty("ip", e.target.value, false);
    });

    const hostnameInput = document.getElementById("mobile-prop-hostname");
    hostnameInput?.addEventListener("input", (e) => {
      applyProperty("hostname", e.target.value, false);
    });

    const macInput = document.getElementById("mobile-prop-mac");
    macInput?.addEventListener("input", (e) => {
      applyProperty("mac", e.target.value, false);
    });

    const osInput = document.getElementById("mobile-prop-os");
    osInput?.addEventListener("input", (e) => {
      applyProperty("os", e.target.value, false);
    });

    const setupDualInput = (idPrefix, propName, maxVal, minVal, step) => {
      const numInput = document.getElementById(`mobile-prop-${idPrefix}-num`);
      const rangeInput = document.getElementById(`mobile-prop-${idPrefix}-range`);
      if (!numInput || !rangeInput) return;

      const update = (rawValue) => {
        let numericVal = parseFloat(rawValue);
        if (!Number.isFinite(numericVal)) return;
        if (numericVal > maxVal) numericVal = maxVal;
        if (numericVal < minVal) numericVal = minVal;
        if (step === 1) numericVal = Math.round(numericVal);
        numInput.value = numericVal;
        rangeInput.value = numericVal;
        if (idPrefix === "cpu") {
          applyProperty(propName, `${numericVal.toFixed(1)} GHz`);
        } else {
          applyProperty(propName, `${numericVal} GB`);
        }
      };

      numInput.addEventListener("input", (e) => update(e.target.value));
      rangeInput.addEventListener("input", (e) => update(e.target.value));
    };

    setupDualInput("cpu", "cpu", 10.0, 0.1, 0.1);
    setupDualInput("ram", "ram", 512, 1, 1);
    setupDualInput("storage", "storage", 8192, 1, 1);

    const xInput = document.getElementById("mobile-prop-x");
    xInput?.addEventListener("change", (e) => {
      const liveNode = this.app.diagram.nodes.get(currentNode.id);
      if (!liveNode) return;
      const x = parseInt(e.target.value, 10);
      if (!Number.isFinite(x)) return;
      this.app.updateNodePosition(currentNode.id, x, liveNode.y);
    });

    const yInput = document.getElementById("mobile-prop-y");
    yInput?.addEventListener("change", (e) => {
      const liveNode = this.app.diagram.nodes.get(currentNode.id);
      if (!liveNode) return;
      const y = parseInt(e.target.value, 10);
      if (!Number.isFinite(y)) return;
      this.app.updateNodePosition(currentNode.id, liveNode.x, y);
    });

    const widthInput = document.getElementById("mobile-prop-width");
    widthInput?.addEventListener("change", (e) => {
      const liveNode = this.app.diagram.nodes.get(currentNode.id);
      if (!liveNode) return;
      const width = parseInt(e.target.value, 10);
      if (!Number.isFinite(width) || width < 80) return;
      this.app.diagram.updateNode(currentNode.id, { width });
      const element = document.querySelector(`[data-node-id="${currentNode.id}"]`);
      if (element) element.style.width = `${width}px`;
      this.app.canvas.updateGroupsForNode(currentNode.id);
    });

    const heightInput = document.getElementById("mobile-prop-height");
    heightInput?.addEventListener("change", (e) => {
      const liveNode = this.app.diagram.nodes.get(currentNode.id);
      if (!liveNode) return;
      const height = parseInt(e.target.value, 10);
      if (!Number.isFinite(height) || height < 60) return;
      this.app.diagram.updateNode(currentNode.id, { height });
      const element = document.querySelector(`[data-node-id="${currentNode.id}"]`);
      if (element) {
        element.style.height = `${height}px`;
        element.style.minHeight = `${height}px`;
      }
      this.app.canvas.updateGroupsForNode(currentNode.id);
    });

    document
      .getElementById("mobile-btn-duplicate-node")
      ?.addEventListener("click", () => {
        this.app.duplicateNode(currentNode.id);
      });

    document
      .getElementById("mobile-btn-delete-node")
      ?.addEventListener("click", () => {
        this.app.removeNode(currentNode.id);
        this.hideMobilePropertiesPopup();
        this.showToast("Node deleted", "success");
    });

    popup.classList.add("visible");
  }

  hideMobilePropertiesPopup() {
    const popup = document.getElementById("properties-popup");
    const title = document.getElementById("mobile-properties-title");
    if (popup) {
      popup.classList.remove("visible");
    }
    if (title) {
      title.textContent = "Node Settings";
    }
  }

  isMobileViewport() {
    return window.matchMedia("(max-width: 768px)").matches;
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
    if (this.isMobileViewport()) {
      return;
    }

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
      const wrapper = document.getElementById("canvas-wrapper");
      if (!wrapper) {
        this.showToast("Canvas not found", "error");
        return;
      }

      const bounds = this.getExportBounds();
      if (!bounds) {
        this.showToast("Nothing to export", "warning");
        return;
      }

      const padding = 50;
      const width = Math.ceil(bounds.maxX - bounds.minX + padding * 2);
      const height = Math.ceil(bounds.maxY - bounds.minY + padding * 2);
      const offsetX = padding - bounds.minX;
      const offsetY = padding - bounds.minY;

      const exportRoot = document.createElementNS(
        "http://www.w3.org/1999/xhtml",
        "div"
      );
      exportRoot.setAttribute(
        "data-theme",
        document.documentElement.getAttribute("data-theme") || "dark"
      );
      exportRoot.className = "canvas-container";
      exportRoot.style.width = `${width}px`;
      exportRoot.style.height = `${height}px`;
      exportRoot.style.position = "relative";
      exportRoot.style.overflow = "hidden";
      exportRoot.style.fontFamily =
        "system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif";
      exportRoot.style.setProperty(
        "--font-sans",
        "system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif"
      );
      exportRoot.style.setProperty(
        "--font-mono",
        "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace"
      );

      const canvasContainer = document.getElementById("canvas-container");
      if (canvasContainer) {
        const containerStyles = getComputedStyle(canvasContainer);
        exportRoot.style.backgroundColor = containerStyles.backgroundColor;
        exportRoot.style.backgroundImage = containerStyles.backgroundImage;
        exportRoot.style.backgroundSize = containerStyles.backgroundSize;
        exportRoot.style.backgroundPosition = containerStyles.backgroundPosition;
      }

      const styleEl = document.createElement("style");
      styleEl.textContent = await this.collectExportStyles();
      exportRoot.appendChild(styleEl);

      const clone = wrapper.cloneNode(true);
      clone.removeAttribute("id");
      clone.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(1)`;
      clone.style.transformOrigin = "top left";
      clone.style.width = `${width}px`;
      clone.style.height = `${height}px`;
      clone.style.cursor = "default";

      clone.querySelector("#canvas-overlay")?.remove();
      clone.querySelectorAll(".connection-temp").forEach((el) => el.remove());
      clone
        .querySelectorAll(
          ".selected, .connecting-source, .drop-target, .dragging, .resizing"
        )
        .forEach((el) =>
          el.classList.remove(
            "selected",
            "connecting-source",
            "drop-target",
            "dragging",
            "resizing"
          )
        );

      this.prepareExportClone(clone);
      exportRoot.appendChild(clone);

      await this.inlineElementImages(exportRoot);

      const staging = document.createElement("div");
      staging.style.position = "fixed";
      staging.style.left = "-100000px";
      staging.style.top = "-100000px";
      staging.style.width = "1px";
      staging.style.height = "1px";
      staging.style.overflow = "hidden";
      document.body.appendChild(staging);
      staging.appendChild(exportRoot);

      const canvas = await html2canvas(exportRoot, {
        backgroundColor: null,
        useCORS: true,
        allowTaint: false,
        scale: window.devicePixelRatio || 1,
        logging: false,
      });

      staging.remove();

      try {
        canvas.toBlob((blob) => {
          if (!blob) {
            this.showToast("Export failed", "error");
            return;
          }
          const link = document.createElement("a");
          link.download = `homelab-diagram-${Date.now()}.png`;
          const blobUrl = URL.createObjectURL(blob);
          link.href = blobUrl;
          link.click();
          URL.revokeObjectURL(blobUrl);
          this.showToast("Diagram exported as PNG", "success");
        });
      } catch (error) {
        console.error("Export failed:", error);
        this.showToast("Export failed", "error");
      }
    } catch (error) {
      console.error("Export failed:", error);
      this.showToast("Export failed", "error");
    }
  }

  prepareExportClone(root) {
    const groups = root.querySelectorAll(".canvas-group");
    groups.forEach((group) => {
      const rawColor =
        group.style.getPropertyValue("--group-color") ||
        getComputedStyle(group).borderColor ||
        "rgba(88, 166, 255, 0.8)";
      const borderColor = this.toOpaqueColor(rawColor);
      const fillColor = this.applyAlpha(rawColor, 0.08);

      // Preserve readable label styling for export
      const label = group.querySelector(".group-label");
      if (label) {
        label.style.color = borderColor;
        label.style.background = "rgba(13, 17, 23, 0.7)";
        label.style.border = `1px solid ${borderColor}`;
        label.style.borderRadius = "6px";
        label.style.padding = "2px 6px";
      }

      // Simplify for html2canvas
      group.style.background = fillColor;
      group.style.border = `2px solid ${borderColor}`;
      group.style.outline = "none";
      group.style.boxShadow = "none";
      group.style.filter = "none";
    });
  }

  toOpaqueColor(color) {
    const parsed = this.parseColor(color);
    if (!parsed) return color;
    return `rgb(${parsed.r}, ${parsed.g}, ${parsed.b})`;
  }

  applyAlpha(color, alpha) {
    const parsed = this.parseColor(color);
    if (!parsed) return color;
    return `rgba(${parsed.r}, ${parsed.g}, ${parsed.b}, ${alpha})`;
  }

  parseColor(color) {
    if (!color) return null;
    const c = color.trim();
    if (c.startsWith("#")) {
      const hex = c.slice(1);
      if (hex.length === 3) {
        const r = parseInt(hex[0] + hex[0], 16);
        const g = parseInt(hex[1] + hex[1], 16);
        const b = parseInt(hex[2] + hex[2], 16);
        return { r, g, b, a: 1 };
      }
      if (hex.length === 6 || hex.length === 8) {
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        return { r, g, b, a: 1 };
      }
      return null;
    }
    const rgbMatch = c.match(
      /^rgba?\s*\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/
    );
    if (rgbMatch) {
      const r = Math.round(parseFloat(rgbMatch[1]));
      const g = Math.round(parseFloat(rgbMatch[2]));
      const b = Math.round(parseFloat(rgbMatch[3]));
      const a = rgbMatch[4] !== undefined ? parseFloat(rgbMatch[4]) : 1;
      return { r, g, b, a };
    }
    return null;
  }

  async collectExportStyles() {
    let cssText = "";
    Array.from(document.styleSheets).forEach((sheet) => {
      try {
        const rules = sheet.cssRules;
        if (!rules) return;
        Array.from(rules).forEach((rule) => {
          cssText += `${rule.cssText}\n`;
        });
      } catch (e) {
        // Ignore cross-origin or inaccessible stylesheets
      }
    });
    return await this.inlineCssUrls(cssText);
  }

  async inlineCssUrls(cssText) {
    const urlRegex = /url\(([^)]+)\)/g;
    const urls = new Set();
    let match;
    while ((match = urlRegex.exec(cssText)) !== null) {
      const raw = match[1].trim().replace(/^['"]|['"]$/g, "");
      if (!raw || raw.startsWith("data:") || raw.startsWith("blob:")) continue;
      urls.add(raw);
    }

    if (urls.size === 0) return cssText;

    const cache = new Map();
    const toDataUrl = async (url) => {
      if (cache.has(url)) return cache.get(url);
      try {
        const absUrl = new URL(url, window.location.href).toString();
        const res = await fetch(absUrl);
        const blob = await res.blob();
        const dataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
        cache.set(url, dataUrl);
        return dataUrl;
      } catch (e) {
        return url;
      }
    };

    const replacements = await Promise.all(
      Array.from(urls).map(async (url) => [url, await toDataUrl(url)])
    );

    let updated = cssText;
    replacements.forEach(([url, dataUrl]) => {
      if (url !== dataUrl) {
        const safeUrl = url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        updated = updated.replace(
          new RegExp(`url\\((['"]?)${safeUrl}\\1\\)`, "g"),
          `url("${dataUrl}")`
        );
      }
    });

    return updated;
  }

  async inlineElementImages(root) {
    const staging = document.createElement("div");
    staging.style.position = "fixed";
    staging.style.left = "-100000px";
    staging.style.top = "-100000px";
    staging.style.width = "1px";
    staging.style.height = "1px";
    staging.style.overflow = "hidden";
    staging.appendChild(root);
    document.body.appendChild(staging);

    const elements = Array.from(root.querySelectorAll("*"));
    for (const el of elements) {
      const style = getComputedStyle(el);
      await this.inlineStyleUrl(el, "backgroundImage", style.backgroundImage);
      await this.inlineStyleUrl(el, "maskImage", style.maskImage);
      await this.inlineStyleUrl(el, "webkitMaskImage", style.webkitMaskImage);

      if (el instanceof SVGImageElement) {
        const href = el.getAttribute("href") || el.getAttribute("xlink:href");
        if (href && !href.startsWith("data:") && !href.startsWith("blob:")) {
          const dataUrl = await this.fetchAsDataUrl(href);
          if (dataUrl) {
            el.setAttribute("href", dataUrl);
            el.setAttribute("xlink:href", dataUrl);
          }
        }
      }
    }

    staging.remove();
  }

  async inlineStyleUrl(el, prop, value) {
    if (!value || value === "none" || !value.includes("url(")) return;
    const urls = [];
    const urlRegex = /url\(([^)]+)\)/g;
    let match;
    while ((match = urlRegex.exec(value)) !== null) {
      const raw = match[1].trim().replace(/^['"]|['"]$/g, "");
      if (!raw || raw.startsWith("data:") || raw.startsWith("blob:")) continue;
      urls.push(raw);
    }
    if (urls.length === 0) return;

    let updated = value;
    for (const url of urls) {
      const dataUrl = await this.fetchAsDataUrl(url);
      if (dataUrl) {
        const safeUrl = url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        updated = updated.replace(
          new RegExp(`url\\((['"]?)${safeUrl}\\1\\)`, "g"),
          `url("${dataUrl}")`
        );
      }
    }

    el.style[prop] = updated;
  }

  async fetchAsDataUrl(url) {
    try {
      const absUrl = new URL(url, window.location.href).toString();
      const res = await fetch(absUrl);
      const blob = await res.blob();
      return await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      return null;
    }
  }

  getExportBounds() {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    const nodeElements = document.querySelectorAll(".canvas-node");
    nodeElements.forEach((el) => {
      const x = parseFloat(el.style.left) || 0;
      const y = parseFloat(el.style.top) || 0;
      const w = el.offsetWidth || 0;
      const h = el.offsetHeight || 0;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + w);
      maxY = Math.max(maxY, y + h);
    });

    this.app.diagram.groups.forEach((group) => {
      const bounds = this.app.canvas.getGroupBounds(group);
      if (bounds) {
        minX = Math.min(minX, bounds.x);
        minY = Math.min(minY, bounds.y);
        maxX = Math.max(maxX, bounds.x + bounds.width);
        maxY = Math.max(maxY, bounds.y + bounds.height);
      }
    });

    const textElements = document.querySelectorAll(".canvas-text");
    textElements.forEach((el) => {
      const x = parseFloat(el.style.left) || 0;
      const y = parseFloat(el.style.top) || 0;
      const w = el.offsetWidth || 0;
      const h = el.offsetHeight || 0;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + w);
      maxY = Math.max(maxY, y + h);
    });

    if (minX === Infinity) return null;

    return { minX, minY, maxX, maxY };
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
    if (this.isMobileViewport()) {
      this.closeShortcutsModal();
      return;
    }

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
