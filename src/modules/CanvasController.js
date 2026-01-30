/**
 * CanvasController - Handles canvas interactions and rendering
 */

import { snapToGrid, clamp, throttle } from "./utils.js";
import { NodeRenderer } from "./NodeRenderer.js";

export class CanvasController {
  constructor(app) {
    this.app = app;
    this.nodeRenderer = new NodeRenderer();

    this.container = document.getElementById("canvas-container");
    this.wrapper = document.getElementById("canvas-wrapper");
    this.grid = document.getElementById("canvas-grid");
    this.nodesLayer = document.getElementById("nodes-layer");
    this.connectionsLayer = document.getElementById("connections-layer");
    this.overlay = document.getElementById("canvas-overlay");

    this.scale = 1;
    this.minScale = 0.25;
    this.maxScale = 3;
    this.panX = 0;
    this.panY = 0;

    this.isPanning = false;
    this.isDragging = false;
    this.isConnecting = false;
    this.isSelecting = false;

    this.selectedNodeId = null;
    this.selectedConnectionId = null;
    this.draggedNode = null;
    this.dragOffset = { x: 0, y: 0 };
    this.lastMousePos = { x: 0, y: 0 };

    this.gridSize = 20;
    this.snapEnabled = true;

    this.setupEventListeners();
  }

  setupEventListeners() {
    // Mouse events for canvas
    this.container.addEventListener("mousedown", (e) =>
      this.handleMouseDown(e)
    );
    this.container.addEventListener(
      "mousemove",
      throttle((e) => this.handleMouseMove(e), 16)
    );
    this.container.addEventListener("mouseup", (e) => this.handleMouseUp(e));
    this.container.addEventListener("mouseleave", (e) => this.handleMouseUp(e));

    // Wheel for zoom
    this.container.addEventListener("wheel", (e) => this.handleWheel(e), {
      passive: false,
    });

    // Touch events
    this.container.addEventListener(
      "touchstart",
      (e) => this.handleTouchStart(e),
      { passive: false }
    );
    this.container.addEventListener(
      "touchmove",
      (e) => this.handleTouchMove(e),
      { passive: false }
    );
    this.container.addEventListener("touchend", (e) => this.handleTouchEnd(e));

    // Double click to edit
    this.nodesLayer.addEventListener("dblclick", (e) =>
      this.handleDoubleClick(e)
    );
  }

  handleMouseDown(e) {
    const nodeElement = e.target.closest(".canvas-node");
    const portElement = e.target.closest(".node-port");
    const connectionElement = e.target.closest(".connection");

    // Handle port click for connecting
    if (portElement) {
      e.stopPropagation();
      const nodeId = portElement.closest(".canvas-node").dataset.nodeId;
      this.startConnecting(nodeId, e);
      return;
    }

    // Handle inner delete buttons (OS/Apps)
    const deleteBtn = e.target.closest(".node-item-delete");
    if (deleteBtn) {
      e.stopPropagation();
      const nodeElement = deleteBtn.closest(".canvas-node");
      if (!nodeElement) return;

      const nodeId = nodeElement.dataset.nodeId;
      const action = deleteBtn.dataset.action;

      if (action === "delete-app") {
        const appType = deleteBtn.dataset.appId;
        const osEnvGroup = deleteBtn.closest(".os-env-group");
        const osEnvId = osEnvGroup ? osEnvGroup.dataset.osEnvId : null;
        this.app.removeApplication(nodeId, appType, osEnvId);
      } else if (action === "delete-os") {
        const osEnvId = deleteBtn.dataset.osId;
        this.app.removeOSEnvironment(nodeId, osEnvId);
      }
      return;
    }

    // Handle node selection and interaction
    if (nodeElement) {
      e.stopPropagation();
      const nodeId = nodeElement.dataset.nodeId;

      // RIGHT CLICK: Always show context menu regardless of mode
      if (e.button === 2) {
        this.app.selectNode(nodeId);
        this.app.ui.showContextMenu(e.clientX, e.clientY, nodeId);
        return;
      }

      // CONNECT MODE: Click any node to start a connection
      if (this.app.editMode === "connect") {
        this.startConnecting(nodeId, e);
        return;
      }

      // SELECT MODE: Drag the node
      this.app.selectNode(nodeId);
      this.startDragging(nodeElement, e);
      return;
    }

    // Handle connection selection
    if (connectionElement) {
      e.stopPropagation();
      const connectionId = connectionElement.dataset.connectionId;

      if (e.button === 2) {
        this.app.selectConnection(connectionId);
        this.app.ui.showContextMenu(e.clientX, e.clientY, null, connectionId);
        return;
      }

      this.app.selectConnection(connectionId);
      return;
    }

    // Start panning on middle mouse or empty area
    if (
      e.button === 1 ||
      (e.button === 0 && !e.target.closest(".canvas-node"))
    ) {
      this.clearSelection();
      this.startPanning(e);
    }
  }

