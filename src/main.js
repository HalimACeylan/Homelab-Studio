/**
 * HomeLab Studio - Visual Infrastructure Editor
 * Main Application Module
 */

import "./style.css";
import { DiagramManager } from "./modules/DiagramManager.js";
import { CanvasController } from "./modules/CanvasController.js";
import { PaletteController } from "./modules/PaletteController.js";
import { PropertiesPanel } from "./modules/PropertiesPanel.js";
import { ConnectionManager } from "./modules/ConnectionManager.js";
import { HistoryManager } from "./modules/HistoryManager.js";
import { UIController } from "./modules/UIController.js";
import { FileManager } from "./modules/FileManager.js";
import { KeyboardController } from "./modules/KeyboardController.js";
import { NodeRenderer } from "./modules/NodeRenderer.js";

class HomelabStudio {
  constructor() {
    this.init();
  }

  async init() {
    // Initialize core modules
    this.history = new HistoryManager();
    this.diagram = new DiagramManager();
    this.nodeRenderer = new NodeRenderer();
    this.activeConnectionType = "ethernet";
    this.editMode = "select"; // 'select' or 'connect'
    this.canvas = new CanvasController(this);
    this.connections = new ConnectionManager(this);
    this.palette = new PaletteController(this);
    this.properties = new PropertiesPanel(this);
    this.ui = new UIController(this);
    this.file = new FileManager(this);
    this.keyboard = new KeyboardController(this);

    // Setup event listeners
    this.setupEventListeners();

    // Initialize theme
    this.initTheme();

    // Draw initial grid
    this.canvas.drawGrid();

    // Update status
    this.updateStatus("Ready to design your homelab");

    console.log("🏠 HomeLab Studio initialized");
  }

