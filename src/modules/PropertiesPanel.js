/**
 * PropertiesPanel - Handles the properties panel for nodes and connections
 */

import { NODE_TYPES, CONNECTION_TYPES } from "./nodeTypes.js";

export class PropertiesPanel {
  constructor(app) {
    this.app = app;
    this.panel = document.getElementById("properties-panel");
    this.content = document.getElementById("panel-content");

    this.setupEventListeners();
  }

  setupEventListeners() {
    document.getElementById("panel-close").addEventListener("click", () => {
      this.panel.classList.add("collapsed");
    });
  }

  clear() {
    this.content.innerHTML = `
      <div class="empty-panel">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
        <p>Select a node or connection to view and edit its properties</p>
      </div>
    `;
    this.panel.classList.remove("collapsed");
  }

  showNodeProperties(node) {
    const nodeType = NODE_TYPES[node.type] || NODE_TYPES.server;
    const resourceLoad = this.app.canvas.nodeRenderer.calculateResources(node);

    this.content.innerHTML = `
      <div class="property-group">
        <div class="property-group-title">General</div>
        <div class="property-row">
          <label class="property-label" for="prop-name">Name</label>
          <input type="text" class="property-input" id="prop-name" 
                 value="${
                   node.properties.name || ""
                 }" placeholder="Enter name...">
        </div>
        <div class="property-row">
          <label class="property-label" for="prop-description">Description</label>
          <textarea class="property-input" id="prop-description" 
                    placeholder="Add a description...">${
                      node.properties.description || ""
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
              <span class="resource-label">CPU</span>
              <span class="resource-value">${resourceLoad.cpu.percent.toFixed(
                0
              )}%</span>
            </div>
            <div class="resource-bar-bg">
              <div class="resource-bar-fill cpu" style="width: ${
                resourceLoad.cpu.percent
              }%"></div>
            </div>
          </div>
          <div class="resource-row">
            <div class="resource-info">
              <span class="resource-label">RAM</span>
              <span class="resource-value">${resourceLoad.ram.percent.toFixed(
                0
              )}%</span>
            </div>
            <div class="resource-bar-bg">
              <div class="resource-bar-fill ram" style="width: ${
                resourceLoad.ram.percent
              }%"></div>
            </div>
          </div>
          <div class="resource-row">
            <div class="resource-info">
              <span class="resource-label">Storage</span>
              <span class="resource-value">${resourceLoad.storage.percent.toFixed(
                0
              )}%</span>
            </div>
            <div class="resource-bar-bg">
              <div class="resource-bar-fill storage" style="width: ${
                resourceLoad.storage.percent
              }%"></div>
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
          <label class="property-label" for="prop-ip">IP Address</label>
          <input type="text" class="property-input" id="prop-ip" 
                 value="${
                   node.properties.ip || ""
                 }" placeholder="e.g., 192.168.1.100">
        </div>
        <div class="property-row">
          <label class="property-label" for="prop-hostname">Hostname</label>
          <input type="text" class="property-input" id="prop-hostname" 
                 value="${
                   node.properties.hostname || ""
                 }" placeholder="e.g., server01.local">
        </div>
        <div class="property-row">
          <label class="property-label" for="prop-mac">MAC Address</label>
          <input type="text" class="property-input" id="prop-mac" 
                 value="${
                   node.properties.mac || ""
                 }" placeholder="e.g., AA:BB:CC:DD:EE:FF">
        </div>
      </div>

      <div class="property-group">
        <div class="property-group-title">Specifications</div>
        <div class="property-row">
          <label class="property-label" for="prop-os">Operating System</label>
          <input type="text" class="property-input" id="prop-os" 
                 value="${
                   node.properties.os || ""
                 }" placeholder="e.g., Ubuntu 22.04">
        </div>
        
        <!-- CPU Spec -->
        <div class="spec-input-container">
          <div class="spec-header">
            <label class="property-label">CPU Capacity</label>
            <div style="display: flex; align-items: center;">
              <input type="number" step="0.1" min="0.1" max="10.0" 
                     class="spec-numeric-input" id="prop-cpu-num" 
                     value="${parseFloat(node.properties.cpu) || 1.0}">
              <span class="spec-unit">GHz</span>
            </div>
          </div>
          <input type="range" step="0.1" min="0.1" max="10.0" 
                 class="spec-slider cpu" id="prop-cpu-range" 
                 value="${parseFloat(node.properties.cpu) || 1.0}">
        </div>

        <!-- RAM Spec -->
        <div class="spec-input-container">
          <div class="spec-header">
            <label class="property-label">RAM Capacity</label>
            <div style="display: flex; align-items: center;">
              <input type="number" step="1" min="1" max="512" 
                     class="spec-numeric-input" id="prop-ram-num" 
                     value="${parseInt(node.properties.ram) || 4}">
              <span class="spec-unit">GB</span>
            </div>
          </div>
          <input type="range" step="1" min="1" max="512" 
                 class="spec-slider ram" id="prop-ram-range" 
                 value="${parseInt(node.properties.ram) || 4}">
        </div>

        <!-- Storage Spec -->
        <div class="spec-input-container">
          <div class="spec-header">
            <label class="property-label">Storage Capacity</label>
            <div style="display: flex; align-items: center;">
              <input type="number" step="10" min="10" max="8192" 
                     class="spec-numeric-input" id="prop-storage-num" 
                     value="${parseInt(node.properties.storage) || 100}">
              <span class="spec-unit">GB</span>
            </div>
          </div>
          <input type="range" step="10" min="10" max="8192" 
                 class="spec-slider storage" id="prop-storage-range" 
                 value="${parseInt(node.properties.storage) || 100}">
        </div>
      </div>

      <div class="property-group">
        <div class="property-group-title">Position</div>
        <div class="property-row" style="display: flex; gap: 8px;">
          <div style="flex: 1;">
            <label class="property-label" for="prop-x">X</label>
            <input type="number" class="property-input" id="prop-x" value="${Math.round(
              node.x
            )}">
          </div>
          <div style="flex: 1;">
            <label class="property-label" for="prop-y">Y</label>
            <input type="number" class="property-input" id="prop-y" value="${Math.round(
              node.y
            )}">
          </div>
        </div>
        <div class="property-row" style="display: flex; gap: 8px;">
          <div style="flex: 1;">
            <label class="property-label" for="prop-width">Width</label>
            <input type="number" class="property-input" id="prop-width" value="${
              node.width
            }">
          </div>
          <div style="flex: 1;">
            <label class="property-label" for="prop-height">Height</label>
            <input type="number" class="property-input" id="prop-height" value="${
              node.height
            }">
          </div>
        </div>
      </div>

      <div class="property-group">
        <div class="property-group-title">Actions</div>
        <button class="btn btn-secondary" style="width: 100%; margin-bottom: 8px;" id="btn-duplicate-node">
          Duplicate Node
        </button>
        <button class="btn btn-danger" style="width: 100%;" id="btn-delete-node">
          Delete Node
        </button>
      </div>
    `;

    this.panel.classList.remove("collapsed");
    this.bindNodePropertyHandlers(node.id);
  }

