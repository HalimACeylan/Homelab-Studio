/**
 * HomeLab Studio - Visual Infrastructure Editor
 * Main Application Module
 */

import "./style.css";
import "./icons.css";
import "./nodes.css";
import "./text-tool.css";
import "./shortcuts.css";
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

    // Remove node from any groups
    const groupsToUpdate = new Set();
    const groupsToDelete = [];

    this.diagram.groups.forEach((group, groupId) => {
      if (group.nodeIds.includes(nodeId)) {
        group.nodeIds = group.nodeIds.filter((id) => id !== nodeId);

        if (group.nodeIds.length === 0) {
          // Mark empty group for deletion
          groupsToDelete.push(groupId);
        } else {
          // Mark group for update
          groupsToUpdate.add(groupId);
        }
      }
    });

    // Delete empty groups
    groupsToDelete.forEach((groupId) => {
      this.diagram.removeGroup(groupId);
      const groupEl = document.querySelector(`[data-group-id="${groupId}"]`);
      if (groupEl) groupEl.remove();
    });

    // Update remaining groups
    groupsToUpdate.forEach((groupId) => {
      const group = this.diagram.groups.get(groupId);
      if (group) {
        this.canvas.renderGroup(group);
      }
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

    this.history.startBatch();
    selectedIds.forEach((id) => {
      this.removeNode(id);
    });
    this.history.endBatch("batch");

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

  removeSelectedConnections() {
    const selectedIds = Array.from(this.canvas.selectedConnectionIds);
    if (selectedIds.length === 0) return;

    this.history.startBatch();
    selectedIds.forEach((id) => {
      this.removeConnection(id);
    });
    this.history.endBatch("batch");

    this.canvas.clearSelection();
  }

  removeSelectedTextItems() {
    const selectedIds = Array.from(this.canvas.selectedTextIds);
    if (selectedIds.length === 0) return;

    this.history.startBatch();
    selectedIds.forEach((id) => {
      const item = this.diagram.textItems.get(id);
      if (item) {
        this.history.push({
          type: "remove-text",
          id: id,
          data: { ...item },
        });
      }
      this.diagram.removeTextItem(id);
      const el = document.querySelector(`[data-text-id="${id}"]`);
      if (el) el.remove();
    });
    this.history.endBatch("batch");

    this.canvas.clearSelection();
    this.ui.showToast(`Removed ${selectedIds.length} text item(s)`, "success");
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

  removeGroup(groupId) {
    const group = this.diagram.groups.get(groupId);
    if (!group) return;

    // Reset node title colors for all members
    group.nodeIds.forEach((nodeId) => {
      const nodeEl = document.querySelector(`[data-node-id="${nodeId}"]`);
      if (nodeEl) {
        const titleEl = nodeEl.querySelector(".node-title");
        if (titleEl) {
          titleEl.style.color = "";
        }
      }
    });

    // Remove from diagram
    this.diagram.removeGroup(groupId);

    // Remove from DOM
    const groupEl = document.querySelector(`[data-group-id="${groupId}"]`);
    if (groupEl) groupEl.remove();

    // Track in history
    this.history.push({
      type: "remove-group",
      id: groupId,
      data: { ...group },
    });

    // Clear selection if this group was selected
    if (this.canvas.selectedGroupId === groupId) {
      this.canvas.selectedGroupId = null;
      this.properties.clear();
    }
  }

  addNodesToGroup(groupId, nodeIds) {
    const group = this.diagram.groups.get(groupId);
    if (!group || !nodeIds || nodeIds.length === 0) return;

    // Track which nodes were actually added (not already in group)
    const addedNodes = nodeIds.filter(
      (nodeId) => !group.nodeIds.includes(nodeId)
    );
    if (addedNodes.length === 0) return;

    // Add nodes to group
    group.nodeIds.push(...addedNodes);

    // Update group rendering
    this.canvas.renderGroup(group);

    // Track in history
    this.history.push({
      type: "add-to-group",
      groupId: groupId,
      nodeIds: addedNodes,
    });

    this.diagram.updateModified();
    return addedNodes.length;
  }

  removeNodesFromGroup(nodeIds) {
    if (!nodeIds || nodeIds.length === 0) return 0;

    const changes = []; // Track changes for history
    const groupsToUpdate = new Set();
    const groupsToDelete = [];

    // Find and remove nodes from their groups
    this.diagram.groups.forEach((group, groupId) => {
      const removedFromThisGroup = [];

      nodeIds.forEach((nodeId) => {
        if (group.nodeIds.includes(nodeId)) {
          group.nodeIds = group.nodeIds.filter((id) => id !== nodeId);
          removedFromThisGroup.push(nodeId);

          // Reset node title color
          const nodeEl = document.querySelector(`[data-node-id="${nodeId}"]`);
          if (nodeEl) {
            const titleEl = nodeEl.querySelector(".node-title");
            if (titleEl) {
              titleEl.style.color = "";
            }
          }
        }
      });

      if (removedFromThisGroup.length > 0) {
        changes.push({ groupId, nodeIds: removedFromThisGroup });

        if (group.nodeIds.length === 0) {
          groupsToDelete.push(groupId);
        } else {
          groupsToUpdate.add(groupId);
        }
      }
    });

    // Delete empty groups
    groupsToDelete.forEach((groupId) => {
      this.removeGroup(groupId);
    });

    // Update remaining groups
    groupsToUpdate.forEach((groupId) => {
      const group = this.diagram.groups.get(groupId);
      if (group) {
        // Clean up any invalid node IDs
        group.nodeIds = group.nodeIds.filter((nodeId) =>
          this.diagram.nodes.has(nodeId)
        );
        this.canvas.renderGroup(group);
      }
    });

    // Track in history (batch all changes)
    if (changes.length > 0) {
      this.history.push({
        type: "remove-from-group",
        changes: changes, // Array of {groupId, nodeIds}
      });

      this.diagram.updateModified();

      // Refresh properties panel if showing a group
      const currentGroupId = this.canvas.selectedGroupId;
      if (currentGroupId && groupsToUpdate.has(currentGroupId)) {
        const group = this.diagram.groups.get(currentGroupId);
        if (group) {
          this.properties.showGroupProperties(group);
        }
      }
    }

    return changes.length;
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

  selectAll() {
    this.canvas.clearSelection();
    this.diagram.nodes.forEach((node) => {
      this.selectNode(node.id, true);
    });
    this.diagram.connections.forEach((conn) => {
      this.selectConnection(conn.id, true);
    });
    const total = this.diagram.nodes.size + this.diagram.connections.size;
    this.ui.showToast(`Selected all ${total} elements`, "info");
  }

  // Select group
  selectGroup(groupId) {
    this.canvas.clearSelection();
    this.canvas.selectedGroupId = groupId;

    const group = this.diagram.groups.get(groupId);
    if (group) {
      this.properties.showGroupProperties(group);
    }
  }

  // Select connection
  selectConnection(connectionId, addToSelection = false) {
    if (!addToSelection) {
      this.canvas.clearSelection();
    }

    if (this.canvas.selectedConnectionIds) {
      this.canvas.selectedConnectionIds.add(connectionId);
    } else {
      this.canvas.selectedConnectionIds = new Set([connectionId]);
    }
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

  // Select text item
  selectTextItem(textId, addToSelection = false) {
    if (!addToSelection) {
      this.canvas.clearSelection();
    }

    if (this.canvas.selectedTextIds) {
      this.canvas.selectedTextIds.add(textId);
    } else {
      this.canvas.selectedTextIds = new Set([textId]);
    }

    const element = document.querySelector(`[data-text-id="${textId}"]`);
    if (element) {
      element.classList.add("selected");
    }
    // No properties panel for text yet, or maybe simple one later
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

    this.history.startBatch();
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
    this.history.endBatch("batch");

    // Select all new nodes
    this.canvas.clearSelection();
    newIds.forEach((id) => this.selectNode(id, true));
    this.ui.showToast(`${newIds.length} node(s) duplicated`, "success");
  }

  duplicateSelectedTextItems() {
    const selectedIds = Array.from(this.canvas.selectedTextIds);
    if (selectedIds.length === 0) return;

    this.history.startBatch();
    const newIds = [];

    selectedIds.forEach((id) => {
      const item = this.diagram.textItems.get(id);
      if (item) {
        const newItem = this.diagram.createTextItem(
          item.x + 20,
          item.y + 20,
          item.text
        );
        // Also copy fontSize and color if present
        if (item.fontSize) newItem.fontSize = item.fontSize;
        if (item.color) newItem.color = item.color;

        const el = this.canvas.createTextElement(newItem);
        newIds.push(newItem.id);

        this.history.push({
          type: "add-text",
          id: newItem.id,
          data: { ...newItem },
        });
      }
    });
    this.history.endBatch("batch");

    this.canvas.clearSelection();
    newIds.forEach((id) => this.selectTextItem(id, true));
    this.ui.showToast(`${newIds.length} text item(s) duplicated`, "success");
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

    // Clear groups layer
    document.getElementById("groups-layer").innerHTML = "";

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

    // Import groups into data model first (but don't render yet)
    if (data.groups) {
      data.groups.forEach((group) => {
        this.diagram.importGroup(group);
      });
    }

    // Then import and render nodes
    if (data.nodes) {
      data.nodes.forEach((node) => {
        const imported = this.diagram.importNode(node);
        this.canvas.renderNode(imported);
      });
    }

    // Then import and render connections
    if (data.connections) {
      data.connections.forEach((conn) => {
        const imported = this.diagram.importConnection(conn);
        this.connections.renderConnection(imported);
      });
    }

    // Finally render groups (after nodes are in DOM)
    if (data.groups) {
      data.groups.forEach((group) => {
        this.canvas.renderGroup(this.diagram.groups.get(group.id));
      });
    }

    // Render text items
    if (data.textItems) {
      data.textItems.forEach((item) => {
        this.diagram.importTextItem(item);
      });
      this.canvas.renderTextItems();
    }

    this.updateNodeCount();
    this.updateConnectionCount();
  }

  // Undo
  undo() {
    const action = this.history.undo();
    if (!action) return;

    this.applyHistoryAction(action, "undo");
    this.ui.showToast("Undo", "info");
  }

  // Redo
  redo() {
    const action = this.history.redo();
    if (!action) return;

    this.applyHistoryAction(action, "redo");
    this.ui.showToast("Redo", "info");
  }

  applyHistoryAction(action, mode) {
    if (action.type === "batch") {
      const actions =
        mode === "undo" ? [...action.actions].reverse() : action.actions;
      actions.forEach((a) => this.applyHistoryAction(a, mode));
      return;
    }

    if (mode === "undo") {
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
        case "create-group":
          // Undo create = remove the group
          this.diagram.removeGroup(action.id);
          document.querySelector(`[data-group-id="${action.id}"]`)?.remove();
          // Reset node colors
          action.data.nodeIds.forEach((nodeId) => {
            const nodeEl = document.querySelector(`[data-node-id="${nodeId}"]`);
            if (nodeEl) {
              const titleEl = nodeEl.querySelector(".node-title");
              if (titleEl) titleEl.style.color = "";
            }
          });
          break;
        case "remove-group":
          // Undo remove = recreate the group
          this.diagram.importGroup(action.data);
          this.canvas.renderGroup(action.data);
          break;
        case "add-to-group":
          // Undo add = remove nodes from group
          const group1 = this.diagram.groups.get(action.groupId);
          if (group1) {
            group1.nodeIds = group1.nodeIds.filter(
              (id) => !action.nodeIds.includes(id)
            );
            // Reset colors
            action.nodeIds.forEach((nodeId) => {
              const nodeEl = document.querySelector(
                `[data-node-id="${nodeId}"]`
              );
              if (nodeEl) {
                const titleEl = nodeEl.querySelector(".node-title");
                if (titleEl) titleEl.style.color = "";
              }
            });
            this.canvas.renderGroup(group1);
          }
          break;
        case "remove-from-group":
          // Undo remove = add nodes back to groups
          action.changes.forEach((change) => {
            const group = this.diagram.groups.get(change.groupId);
            if (group) {
              group.nodeIds.push(...change.nodeIds);
              this.canvas.renderGroup(group);
            }
          });
          break;
        case "add-text":
          this.diagram.removeTextItem(action.id);
          this.canvas.textLayer
            .querySelector(`[data-text-id="${action.id}"]`)
            ?.remove();
          break;
        case "remove-text":
          this.diagram.importTextItem(action.data);
          this.canvas.createTextElement(action.data);
          break;
        case "move-text":
          this.diagram.updateTextItem(action.id, {
            x: action.data.oldX,
            y: action.data.oldY,
          });
          this.canvas.updateTextElement(action.id);
          break;
      }
    } else {
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
        case "create-group":
          // Redo create = recreate the group
          this.diagram.importGroup(action.data);
          this.canvas.renderGroup(action.data);
          break;
        case "remove-group":
          // Redo remove = remove the group again
          this.diagram.removeGroup(action.id);
          document.querySelector(`[data-group-id="${action.id}"]`)?.remove();
          // Reset node colors
          action.data.nodeIds.forEach((nodeId) => {
            const nodeEl = document.querySelector(`[data-node-id="${nodeId}"]`);
            if (nodeEl) {
              const titleEl = nodeEl.querySelector(".node-title");
              if (titleEl) titleEl.style.color = "";
            }
          });
          break;
        case "add-to-group":
          // Redo add = add nodes to group
          const group2 = this.diagram.groups.get(action.groupId);
          if (group2) {
            group2.nodeIds.push(...action.nodeIds);
            this.canvas.renderGroup(group2);
          }
          break;
        case "remove-from-group":
          // Redo remove = remove nodes from groups
          action.changes.forEach((change) => {
            const group = this.diagram.groups.get(change.groupId);
            if (group) {
              group.nodeIds = group.nodeIds.filter(
                (id) => !change.nodeIds.includes(id)
              );
              // Reset colors
              change.nodeIds.forEach((nodeId) => {
                const nodeEl = document.querySelector(
                  `[data-node-id="${nodeId}"]`
                );
                if (nodeEl) {
                  const titleEl = nodeEl.querySelector(".node-title");
                  if (titleEl) titleEl.style.color = "";
                }
              });
              this.canvas.renderGroup(group);
            }
          });
          break;
        case "add-text":
          this.diagram.importTextItem(action.data);
          this.canvas.createTextElement(action.data);
          break;
        case "remove-text":
          this.diagram.removeTextItem(action.id);
          this.canvas.textLayer
            .querySelector(`[data-text-id="${action.id}"]`)
            ?.remove();
          break;
        case "move-text":
          this.diagram.updateTextItem(action.id, {
            x: action.data.newX,
            y: action.data.newY,
          });
          this.canvas.updateTextElement(action.id);
          break;
      }
    }

    this.updateNodeCount();
    this.updateConnectionCount();
  }
}

// Initialize application
window.homelabStudio = new HomelabStudio();
