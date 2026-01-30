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
          <label class="property-label" for="prop-type">Type</label>
          <input type="text" class="property-input" id="prop-type" 
                 value="${nodeType.description}" disabled>
        </div>
        <div class="property-row">
          <label class="property-label" for="prop-description">Description</label>
          <textarea class="property-input" id="prop-description" 
                    placeholder="Add a description...">${
                      node.properties.description || ""
                    }</textarea>
        </div>
      </div>

      <div class="property-group">
        <div class="property-group-title">Status</div>
        <div class="property-row">
          <label class="property-label" for="prop-status">Status</label>
          <select class="property-select" id="prop-status">
            <option value="online" ${
              node.properties.status === "online" ? "selected" : ""
            }>Online</option>
            <option value="offline" ${
              node.properties.status === "offline" ? "selected" : ""
            }>Offline</option>
            <option value="warning" ${
              node.properties.status === "warning" ? "selected" : ""
            }>Warning</option>
          </select>
        </div>
      </div>

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
        <div class="property-row">
          <label class="property-label" for="prop-cpu">CPU</label>
          <input type="text" class="property-input" id="prop-cpu" 
                 value="${
                   node.properties.cpu || ""
                 }" placeholder="e.g., Intel i7-12700">
        </div>
        <div class="property-row">
          <label class="property-label" for="prop-ram">RAM</label>
          <input type="text" class="property-input" id="prop-ram" 
                 value="${node.properties.ram || ""}" placeholder="e.g., 32GB">
        </div>
        <div class="property-row">
          <label class="property-label" for="prop-storage">Storage</label>
          <input type="text" class="property-input" id="prop-storage" 
                 value="${
                   node.properties.storage || ""
                 }" placeholder="e.g., 1TB SSD">
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

    // CPU
    document.getElementById("prop-cpu")?.addEventListener("input", (e) => {
      this.updateNodeProperty(nodeId, "cpu", e.target.value);
    });

    // RAM
    document.getElementById("prop-ram")?.addEventListener("input", (e) => {
      this.updateNodeProperty(nodeId, "ram", e.target.value);
    });

    // Storage
    document.getElementById("prop-storage")?.addEventListener("input", (e) => {
      this.updateNodeProperty(nodeId, "storage", e.target.value);
    });

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
        <div class="property-row">
          <label class="property-label" for="conn-label">Label</label>
          <input type="text" class="property-input" id="conn-label" 
                 value="${
                   connection.properties.label || ""
                 }" placeholder="e.g., 1Gbps">
        </div>
        <div class="property-row">
          <label class="property-label" for="conn-bandwidth">Bandwidth</label>
          <input type="text" class="property-input" id="conn-bandwidth" 
                 value="${
                   connection.properties.bandwidth || ""
                 }" placeholder="e.g., 1 Gbps">
        </div>
        <div class="property-row">
          <label class="property-label" for="conn-latency">Latency</label>
          <input type="text" class="property-input" id="conn-latency" 
                 value="${
                   connection.properties.latency || ""
                 }" placeholder="e.g., <1ms">
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

    // Label
    document.getElementById("conn-label")?.addEventListener("input", (e) => {
      this.updateConnectionProperty(connectionId, "label", e.target.value);
    });

    // Bandwidth
    document
      .getElementById("conn-bandwidth")
      ?.addEventListener("input", (e) => {
        this.updateConnectionProperty(
          connectionId,
          "bandwidth",
          e.target.value
        );
      });

    // Latency
    document.getElementById("conn-latency")?.addEventListener("input", (e) => {
      this.updateConnectionProperty(connectionId, "latency", e.target.value);
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
}