  bindNodePropertyHandlers(nodeId) {
    // Name
    document.getElementById("prop-name")?.addEventListener("input", (e) => {
      this.updateNodeProperty(nodeId, "name", e.target.value);
    });

    // Description
    document
      .getElementById("prop-description")
      ?.addEventListener("input", (e) => {
        this.updateNodeProperty(nodeId, "description", e.target.value);
      });

    // Status
    document.getElementById("prop-status")?.addEventListener("change", (e) => {
      this.updateNodeProperty(nodeId, "status", e.target.value);
    });

    // IP
    document.getElementById("prop-ip")?.addEventListener("input", (e) => {
      this.updateNodeProperty(nodeId, "ip", e.target.value);
    });

    // Hostname
    document.getElementById("prop-hostname")?.addEventListener("input", (e) => {
      this.updateNodeProperty(nodeId, "hostname", e.target.value);
    });

    // MAC
    document.getElementById("prop-mac")?.addEventListener("input", (e) => {
      this.updateNodeProperty(nodeId, "mac", e.target.value);
    });

    // OS
    document.getElementById("prop-os")?.addEventListener("input", (e) => {
      this.updateNodeProperty(nodeId, "os", e.target.value);
    });

    // Helper for dual input sync
    const setupDualInput = (idPrefix, propName, maxVal) => {
      const numInput = document.getElementById(`prop-${idPrefix}-num`);
      const rangeInput = document.getElementById(`prop-${idPrefix}-range`);

      if (!numInput || !rangeInput) return;

      const update = (val) => {
        let numericVal = parseFloat(val);
        if (isNaN(numericVal)) return;

        // Clamp
        if (numericVal > maxVal) numericVal = maxVal;
        if (numericVal < 0.1 && idPrefix === "cpu") numericVal = 0.1;
        if (numericVal < 1 && idPrefix !== "cpu") numericVal = 1;

        numInput.value = numericVal;
        rangeInput.value = numericVal;
        this.updateNodeProperty(nodeId, propName, numericVal);
      };

      numInput.addEventListener("input", (e) => update(e.target.value));
      rangeInput.addEventListener("input", (e) => update(e.target.value));
    };

    setupDualInput("cpu", "cpu", 10.0);
    setupDualInput("ram", "ram", 512);
    setupDualInput("storage", "storage", 8192);

    // Position
    document.getElementById("prop-x")?.addEventListener("change", (e) => {
      const node = this.app.diagram.nodes.get(nodeId);
      if (node) {
        const x = parseInt(e.target.value, 10);
        this.app.updateNodePosition(nodeId, x, node.y);
        const element = document.querySelector(`[data-node-id="${nodeId}"]`);
        if (element) element.style.left = `${x}px`;
      }
    });

    document.getElementById("prop-y")?.addEventListener("change", (e) => {
      const node = this.app.diagram.nodes.get(nodeId);
      if (node) {
        const y = parseInt(e.target.value, 10);
        this.app.updateNodePosition(nodeId, node.x, y);
        const element = document.querySelector(`[data-node-id="${nodeId}"]`);
        if (element) element.style.top = `${y}px`;
      }
    });

    document.getElementById("prop-width")?.addEventListener("change", (e) => {
      const width = parseInt(e.target.value, 10);
      this.app.diagram.updateNode(nodeId, { width });
      const element = document.querySelector(`[data-node-id="${nodeId}"]`);
      if (element) element.style.width = `${width}px`;
    });

    document.getElementById("prop-height")?.addEventListener("change", (e) => {
      const height = parseInt(e.target.value, 10);
      this.app.diagram.updateNode(nodeId, { height });
      const element = document.querySelector(`[data-node-id="${nodeId}"]`);
      if (element) element.style.height = `${height}px`;
    });

    // Actions
    document
      .getElementById("btn-duplicate-node")
      ?.addEventListener("click", () => {
        this.app.duplicateNode(nodeId);
      });

    document
      .getElementById("btn-delete-node")
      ?.addEventListener("click", () => {
        this.app.removeNode(nodeId);
        this.app.ui.showToast("Node deleted", "success");
      });
  }

