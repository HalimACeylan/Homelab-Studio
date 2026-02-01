/**
 * KeyboardController - Handles keyboard shortcuts
 */

export class KeyboardController {
  constructor(app) {
    this.app = app;
    this.setupEventListeners();
  }

  setupEventListeners() {
    document.addEventListener("keydown", (e) => this.handleKeyDown(e));
  }

  handleKeyDown(e) {
    // Ignore if typing in an input
    if (e.target.matches("input, textarea, select")) {
      return;
    }

    const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
    const cmdKey = isMac ? e.metaKey : e.ctrlKey;

    // Delete selected element
    if (e.key === "Delete" || e.key === "Backspace") {
      const selectedIds = this.app.canvas.selectedNodeIds;
      if (selectedIds && selectedIds.size > 0) {
        e.preventDefault();
        const count = selectedIds.size;
        // Use a generic removeSelectedNodes if it exists, otherwise loop
        if (this.app.removeSelectedNodes) {
          this.app.removeSelectedNodes();
        } else {
          const ids = Array.from(selectedIds);
          ids.forEach((id) => this.app.removeNode(id));
        }
        this.app.ui.showToast(`${count} node(s) deleted`, "success");
      } else if (
        this.app.canvas.selectedConnectionIds &&
        this.app.canvas.selectedConnectionIds.size > 0
      ) {
        e.preventDefault();
        const count = this.app.canvas.selectedConnectionIds.size;
        this.app.removeSelectedConnections();
        this.app.ui.showToast(`${count} connection(s) deleted`, "success");
      } else if (this.app.canvas.selectedGroupId) {
        e.preventDefault();
        const groupId = this.app.canvas.selectedGroupId;
        const group = this.app.diagram.groups.get(groupId);
        if (group) {
          this.app.diagram.removeGroup(groupId);
          const groupEl = document.querySelector(
            `[data-group-id="${groupId}"]`
          );
          if (groupEl) groupEl.remove();
          this.app.canvas.selectedGroupId = null;
          this.app.properties.clear();
          this.app.ui.showToast("Group deleted", "success");
        }
      } else if (this.app.canvas.selectedNodeId) {
        e.preventDefault();
        const id = this.app.canvas.selectedNodeId;
        this.app.removeNode(id);
        this.app.ui.showToast("Node deleted", "success");
      } else if (this.app.canvas.selectedConnectionId) {
        e.preventDefault();
        const id = this.app.canvas.selectedConnectionId;
        this.app.removeConnection(id);
        this.app.ui.showToast("Connection deleted", "success");
      }
    }

    // Undo (Cmd/Ctrl + Z)
    if (cmdKey && e.key === "z" && !e.shiftKey) {
      e.preventDefault();
      this.app.undo();
    }

    // Redo (Cmd/Ctrl + Shift + Z or Cmd/Ctrl + Y)
    if ((cmdKey && e.key === "z" && e.shiftKey) || (cmdKey && e.key === "y")) {
      e.preventDefault();
      this.app.redo();
    }

    // Save (Cmd/Ctrl + S)
    if (cmdKey && e.key === "s") {
      e.preventDefault();
      this.app.file.save();
    }

    // Open (Cmd/Ctrl + O)
    if (cmdKey && e.key === "o") {
      e.preventDefault();
      this.app.file.load();
    }

    // Duplicate (Cmd/Ctrl + D)
    if (cmdKey && e.key === "d") {
      const selectedIds = this.app.canvas.selectedNodeIds;
      if (selectedIds && selectedIds.size > 0) {
        e.preventDefault();
        if (this.app.duplicateSelectedNodes) {
          this.app.duplicateSelectedNodes();
        } else {
          const ids = Array.from(selectedIds);
          ids.forEach((id) => this.app.duplicateNode(id));
        }
      } else if (this.app.canvas.selectedNodeId) {
        e.preventDefault();
        this.app.duplicateNode(this.app.canvas.selectedNodeId);
      }
    }

    // Select All (Cmd/Ctrl + A)
    if (cmdKey && e.key === "a") {
      e.preventDefault();
      this.app.selectAll();
    }

    // New (Cmd/Ctrl + N)
    if (cmdKey && e.key === "n") {
      e.preventDefault();
      this.app.ui.confirmNewDiagram();
    }

    // Group selected nodes (Cmd/Ctrl + G)
    if (cmdKey && e.key === "g" && !e.shiftKey) {
      const selectedIds = this.app.canvas.selectedNodeIds;
      if (selectedIds && selectedIds.size >= 2) {
        e.preventDefault();
        this.app.createGroup(Array.from(selectedIds));
        this.app.ui.showToast(
          `Created group with ${selectedIds.size} nodes`,
          "success"
        );
      } else if (selectedIds && selectedIds.size === 1) {
        e.preventDefault();
        this.app.ui.showToast(
          "Select at least 2 nodes to create a group",
          "warning"
        );
      }
    }

    // Ungroup / Remove from group (Cmd/Ctrl + Shift + G)
    if (cmdKey && e.key === "G" && e.shiftKey) {
      const selectedIds = this.app.canvas.selectedNodeIds;
      if (selectedIds && selectedIds.size > 0) {
        e.preventDefault();

        let removedCount = 0;
        const groupsToUpdate = new Set();
        const nodesToRemove = Array.from(selectedIds);

        // Find and remove nodes from their groups
        this.app.diagram.groups.forEach((group, groupId) => {
          nodesToRemove.forEach((nodeId) => {
            if (group.nodeIds.includes(nodeId)) {
              group.nodeIds = group.nodeIds.filter((id) => id !== nodeId);
              groupsToUpdate.add(groupId);
              removedCount++;

              // Reset node title color
              const nodeEl = document.querySelector(
                `[data-node-id="${nodeId}"]`
              );
              if (nodeEl) {
                const titleEl = nodeEl.querySelector(".node-title");
                if (titleEl) {
                  titleEl.style.color = "";
                }
              }
            }
          });

          // If group is now empty, delete it
          if (group.nodeIds.length === 0) {
            this.app.diagram.removeGroup(groupId);
            const el = document.querySelector(`[data-group-id="${groupId}"]`);
            if (el) el.remove();
          }
        });

        // Update remaining groups
        groupsToUpdate.forEach((groupId) => {
          const group = this.app.diagram.groups.get(groupId);
          if (group && group.nodeIds.length > 0) {
            // Clean up any invalid node IDs
            group.nodeIds = group.nodeIds.filter((nodeId) =>
              this.app.diagram.nodes.has(nodeId)
            );
            this.app.canvas.renderGroup(group);
          }
        });

        if (removedCount > 0) {
          this.app.diagram.updateModified();
          this.app.ui.showToast(
            `Removed ${removedCount} node(s) from group(s)`,
            "success"
          );
        } else {
          this.app.ui.showToast("Selected nodes are not in any group", "info");
        }
      }
    }

    // Zoom controls
    if (cmdKey && (e.key === "+" || e.key === "=")) {
      e.preventDefault();
      this.app.canvas.zoomIn();
    }

    if (cmdKey && e.key === "-") {
      e.preventDefault();
      this.app.canvas.zoomOut();
    }

    if (cmdKey && e.key === "0") {
      e.preventDefault();
      this.app.canvas.setZoom(1);
    }

    // Fit to content (Cmd/Ctrl + F)
    if (cmdKey && e.key === "f") {
      e.preventDefault();
      this.app.canvas.fitToContent();
    }

    // Connect mode (C)
    if (e.key === "c" && !cmdKey && this.app.canvas.selectedNodeId) {
      e.preventDefault();
      this.app.ui.startConnecting(this.app.canvas.selectedNodeId);
    }

    // Escape - clear selection if any, otherwise switch to drag mode
    if (e.key === "Escape") {
      e.preventDefault();
      this.app.ui.closeContextMenu();
      this.app.ui.closeModal();

      // Cancel connecting mode
      if (this.app.canvas.isConnecting) {
        this.app.canvas.isConnecting = false;
        this.app.canvas.connectingSourceId = null;
        this.app.canvas.wrapper.classList.remove("connecting");
        document
          .querySelectorAll(".canvas-node.connecting-source")
          .forEach((el) => {
            el.classList.remove("connecting-source");
          });
        if (this.app.canvas.tempConnection) {
          this.app.canvas.tempConnection.remove();
          this.app.canvas.tempConnection = null;
        }
        return; // Don't do anything else after canceling connection
      }

      // Check if there's any selection
      const hasSelection =
        this.app.canvas.selectedNodeId ||
        this.app.canvas.selectedConnectionId ||
        this.app.canvas.selectedGroupId ||
        (this.app.canvas.selectedNodeIds &&
          this.app.canvas.selectedNodeIds.size > 0);

      if (hasSelection) {
        // Clear selection but keep current tool
        this.app.canvas.clearSelection();
      } else {
        // No selection - switch to drag mode
        const selectBtn = document.querySelector(
          '.tool-btn[data-mode="select"]'
        );
        if (selectBtn && !selectBtn.classList.contains("active")) {
          selectBtn.click();
        }
      }
    }

    // Space - center view without changing zoom
    if (e.key === " " && !cmdKey) {
      e.preventDefault();
      this.centerView();
    }

    // Number keys 1-6 for tool selection
    if (
      !cmdKey &&
      !e.shiftKey &&
      ["1", "2", "3", "4", "5", "6"].includes(e.key)
    ) {
      e.preventDefault();

      // Map: 1=Drag, 2=Select, 3=Ethernet, 4=Wireless, 5=Fiber, 6=USB
      const toolMap = {
        1: { mode: "select", type: null }, // Drag
        2: { mode: "marquee", type: null }, // Select
        3: { mode: "connect", type: "ethernet" }, // Ethernet
        4: { mode: "connect", type: "wireless" }, // Wireless/WiFi
        5: { mode: "connect", type: "fiber" }, // Fiber
        6: { mode: "connect", type: "usb" }, // USB
      };

      const tool = toolMap[e.key];
      if (tool) {
        let selector = `.tool-btn[data-mode="${tool.mode}"]`;
        if (tool.type) {
          selector += `[data-type="${tool.type}"]`;
        }

        const toolBtn = document.querySelector(selector);
        if (toolBtn) {
          toolBtn.click();
        }
      }
    }

    // Arrow keys to nudge selected node
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
      if (this.app.canvas.selectedNodeId) {
        e.preventDefault();
        const node = this.app.diagram.nodes.get(this.app.canvas.selectedNodeId);
        if (node) {
          const step = e.shiftKey ? 20 : 5;
          let x = node.x;
          let y = node.y;

          switch (e.key) {
            case "ArrowUp":
              y -= step;
              break;
            case "ArrowDown":
              y += step;
              break;
            case "ArrowLeft":
              x -= step;
              break;
            case "ArrowRight":
              x += step;
              break;
          }

          this.app.updateNodePosition(this.app.canvas.selectedNodeId, x, y);
          const element = document.querySelector(
            `[data-node-id="${this.app.canvas.selectedNodeId}"]`
          );
          if (element) {
            element.style.left = `${x}px`;
            element.style.top = `${y}px`;
          }
        }
      }
    }
    // Mode switching shortcuts
    if (e.key.toLowerCase() === "v") {
      const selectBtn = document.querySelector('.tool-btn[data-mode="select"]');
      if (selectBtn) selectBtn.click();
    }
    if (e.key.toLowerCase() === "c") {
      // Toggle to last active or first connect tool
      const activeConnect = document.querySelector(
        '.tool-btn[data-mode="connect"].active'
      );
      if (activeConnect) return; // Already active

      const firstConnect = document.querySelector(
        '.tool-btn[data-mode="connect"]'
      );
      if (firstConnect) firstConnect.click();
    }
  }

  centerView() {
    // Center view on all nodes without changing zoom
    const nodes = Array.from(this.app.diagram.nodes.values());
    if (nodes.length === 0) {
      this.app.canvas.panX = 0;
      this.app.canvas.panY = 0;
      this.app.canvas.scale = 1;
      this.app.canvas.applyTransform();
      return;
    }

    // Calculate bounds of all nodes
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    nodes.forEach((node) => {
      const w = node.width || 140;
      const h =
        node.expanded && node.category === "hardware" ? 280 : node.height || 90;

      minX = Math.min(minX, node.x);
      minY = Math.min(minY, node.y);
      maxX = Math.max(maxX, node.x + w);
      maxY = Math.max(maxY, node.y + h);
    });

    // Center of the nodes in world coordinates
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    // Viewport center
    const viewportWidth = this.app.canvas.container.offsetWidth;
    const viewportHeight = this.app.canvas.container.offsetHeight;
    const scale = this.app.canvas.scale;

    // Formula: screenPos = worldPos * scale + pan
    // We want: viewportCenter = worldCenter * scale + pan
    // Pan = viewportCenter - (worldCenter * scale)
    this.app.canvas.panX = viewportWidth / 2 - centerX * scale;
    this.app.canvas.panY = viewportHeight / 2 - centerY * scale;

    this.app.canvas.applyTransform();
    this.app.canvas.updateZoomDisplay();
  }
}