  handleMouseMove(e) {
    // Update coordinates display
    const pos = this.screenToCanvas(e.clientX, e.clientY);
    document.getElementById("status-coords").textContent = `X: ${Math.round(
      pos.x
    )}, Y: ${Math.round(pos.y)}`;

    if (this.isPanning) {
      this.updatePanning(e);
    } else if (this.isDragging && this.draggedNode) {
      this.updateDragging(e);
    } else if (this.isConnecting) {
      this.updateConnecting(e);
    } else if (this.isSelecting) {
      this.updateSelection(e);
    }
  }

  handleMouseUp(e) {
    if (this.isPanning) {
      this.stopPanning();
    } else if (this.isDragging) {
      this.stopDragging();
    } else if (this.isConnecting) {
      this.finishConnecting(e);
    } else if (this.isSelecting) {
      this.finishSelection();
    }
  }

  handleWheel(e) {
    e.preventDefault();

    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newScale = clamp(this.scale + delta, this.minScale, this.maxScale);

    // Zoom towards mouse position
    const rect = this.container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const scaleRatio = newScale / this.scale;

    this.panX = mouseX - (mouseX - this.panX) * scaleRatio;
    this.panY = mouseY - (mouseY - this.panY) * scaleRatio;

    this.scale = newScale;
    this.applyTransform();
    this.updateZoomDisplay();
  }