  initTheme() {
    const savedTheme = localStorage.getItem("homelab-theme") || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);
  }

  setupEventListeners() {
    // Window resize
    window.addEventListener("resize", () => {
      this.canvas.handleResize();
    });

    // Prevent context menu on canvas
    document
      .getElementById("canvas-container")
      .addEventListener("contextmenu", (e) => {
        e.preventDefault();
      });

    // Global click to close menus
    document.addEventListener("click", (e) => {
      this.ui.closeContextMenu();
      if (!e.target.closest(".modal") && !e.target.closest(".modal-overlay")) {
        // Don't close modal on outside click
      }
    });
  }

  updateStatus(message) {
    document.getElementById("status-message").textContent = message;
  }

  updateNodeCount() {
    document.getElementById(
      "status-nodes"
    ).textContent = `Nodes: ${this.diagram.nodes.size}`;
  }

  updateConnectionCount() {
    document.getElementById(
      "status-connections"
    ).textContent = `Connections: ${this.diagram.connections.size}`;
  }

  // Public API for adding nodes
  addNode(type, x, y, properties = {}) {
    const node = this.diagram.createNode(type, x, y, properties);
    this.canvas.renderNode(node);
    this.history.push({
      type: "add-node",
      nodeId: node.id,
      data: { ...node },
    });
    this.updateNodeCount();
    return node;
  }

  // Public API for removing nodes
  removeNode(nodeId) {
    const node = this.diagram.nodes.get(nodeId);
    if (!node) return;

    // Remove connected connections
    const connectionsToRemove = [];
    this.diagram.connections.forEach((conn, id) => {
      if (conn.sourceId === nodeId || conn.targetId === nodeId) {
        connectionsToRemove.push(id);
      }
    });

    connectionsToRemove.forEach((id) => {
      this.removeConnection(id);
    });

    // Remove node from diagram
    this.diagram.removeNode(nodeId);

    // Remove from canvas
    const element = document.querySelector(`[data-node-id="${nodeId}"]`);
    if (element) element.remove();

    this.history.push({
      type: "remove-node",
      nodeId: nodeId,
      data: { ...node },
    });

    this.updateNodeCount();
    this.properties.clear();
  }

  removeSelectedNodes() {
    const selectedIds = Array.from(this.canvas.selectedNodeIds);
    if (selectedIds.length === 0) return;

    selectedIds.forEach((id) => {
      this.removeNode(id);
    });

    this.canvas.clearSelection();
  }

  removeApplication(nodeId, appType, osEnvId = null) {
    const success = this.diagram.removeApplicationFromNode(
      nodeId,
      appType,
      osEnvId
    );
    if (success) {
      const node = this.diagram.nodes.get(nodeId);
      this.nodeRenderer.updateNodeElement(nodeId, node);
      this.ui.showToast(`Removed ${appType}`, "success");
    }
  }

  removeOSEnvironment(nodeId, osEnvId) {
    const success = this.diagram.removeOSEnvironment(nodeId, osEnvId);
    if (success) {
      const node = this.diagram.nodes.get(nodeId);
      this.nodeRenderer.updateNodeElement(nodeId, node);
      this.ui.showToast(`Removed environment`, "success");
    }
  }

  // Public API for adding connections
  addConnection(sourceId, targetId, properties = {}) {
    const connection = this.diagram.createConnection(sourceId, targetId, {
      type: this.activeConnectionType,
      ...properties,
    });
    this.connections.renderConnection(connection);
    this.history.push({
      type: "add-connection",
      connectionId: connection.id,
      data: { ...connection },
    });
    this.updateConnectionCount();
    return connection;
  }

  // Public API for removing connections
  removeConnection(connectionId) {
    const connection = this.diagram.connections.get(connectionId);
    if (!connection) return;

    this.diagram.removeConnection(connectionId);

    const element = document.querySelector(
      `[data-connection-id="${connectionId}"]`
    );
    if (element) element.remove();

    this.history.push({
      type: "remove-connection",
      connectionId: connectionId,
      data: { ...connection },
    });

    this.updateConnectionCount();
  }

  // Update node position
  updateNodePosition(nodeId, x, y) {
    this.diagram.updateNode(nodeId, { x, y });
    this.connections.updateConnectionsForNode(nodeId);

    // Update affected groups
    this.canvas.updateGroupsForNode(nodeId);
  }

  createGroup(nodeIds) {
    if (!nodeIds || nodeIds.length < 2) return;

    const group = this.diagram.createGroup(nodeIds, "Network Group");
    this.canvas.renderGroup(group);
    this.ui.showToast("Network Group created", "success");

    this.history.push({
      type: "create-group",
      id: group.id,
      data: { ...group },
    });
  }

  // Select node
  selectNode(nodeId, addToSelection = false) {
    if (!addToSelection) {
      this.canvas.clearSelection();
    }

    if (this.canvas.selectedNodeIds) {
      this.canvas.selectedNodeIds.add(nodeId);
    } else {
      // Fallback/Migration if property not updated yet
      this.canvas.selectedNodeIds = new Set([nodeId]);
    }
    this.canvas.selectedNodeId = nodeId; // Keep for backward compatibility/single selection focus

    const element = document.querySelector(`[data-node-id="${nodeId}"]`);
    if (element) {
      element.classList.add("selected");
    }

    const node = this.diagram.nodes.get(nodeId);
    if (node) {
      this.properties.showNodeProperties(node);
    }
  }

  selectAllNodes() {
    this.canvas.clearSelection();
    this.diagram.nodes.forEach((node) => {
      this.selectNode(node.id, true);
    });
    this.ui.showToast(`Selected all ${this.diagram.nodes.size} nodes`, "info");
  }

  // Select group
  selectGroup(groupId) {
    this.canvas.clearSelection();
    // No specific selection state for group in canvas controller yet (maybe visual highlight?)
    // For now, just show properties

    const group = this.diagram.groups.get(groupId);
    if (group) {
      this.properties.showGroupProperties(group);
    }
  }

  // Select connection
  selectConnection(connectionId) {
    this.canvas.clearSelection();
    this.canvas.selectedConnectionId = connectionId;

    const element = document.querySelector(
      `[data-connection-id="${connectionId}"]`
    );
    if (element) {
      element.classList.add("selected");
    }

    const connection = this.diagram.connections.get(connectionId);
    if (connection) {
      this.properties.showConnectionProperties(connection);
    }
  }

  // Duplicate node
  duplicateNode(nodeId) {
    const node = this.diagram.nodes.get(nodeId);
    if (!node) return;

    const newNode = this.addNode(node.type, node.x + 30, node.y + 30, {
      ...node.properties,
      name: `${node.properties.name || node.type} (copy)`,
    });

    this.selectNode(newNode.id);
    this.ui.showToast("Node duplicated", "success");
  }

  duplicateSelectedNodes() {
    const selectedIds = Array.from(this.canvas.selectedNodeIds);
    if (selectedIds.length === 0) return;

    const newIds = [];
    const idMap = new Map(); // oldId -> newId

    selectedIds.forEach((id) => {
      const node = this.diagram.nodes.get(id);
      if (node) {
        const newNode = this.addNode(node.type, node.x + 30, node.y + 30, {
          ...node.properties,
          name: node.properties.name
            ? `${node.properties.name} (copy)`
            : `${node.type} (copy)`,
        });
        newIds.push(newNode.id);
        idMap.set(id, newNode.id);
      }
    });

    // Duplicate connections between selected nodes
    this.diagram.connections.forEach((conn) => {
      if (idMap.has(conn.sourceId) && idMap.has(conn.targetId)) {
        this.addConnection(idMap.get(conn.sourceId), idMap.get(conn.targetId), {
          ...conn.properties,
          type: conn.type,
        });
      }
    });

    // Select all new nodes
    this.canvas.clearSelection();
    newIds.forEach((id) => this.selectNode(id, true));
    this.ui.showToast(`${newIds.length} node(s) duplicated`, "success");
  }

  // Clear all
  clearDiagram() {
    this.diagram.clear();
    document.getElementById("nodes-layer").innerHTML = "";

    // Clear connections but preserve <defs>
    const connectionsLayer = document.getElementById("connections-layer");
    const defs = connectionsLayer.querySelector("defs");
    connectionsLayer.innerHTML = "";
    if (defs) {
      connectionsLayer.appendChild(defs);
    } else {
      // Re-initialize markers if defs are missing
      this.connections.initDefs();
    }

    this.updateNodeCount();
    this.updateConnectionCount();
    this.properties.clear();
    this.history.clear();
  }

  // Export diagram data
  exportDiagram() {
    return this.diagram.export();
  }

  // Import diagram data
  importDiagram(data) {
    this.clearDiagram();

    if (data.nodes) {
      data.nodes.forEach((node) => {
        const imported = this.diagram.importNode(node);
        this.canvas.renderNode(imported);
      });
    }

    if (data.connections) {
      data.connections.forEach((conn) => {
        const imported = this.diagram.importConnection(conn);
        this.connections.renderConnection(imported);
      });
    }

    this.updateNodeCount();
    this.updateConnectionCount();
  }

  // Undo
  undo() {
    const action = this.history.undo();
    if (!action) return;

    switch (action.type) {
      case "add-node":
        this.diagram.removeNode(action.nodeId);
        document.querySelector(`[data-node-id="${action.nodeId}"]`)?.remove();
        break;
      case "remove-node":
        this.diagram.importNode(action.data);
        this.canvas.renderNode(action.data);
        break;
      case "add-connection":
        this.diagram.removeConnection(action.connectionId);
        document
          .querySelector(`[data-connection-id="${action.connectionId}"]`)
          ?.remove();
        break;
      case "remove-connection":
        this.diagram.importConnection(action.data);
        this.connections.renderConnection(action.data);
        break;
    }

    this.updateNodeCount();
    this.updateConnectionCount();
    this.ui.showToast("Undo", "info");
  }

  // Redo
  redo() {
    const action = this.history.redo();
    if (!action) return;

    switch (action.type) {
      case "add-node":
        this.diagram.importNode(action.data);
        this.canvas.renderNode(action.data);
        break;
      case "remove-node":
        this.diagram.removeNode(action.nodeId);
        document.querySelector(`[data-node-id="${action.nodeId}"]`)?.remove();
        break;
      case "add-connection":
        this.diagram.importConnection(action.data);
        this.connections.renderConnection(action.data);
        break;
      case "remove-connection":
        this.diagram.removeConnection(action.connectionId);
        document
          .querySelector(`[data-connection-id="${action.connectionId}"]`)
          ?.remove();
        break;
    }

    this.updateNodeCount();
    this.updateConnectionCount();
    this.ui.showToast("Redo", "info");
  }
}

// Initialize application
window.homelabStudio = new HomelabStudio();
