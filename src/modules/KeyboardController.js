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
      if (this.app.canvas.selectedNodeId) {
        e.preventDefault();
        this.app.removeNode(this.app.canvas.selectedNodeId);
        this.app.ui.showToast("Node deleted", "success");
      } else if (this.app.canvas.selectedConnectionId) {
        e.preventDefault();
        this.app.removeConnection(this.app.canvas.selectedConnectionId);
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
      if (this.app.canvas.selectedNodeId) {
        e.preventDefault();
        this.app.duplicateNode(this.app.canvas.selectedNodeId);
      }
    }

    // Select All (Cmd/Ctrl + A)
    if (cmdKey && e.key === "a") {
      e.preventDefault();
      // Select all nodes (could be implemented)
      this.app.ui.showToast("Select all is not yet implemented", "info");
    }

    // New (Cmd/Ctrl + N)
    if (cmdKey && e.key === "n") {
      e.preventDefault();
      this.app.ui.confirmNewDiagram();
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

    // Escape - cancel current action
    if (e.key === "Escape") {
      e.preventDefault();
      this.app.canvas.clearSelection();
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
      }
    }

    // Space - center and fit nodes on screen
    if (e.key === " " && !cmdKey) {
      e.preventDefault();
      this.app.canvas.fitToContent();
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
}