  updateNodeProperty(nodeId, property, value) {
    const node = this.app.diagram.nodes.get(nodeId);
    if (!node) return;

    node.properties[property] = value;
    this.app.diagram.updateModified();

    // Update visual representation
    this.app.nodeRenderer.updateNodeElement(nodeId, node);
  }

  showConnectionProperties(connection) {
    const sourceNode = this.app.diagram.nodes.get(connection.sourceId);
    const targetNode = this.app.diagram.nodes.get(connection.targetId);

    this.content.innerHTML = `
      <div class="property-group">
        <div class="property-group-title">Connection</div>
        <div class="property-row">
          <label class="property-label">From</label>
          <input type="text" class="property-input" value="${
            sourceNode?.properties.name || "Unknown"
          }" disabled>
        </div>
        <div class="property-row">
          <label class="property-label">To</label>
          <input type="text" class="property-input" value="${
            targetNode?.properties.name || "Unknown"
          }" disabled>
        </div>
      </div>

      <div class="property-group">
        <div class="property-group-title">Properties</div>
        <div class="property-row">
          <label class="property-label" for="conn-type">Type</label>
          <select class="property-select" id="conn-type">
            ${Object.entries(CONNECTION_TYPES)
              .map(
                ([type, config]) => `
              <option value="${type}" ${
                  connection.type === type ? "selected" : ""
                }>${config.name}</option>
            `
              )
              .join("")}
          </select>
        </div>
      </div>

      <div class="property-group">
        <div class="property-group-title">Actions</div>
        <button class="btn btn-danger" style="width: 100%;" id="btn-delete-connection">
          Delete Connection
        </button>
      </div>
    `;

    this.panel.classList.remove("collapsed");
    this.bindConnectionPropertyHandlers(connection.id);
  }

