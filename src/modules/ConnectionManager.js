/**
 * ConnectionManager - Handles connections between nodes
 */

import { CONNECTION_TYPES } from "./nodeTypes.js";

export class ConnectionManager {
  constructor(app) {
    this.app = app;
    this.connectionsLayer = document.getElementById("connections-layer");

    this.initDefs();
  }

  initDefs() {
    // Create arrow markers for connections
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");

    Object.entries(CONNECTION_TYPES).forEach(([type, config]) => {
      const marker = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "marker"
      );
      marker.setAttribute("id", `arrow-${type}`);
      marker.setAttribute("viewBox", "0 0 10 10");
      marker.setAttribute("refX", "9");
      marker.setAttribute("refY", "5");
      marker.setAttribute("markerWidth", "6");
      marker.setAttribute("markerHeight", "6");
      marker.setAttribute("orient", "auto-start-reverse");

      const path = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
      );
      path.setAttribute("d", "M 0 0 L 10 5 L 0 10 z");
      path.setAttribute("fill", config.color);

      marker.appendChild(path);
      defs.appendChild(marker);
    });

    this.connectionsLayer.appendChild(defs);
  }

  renderConnection(connection) {
    const endpoints = this.app.diagram.getConnectionEndpoints(connection.id);
    if (!endpoints) return;

    const connectionType =
      CONNECTION_TYPES[connection.type] || CONNECTION_TYPES.ethernet;

    // Create connection group
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.dataset.connectionId = connection.id;

    // Create path
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.classList.add("connection", connection.type);
    path.dataset.connectionId = connection.id;

    // Calculate bezier curve
    const pathData = this.calculatePath(endpoints.source, endpoints.target);
    path.setAttribute("d", pathData);
    path.setAttribute("marker-end", `url(#arrow-${connection.type})`);

    // Add click handler
    path.addEventListener("click", (e) => {
      e.stopPropagation();
      this.app.selectConnection(connection.id);
    });

    path.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.app.selectConnection(connection.id);
      this.app.ui.showContextMenu(e.clientX, e.clientY, null, connection.id);
    });

    group.appendChild(path);

    // Add label (show type if no custom label)
    const labelText = connection.properties.label || connectionType.name;
    const label = this.createLabel(endpoints, labelText);
    group.appendChild(label);

    this.connectionsLayer.appendChild(group);
  }

  calculatePath(source, target) {
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Control point offset for bezier curve
    const curvature = Math.min(distance * 0.3, 100);

    // Determine if connection is more horizontal or vertical
    if (Math.abs(dx) > Math.abs(dy)) {
      // Horizontal-ish connection
      const cx1 = source.x + curvature;
      const cy1 = source.y;
      const cx2 = target.x - curvature;
      const cy2 = target.y;

      return `M ${source.x} ${source.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${target.x} ${target.y}`;
    } else {
      // Vertical-ish connection
      const cx1 = source.x;
      const cy1 = source.y + curvature * Math.sign(dy);
      const cx2 = target.x;
      const cy2 = target.y - curvature * Math.sign(dy);

      return `M ${source.x} ${source.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${target.x} ${target.y}`;
    }
  }

  createLabel(endpoints, text) {
    const midX = (endpoints.source.x + endpoints.target.x) / 2;
    const midY = (endpoints.source.y + endpoints.target.y) / 2;

    const label = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text"
    );
    label.classList.add("connection-label");
    label.setAttribute("x", midX);
    label.setAttribute("y", midY); // Centered line height handles baseline
    label.textContent = text;

    return label;
  }

  updateConnectionsForNode(nodeId) {
    this.app.diagram.connections.forEach((connection, id) => {
      if (connection.sourceId === nodeId || connection.targetId === nodeId) {
        this.updateConnection(id);
      }
    });
  }

  updateConnection(connectionId) {
    const connection = this.app.diagram.connections.get(connectionId);
    if (!connection) return;

    const endpoints = this.app.diagram.getConnectionEndpoints(connectionId);
    if (!endpoints) return;

    const group = this.connectionsLayer.querySelector(
      `[data-connection-id="${connectionId}"]`
    );
    if (!group) return;

    const path = group.querySelector("path");
    if (path) {
      const pathData = this.calculatePath(endpoints.source, endpoints.target);
      path.setAttribute("d", pathData);
    }

    // Update label position and text
    const label = group.querySelector("text");
    if (label) {
      const midX = (endpoints.source.x + endpoints.target.x) / 2;
      const midY = (endpoints.source.y + endpoints.target.y) / 2;
      label.setAttribute("x", midX);
      label.setAttribute("y", midY);

      const connectionType =
        CONNECTION_TYPES[connection.type] || CONNECTION_TYPES.ethernet;
      label.textContent = connection.properties.label || connectionType.name;
    }
  }

  updateConnectionStyle(connectionId, type) {
    const connection = this.app.diagram.connections.get(connectionId);
    if (!connection) return;

    const connectionType = CONNECTION_TYPES[type] || CONNECTION_TYPES.ethernet;
    const path = this.connectionsLayer.querySelector(
      `path[data-connection-id="${connectionId}"]`
    );

    if (path) {
      // Remove old type class
      path.classList.remove(...Object.keys(CONNECTION_TYPES));
      path.classList.add(type);
      path.setAttribute("marker-end", `url(#arrow-${type})`);
    }
  }
}