  handleTouchStart(e) {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const fakeEvent = {
        clientX: touch.clientX,
        clientY: touch.clientY,
        button: 0,
      };
      this.handleMouseDown(fakeEvent);
    }
  }

  handleTouchMove(e) {
    if (e.touches.length === 1) {
      e.preventDefault();
      const touch = e.touches[0];
      const fakeEvent = { clientX: touch.clientX, clientY: touch.clientY };
      this.handleMouseMove(fakeEvent);
    }
  }

  handleTouchEnd(e) {
    this.handleMouseUp({});
  }

  handleDoubleClick(e) {
    const nodeElement = e.target.closest(".canvas-node");
    if (nodeElement) {
      const nodeId = nodeElement.dataset.nodeId;
      const node = this.app.diagram.nodes.get(nodeId);
      if (node) {
        this.app.ui.showNodeEditor(node);
      }
    }
  }

  // Panning
  startPanning(e) {
    this.isPanning = true;
    this.wrapper.classList.add("panning");
    this.lastMousePos = { x: e.clientX, y: e.clientY };
  }

  updatePanning(e) {
    const dx = e.clientX - this.lastMousePos.x;
    const dy = e.clientY - this.lastMousePos.y;

    this.panX += dx;
    this.panY += dy;

    this.lastMousePos = { x: e.clientX, y: e.clientY };
    this.applyTransform();
  }

  stopPanning() {
    this.isPanning = false;
    this.wrapper.classList.remove("panning");
  }

  // Dragging nodes
  startDragging(element, e) {
    this.isDragging = true;
    this.draggedNode = element;

    const nodeId = element.dataset.nodeId;
    const node = this.app.diagram.nodes.get(nodeId);

    const canvasPos = this.screenToCanvas(e.clientX, e.clientY);
    this.dragOffset = {
      x: canvasPos.x - node.x,
      y: canvasPos.y - node.y,
    };
  }

  updateDragging(e) {
    if (!this.draggedNode) return;

    const nodeId = this.draggedNode.dataset.nodeId;
    const canvasPos = this.screenToCanvas(e.clientX, e.clientY);

    let x = canvasPos.x - this.dragOffset.x;
    let y = canvasPos.y - this.dragOffset.y;

    if (this.snapEnabled) {
      x = snapToGrid(x, this.gridSize);
      y = snapToGrid(y, this.gridSize);
    }

    // Update node position in DOM
    this.draggedNode.style.left = `${x}px`;
    this.draggedNode.style.top = `${y}px`;

    // Update diagram model and connections
    this.app.updateNodePosition(nodeId, x, y);
  }

  stopDragging() {
    if (this.isDragging && this.draggedNode) {
      const nodeId = this.draggedNode.dataset.nodeId;
      const node = this.app.diagram.nodes.get(nodeId);

      // Add to history
      this.app.history.push({
        type: "move-node",
        nodeId: nodeId,
        data: { x: node.x, y: node.y },
      });
    }

    this.isDragging = false;
    this.draggedNode = null;
  }

  // Connecting
  startConnecting(nodeId, e) {
    this.isConnecting = true;
    this.connectingSourceId = nodeId;
    this.wrapper.classList.add("connecting");

    // Highlight source node
    const sourceElement = document.querySelector(`[data-node-id="${nodeId}"]`);
    if (sourceElement) {
      sourceElement.classList.add("connecting-source");
    }

    // Create temporary connection line
    const sourceCenter = this.app.diagram.getNodeCenter(nodeId);
    this.tempConnection = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );
    this.tempConnection.classList.add(
      "connection-temp",
      this.app.activeConnectionType
    );
    this.connectionsLayer.appendChild(this.tempConnection);

    if (e) this.updateConnecting(e);
  }

  updateConnecting(e) {
    if (!this.tempConnection) return;

    const sourceCenter = this.app.diagram.getNodeCenter(
      this.connectingSourceId
    );
    const canvasPos = this.screenToCanvas(e.clientX, e.clientY);

    const path = `M ${sourceCenter.x} ${sourceCenter.y} L ${canvasPos.x} ${canvasPos.y}`;
    this.tempConnection.setAttribute("d", path);

    // Highlight potential targets
    this.highlightPotentialTargets(e);
  }

  highlightPotentialTargets(e) {
    // Remove previous highlights
    document.querySelectorAll(".canvas-node.drop-target").forEach((el) => {
      el.classList.remove("drop-target");
    });

    const target = e.target.closest(".canvas-node");
    if (target && target.dataset.nodeId !== this.connectingSourceId) {
      target.classList.add("drop-target");
    }
  }

  finishConnecting(e) {
    if (!this.isConnecting) return;

    const target = e.target.closest(".canvas-node");
    if (target && target.dataset.nodeId !== this.connectingSourceId) {
      const targetId = target.dataset.nodeId;
      this.app.addConnection(this.connectingSourceId, targetId);
      this.app.ui.showToast("Connection created", "success");
    }

    // Cleanup
    if (this.tempConnection) {
      this.tempConnection.remove();
      this.tempConnection = null;
    }

    document
      .querySelectorAll(".canvas-node.connecting-source")
      .forEach((el) => {
        el.classList.remove("connecting-source");
      });
    document.querySelectorAll(".canvas-node.drop-target").forEach((el) => {
      el.classList.remove("drop-target");
    });

    this.isConnecting = false;
    this.connectingSourceId = null;
    this.wrapper.classList.remove("connecting");
  }

  // Selection
  clearSelection() {
    if (this.selectedNodeId) {
      const element = document.querySelector(
        `[data-node-id="${this.selectedNodeId}"]`
      );
      if (element) element.classList.remove("selected");
    }
    if (this.selectedConnectionId) {
      const element = document.querySelector(
        `[data-connection-id="${this.selectedConnectionId}"]`
      );
      if (element) element.classList.remove("selected");
    }

    this.selectedNodeId = null;
    this.selectedConnectionId = null;
    this.app.properties.clear();
  }

  // Transform
  applyTransform() {
    const centerX = this.container.offsetWidth / 2;
    const centerY = this.container.offsetHeight / 2;

    this.wrapper.style.transform = `
      translate(${this.panX}px, ${this.panY}px)
      scale(${this.scale})
    `;
  }

  updateZoomDisplay() {
    document.getElementById("zoom-level").textContent = `${Math.round(
      this.scale * 100
    )}%`;
  }

  // Coordinate conversion - accounts for 5000px offset in nodes layer
  screenToCanvas(screenX, screenY) {
    const rect = this.container.getBoundingClientRect();
    const x = (screenX - rect.left - this.panX) / this.scale + 5000;
    const y = (screenY - rect.top - this.panY) / this.scale + 5000;
    return { x, y };
  }

  canvasToScreen(canvasX, canvasY) {
    const rect = this.container.getBoundingClientRect();
    const x = (canvasX - 5000) * this.scale + this.panX + rect.left;
    const y = (canvasY - 5000) * this.scale + this.panY + rect.top;
    return { x, y };
  }

  // Grid drawing - now handled by CSS background
  drawGrid() {
    // Grid is now CSS-based on the container for infinite appearance
  }

  // Zoom controls
  zoomIn() {
    const newScale = clamp(this.scale + 0.1, this.minScale, this.maxScale);
    this.setZoom(newScale);
  }

  zoomOut() {
    const newScale = clamp(this.scale - 0.1, this.minScale, this.maxScale);
    this.setZoom(newScale);
  }

  setZoom(scale) {
    const centerX = this.container.offsetWidth / 2;
    const centerY = this.container.offsetHeight / 2;

    const scaleRatio = scale / this.scale;

    this.panX = centerX - (centerX - this.panX) * scaleRatio;
    this.panY = centerY - (centerY - this.panY) * scaleRatio;

    this.scale = scale;
    this.applyTransform();
    this.updateZoomDisplay();
  }

  handleDoubleClick(e) {
    const nodeElement = e.target.closest(".canvas-node");
    if (nodeElement) {
      const nodeId = nodeElement.dataset.nodeId;
      const node = this.app.diagram.nodes.get(nodeId);

      if (node) {
        // Toggle expanded if hardware node
        if (node.category === "hardware") {
          node.expanded = !node.expanded;

          // Update height and class in DOM
          const nodeType = NODE_TYPES[node.type] || NODE_TYPES.server;
          const apps = node.applications || [];
          const height =
            node.expanded && apps.length > 0
              ? nodeType.expandedHeight || 280
              : nodeType.defaultHeight || 160;

          nodeElement.style.minHeight = `${height}px`;
          nodeElement.classList.toggle("expanded", node.expanded);

          this.app.nodeRenderer.updateNodeElement(nodeId, node);
          return;
        }
        this.app.ui.showNodeEditor(node);
      }
    }
  }

  fitToContent() {
    if (this.app.diagram.nodes.size === 0) {
      // If no nodes, reset pan and zoom
      this.panX = 0;
      this.panY = 0;
      this.scale = 1;
      this.applyTransform();
      this.updateZoomDisplay();
      return;
    }

    let minX = Infinity,
      minY = Infinity;
    let maxX = -Infinity,
      maxY = -Infinity;

    this.app.diagram.nodes.forEach((node) => {
      // Account for coordinate offset if your nodes layer is at -5000
      const x = node.x - 5000;
      const y = node.y - 5000;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + node.width);

      const nodeType = NODE_TYPES[node.type] || NODE_TYPES.server;
      const height = node.expanded
        ? nodeType.expandedHeight || node.height
        : nodeType.defaultHeight || node.height;
      maxY = Math.max(maxY, y + height);
    });

    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;

    // Add some padding
    const padding = 60;
    const paddedWidth = contentWidth + padding * 2;
    const paddedHeight = contentHeight + padding * 2;

    const containerWidth = this.container.offsetWidth;
    const containerHeight = this.container.offsetHeight;

    const scaleX = containerWidth / paddedWidth;
    const scaleY = containerHeight / paddedHeight;
    const newScale = clamp(
      Math.min(scaleX, scaleY, 1.5), // Don't zoom in too much
      this.minScale,
      this.maxScale
    );

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    this.scale = newScale;
    this.panX = containerWidth / 2 - centerX * this.scale;
    this.panY = containerHeight / 2 - centerY * this.scale;

    this.applyTransform();
    this.updateZoomDisplay();
  }

  handleResize() {
    this.drawGrid();
  }

  // Render a node on the canvas
  renderNode(node) {
    const html = this.nodeRenderer.render(node);
    this.nodesLayer.insertAdjacentHTML("beforeend", html);
  }
}