  bindConnectionPropertyHandlers(connectionId) {
    // Type
    document.getElementById("conn-type")?.addEventListener("change", (e) => {
      const type = e.target.value;
      this.app.diagram.updateConnection(connectionId, { type });
      this.app.connections.updateConnectionStyle(connectionId, type);
    });

    // Delete
    document
      .getElementById("btn-delete-connection")
      ?.addEventListener("click", () => {
        this.app.removeConnection(connectionId);
        this.clear();
        this.app.ui.showToast("Connection deleted", "success");
      });
  }

  updateConnectionProperty(connectionId, property, value) {
    const connection = this.app.diagram.connections.get(connectionId);
    if (!connection) return;

    connection.properties[property] = value;
    this.app.diagram.updateModified();

    // Update visual if label changed
    if (property === "label") {
      this.app.connections.updateConnection(connectionId);
    }
  }

  showGroupProperties(group) {
    // Build member nodes list (filter out any invalid node IDs)
    const membersList = group.nodeIds
      .filter((nodeId) => this.app.diagram.nodes.has(nodeId))
      .map((nodeId) => {
        const node = this.app.diagram.nodes.get(nodeId);
        const nodeName = node?.properties?.name || node?.type || "Unknown";
        return `
        <div class="group-member-item" data-node-id="${nodeId}">
          <span class="member-name">${nodeName}</span>
          <button class="btn-remove-member" data-node-id="${nodeId}" title="Remove from group">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      `;
      })
      .join("");

    this.content.innerHTML = `
      <div class="property-group">
        <div class="property-group-title">Network Group</div>
        <div class="property-row">
          <label class="property-label" for="group-name">Name</label>
          <input type="text" class="property-input" id="group-name" 
                 value="${group.name || ""}" placeholder="Group Name...">
        </div>
        <div class="property-row">
          <label class="property-label" for="group-color">Color</label>
          <input type="color" class="property-input" id="group-color" 
                 value="${
                   group.color || "#58a6ff"
                 }" style="height: 40px; cursor: pointer;">
        </div>

        <div class="property-divider"></div>

        <div class="property-row">
           <label class="property-label">Members (${
             group.nodeIds.length
           })</label>
        </div>
        <div class="group-members-list">
          ${membersList}
        </div>

        <div class="property-divider"></div>
        
        <button class="btn btn-danger" id="btn-delete-group" style="width: 100%;">
          Delete Group
        </button>
      </div>
    `;

    this.panel.classList.remove("collapsed");
    this.setupGroupListeners(group.id);
  }

  setupGroupListeners(groupId) {
    // Name
    document.getElementById("group-name").addEventListener("input", (e) => {
      this.app.diagram.updateGroup(groupId, { name: e.target.value });
      this.app.canvas.renderGroup(this.app.diagram.groups.get(groupId));
    });

    // Color
    document.getElementById("group-color").addEventListener("input", (e) => {
      this.app.diagram.updateGroup(groupId, { color: e.target.value });
      this.app.canvas.renderGroup(this.app.diagram.groups.get(groupId));
    });

    // Remove individual members
    document.querySelectorAll(".btn-remove-member").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const nodeId = btn.dataset.nodeId;

        // Use the method with history tracking
        const removedCount = this.app.removeNodesFromGroup([nodeId]);

        if (removedCount > 0) {
          // Check if group still exists
          const group = this.app.diagram.groups.get(groupId);
          if (group) {
            // Refresh properties panel
            this.showGroupProperties(group);
          } else {
            // Group was deleted
            this.clear();
            this.app.ui.showToast("Group deleted (no members left)", "success");
          }
        }
      });
    });

    // Delete
    document
      .getElementById("btn-delete-group")
      .addEventListener("click", () => {
        const group = this.app.diagram.groups.get(groupId);

        // Reset all member node title colors
        if (group) {
          group.nodeIds.forEach((nodeId) => {
            const nodeEl = document.querySelector(`[data-node-id="${nodeId}"]`);
            if (nodeEl) {
              const titleEl = nodeEl.querySelector(".node-title");
              if (titleEl) {
                titleEl.style.color = "";
              }
            }
          });
        }

        this.app.removeGroup(groupId);
        // Remove from DOM
        const el = document.querySelector(`[data-group-id="${groupId}"]`);
        if (el) el.remove();

        this.clear();
        this.app.ui.showToast("Group deleted", "success");
      });
  }
}
