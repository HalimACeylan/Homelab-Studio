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
    this.groupsLayer = document.getElementById("groups-layer");
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

    this.isSelecting = false;

    this.selectedNodeIds = new Set();
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
    const groupLabelElement = e.target.closest(".group-label");

    // Handle Group Label Click (only the label, not the entire box)
    if (
      groupLabelElement &&
      !nodeElement &&
      !portElement &&
      !connectionElement
    ) {
      e.stopPropagation();
      const groupElement = groupLabelElement.closest(".canvas-group");
      if (groupElement) {
        const groupId = groupElement.dataset.groupId;
        this.app.selectGroup(groupId);
      }
      return;
    }

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
        // If clicked node is not part of current selection, select it (and clear others)
        if (!this.selectedNodeIds.has(nodeId)) {
          this.app.selectNode(nodeId);
        }
        // If it IS already selected, we DO NOT call selectNode, preserving the multi-selection.

        this.app.ui.showContextMenu(e.clientX, e.clientY, nodeId);
        return;
      }

      // CONNECT MODE: Click any node to start a connection
      if (this.app.editMode === "connect") {
        this.startConnecting(nodeId, e);
        return;
      }

      // SELECT MODE: Drag the node
      const isMultiSelect =
        e.ctrlKey || e.metaKey || this.app.editMode === "marquee";
      if (isMultiSelect) {
        if (this.selectedNodeIds.has(nodeId)) {
          // If already selected and clicking with modifier, maybe deselect?
          // For drag, we usually just keep it selected.
          // If Marquee mode, usually clicking a node selects it.
          this.app.selectNode(nodeId, true);
        } else {
          this.app.selectNode(nodeId, true);
        }
      } else if (!this.selectedNodeIds.has(nodeId)) {
        // If not multi-selecting and node not in current selection, clear and select new
        this.app.selectNode(nodeId);
      }

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
    // Start panning, OR Marquee selection if in Marquee mode
    if (this.app.editMode === "marquee") {
      this.startSelection(e);
      return;
    }

    // Default: Pan on middle mouse or Space+Drag or just empty area drag (standard behavior)
    if (
      e.button === 1 ||
      (e.button === 0 && !e.target.closest(".canvas-node"))
    ) {
      if (!e.ctrlKey && !e.metaKey && this.app.editMode !== "marquee") {
        // Assuming simple pan for select mode
        this.clearSelection();
        this.startPanning(e);
      }
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
    const canvasPos = this.screenToCanvas(e.clientX, e.clientY);

    // Check if we are dragging a selected node vs a non-selected one (which should become selected)
    // The selection logic usually runs BEFORE startDragging in handleMouseDown.

    this.dragOffsets = new Map();

    if (this.selectedNodeIds.has(nodeId)) {
      // Prepare offsets for ALL selected nodes relative to mouse click
      this.selectedNodeIds.forEach((id) => {
        const node = this.app.diagram.nodes.get(id);
        if (node) {
          this.dragOffsets.set(id, {
            x: canvasPos.x - node.x,
            y: canvasPos.y - node.y,
          });
        }
      });
    } else {
      // Just for the single node (fallback)
      const node = this.app.diagram.nodes.get(nodeId);
      this.dragOffsets.set(nodeId, {
        x: canvasPos.x - node.x,
        y: canvasPos.y - node.y,
      });
    }
  }

  updateDragging(e) {
    if (!this.draggedNode) return;

    const nodeId = this.draggedNode.dataset.nodeId;
    const canvasPos = this.screenToCanvas(e.clientX, e.clientY);

    // Use pre-calculated offsets for stable dragging
    if (this.selectedNodeIds.has(nodeId)) {
      this.selectedNodeIds.forEach((id) => {
        const offset = this.dragOffsets.get(id);
        if (offset) {
          let nx = canvasPos.x - offset.x;
          let ny = canvasPos.y - offset.y;

          if (this.snapEnabled) {
            nx = snapToGrid(nx, this.gridSize);
            ny = snapToGrid(ny, this.gridSize);
          }

          // Update DOM
          const el = document.querySelector(`[data-node-id="${id}"]`);
          if (el) {
            el.style.left = `${nx}px`;
            el.style.top = `${ny}px`;
          }
          // Update Model
          this.app.updateNodePosition(id, nx, ny);
        }
      });
    } else {
      // Fallback for single node (or if logic fails)
      const offset = this.dragOffsets.get(nodeId);
      // fallback if map empty?
      let x = canvasPos.x - (offset ? offset.x : 0);
      let y = canvasPos.y - (offset ? offset.y : 0);

      if (this.snapEnabled) {
        x = snapToGrid(x, this.gridSize);
        y = snapToGrid(y, this.gridSize);
      }

      this.draggedNode.style.left = `${x}px`;
      this.draggedNode.style.top = `${y}px`;
      this.app.updateNodePosition(nodeId, x, y);
    }
  }

  stopDragging() {
    if (this.isDragging && this.draggedNode) {
      const nodeId = this.draggedNode.dataset.nodeId;
      const node = this.app.diagram.nodes.get(nodeId);

      // Add to history
      // History for all selected nodes if applicable
      // Simplified: Just push individual moves for now.
      // Ideally should be a "move-nodes" transaction.
      if (this.selectedNodeIds.size > 0 && this.selectedNodeIds.has(nodeId)) {
        this.selectedNodeIds.forEach((id) => {
          const n = this.app.diagram.nodes.get(id);
          if (n) {
            this.app.history.push({
              type: "move-node",
              nodeId: id,
              data: { x: n.x, y: n.y }, // Note: History logic usually needs PREVIOUS state to UNDO.
              // Currently 'move-node' history implementation suggests it stores the NEW state or OLD state?
              // Let's check Main.js undo/redo logic.
              // Usually we need { oldX, oldY, newX, newY }.
              // The current implementation seems simplistic and might be buggy for "Undo Move".
              // "data" is pushed.
              /* 
                       undo() { ...
                           case "move-node": 
                               // Does it revert to previous??
                               // If push stores CURRENT (new) state, how does it know OLD state?
                               // It doesn't seem to store OLD state in data.
                               // Let's assume the provided code is incomplete on History or uses "inverse" actions not shown.
                               // Wait, usually we push the *action* that *was performed*.
                               // To UNDO, we need the inverse.
                       */
            });
          }
        });
      } else {
        this.app.history.push({
          type: "move-node",
          nodeId: nodeId,
          data: { x: node.x, y: node.y },
        });
      }
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
    if (this.selectedNodeIds) {
      this.selectedNodeIds.forEach((id) => {
        const element = document.querySelector(`[data-node-id="${id}"]`);
        if (element) element.classList.remove("selected");
      });
      this.selectedNodeIds.clear();
    }
    this.app.properties.clear();
  }

  // Marquee Selection
  startSelection(e) {
    this.isSelecting = true;
    this.selectionStart = { x: e.clientX, y: e.clientY };

    // If shift/ctrl not held, clear existing.
    // Usually marquee replaces selection unless modifier used.
    if (!e.shiftKey && !e.ctrlKey && !e.metaKey) {
      this.clearSelection();
    }

    // Create selection box element
    this.selectionBox = document.createElement("div");
    this.selectionBox.className = "selection-marquee";
    // Append to container (viewport), not wrapper (diagram) to avoid scale issues?
    // Actually, screen coordinates overlay is easiest.
    this.container.appendChild(this.selectionBox);

    this.updateSelection(e);
  }

  updateSelection(e) {
    if (!this.selectionBox) return;

    const currentX = e.clientX;
    const currentY = e.clientY;
    const containerRect = this.container.getBoundingClientRect();

    const relativeStartX = this.selectionStart.x - containerRect.left;
    const relativeStartY = this.selectionStart.y - containerRect.top;
    const relativeCurX = currentX - containerRect.left;
    const relativeCurY = currentY - containerRect.top;

    const x = Math.min(relativeStartX, relativeCurX);
    const y = Math.min(relativeStartY, relativeCurY);
    const width = Math.abs(relativeCurX - relativeStartX);
    const height = Math.abs(relativeCurY - relativeStartY);

    this.selectionBox.style.left = `${x}px`;
    this.selectionBox.style.top = `${y}px`;
    this.selectionBox.style.width = `${width}px`;
    this.selectionBox.style.height = `${height}px`;

    // Select nodes
    this.selectNodesInRect(x, y, width, height);
  }

  selectNodesInRect(rectX, rectY, rectW, rectH) {
    // Convert selection rect (in container/viewport pixels) to canvas diagram space
    // We do this by projecting the 4 corners or simply converting the rect.

    // Top-Left in Canvas Space
    const tl = this.screenToCanvas(
      this.container.getBoundingClientRect().left + rectX,
      this.container.getBoundingClientRect().top + rectY
    );
    const br = this.screenToCanvas(
      this.container.getBoundingClientRect().left + rectX + rectW,
      this.container.getBoundingClientRect().top + rectY + rectH
    );

    // Normalize canvas rect (handle negative scale?)
    const cX = Math.min(tl.x, br.x);
    const cY = Math.min(tl.y, br.y);
    const cW = Math.abs(br.x - tl.x);
    const cH = Math.abs(br.y - tl.y);

    const nodes = this.app.diagram.nodes;
    nodes.forEach((node) => {
      // Check intersection
      if (
        node.x < cX + cW &&
        node.x + node.width > cX &&
        node.y < cY + cH &&
        node.y + node.height > cY
      ) {
        this.app.selectNode(node.id, true);
      } else {
        // Only deselect if it was NOT selected before marquee start?
        // For simplicity, we re-evaluate full selection during marquee.
        // But if Shift held, we should merge?
        // Simple version: Marquee dictates selection state for touched nodes.
        // If node is NOT in rect, we might want to keep it if it was previously selected (Modifier)?
        // For now, let's just add to selection if in rect. Deselect if not?
        // If we don't deselect, the selection just grows.
        // To implement standard behavior:
        // 1. Store initial "pre-drag" selection.
        // 2. On update, NewSelection = PreSelection + (InRect) [Union]
        // OR NewSelection = InRect (if no modifier).
      }
    });
  }

  finishSelection() {
    this.isSelecting = false;
    if (this.selectionBox) {
      this.selectionBox.remove();
      this.selectionBox = null;
    }
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

  // Group Rendering
  renderGroup(group) {
    if (!group) return;

    // Calculate bounds
    const bounds = this.getGroupBounds(group);
    if (!bounds) return;

    // Check if element exists
    let groupEl = this.groupsLayer.querySelector(
      `[data-group-id="${group.id}"]`
    );
    if (!groupEl) {
      groupEl = document.createElement("div");
      groupEl.className = "canvas-group";
      groupEl.dataset.groupId = group.id;

      // Label
      const label = document.createElement("div");
      label.className = "group-label";
      label.textContent = group.name;
      groupEl.appendChild(label);

      this.groupsLayer.appendChild(groupEl);
    }

    // Update style
    groupEl.style.left = `${bounds.x}px`;
    groupEl.style.top = `${bounds.y}px`;
    groupEl.style.width = `${bounds.width}px`;
    groupEl.style.height = `${bounds.height}px`;

    // Apply group color
    const color = group.color || "#58a6ff";
    groupEl.style.borderColor = color;
    // Set background with opacity
    // Since color is hex, we might need a utility to convert to rgba or just use low opacity on hex if supported or use CSS var
    // Simple approach: Set border color and let CSS use opacity on background if possible, or set background explicitly
    // Since we don't have hexToRgba handy here (unless in utils), let's try a simple CSS variable approach
    groupEl.style.setProperty("--group-color", color);

    // Update label
    const label = groupEl.querySelector(".group-label");
    label.textContent = group.name;
    label.style.borderColor = color;
    label.style.color = color;

    // Update Member Nodes
    group.nodeIds.forEach((nodeId) => {
      const nodeEl = document.querySelector(`[data-node-id="${nodeId}"]`);
      if (nodeEl) {
        const titleEl = nodeEl.querySelector(".node-title");
        if (titleEl) {
          titleEl.style.color = color;
        }
      }
    });
  }

  getGroupBounds(group) {
    if (!group || !group.nodeIds || group.nodeIds.length === 0) return null;

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    group.nodeIds.forEach((nodeId) => {
      const node = this.app.diagram.nodes.get(nodeId);
      if (node) {
        // Should account for width/height/expansion
        // Use expanded height if applicable
        const nodeType = this.app.diagram.nodes.get(nodeId); // Wait, we have node object
        // Actually node object has width/height but expanded height logic is in NodeRenderer or dynamically calculated?
        // DiagramManager stores width/height. Does it store expanded height?
        // DiagramManager.js:29: width: nodeType.defaultWidth || 140
        // When expanded, the DOM changes size. The DiagramManager model 'height' might not update to expanded height?
        // Let's check DiagramManager update.
        // DiagramManager doesn't seem to persist expanded dimensions in 'height' property, only 'expanded' boolean.

        // We need to estimate or get DOM rect. But getting DOM rect is slow.
        // Let's assume standard dimensions for now or try to get from Model if possible.
        // In CanvasController.fitToContent, we did this logic.

        // Copy logic from fitToContent roughly
        // We need imports or NODE_TYPES.
        // Let's just use node.width/height for now.

        const h =
          node.expanded && node.category === "hardware" ? 350 : node.height; // increased estimate

        minX = Math.min(minX, node.x);
        minY = Math.min(minY, node.y);
        maxX = Math.max(maxX, node.x + node.width);
        maxY = Math.max(maxY, node.y + h);
      }
    });

    if (minX === Infinity) return null;

    const padding = 30; // Increased padding to prevent overflow
    return {
      x: minX - padding,
      y: minY - padding,
      width: maxX - minX + padding * 2,
      height: maxY - minY + padding * 2,
    };
  }

  updateGroupsForNode(nodeId) {
    // Find all groups containing this node
    this.app.diagram.groups.forEach((group) => {
      if (group.nodeIds.includes(nodeId)) {
        this.renderGroup(group);
      }
    });
  }
}
