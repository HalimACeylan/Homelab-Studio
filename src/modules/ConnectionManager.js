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
      marker.setAttribute("refX", "10");
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
    // Add a buffer to keep the arrow visible (not hidden under node)
    const endpoints = this.app.diagram.getConnectionEndpoints(connection.id, 5);
    if (!endpoints) return;

    const connectionType =
      CONNECTION_TYPES[connection.type] || CONNECTION_TYPES.ethernet;

    // Create connection group
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.dataset.connectionId = connection.id;
    group.classList.add("connection-group");

    // Create invisible hit area for easier clicking
    const hitArea = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );
    hitArea.setAttribute("fill", "none");
    hitArea.setAttribute("stroke", "transparent");
    hitArea.setAttribute("stroke-width", "20");
    hitArea.setAttribute("pointer-events", "stroke");
    hitArea.style.cursor = "pointer";
    hitArea.dataset.connectionId = connection.id;

    // Create visible path
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.classList.add("connection", connection.type);
    path.dataset.connectionId = connection.id;

    // Calculate bezier curve
    const pathData = this.calculatePath(endpoints.source, endpoints.target);
    hitArea.setAttribute("d", pathData);
    path.setAttribute("d", pathData);
    path.setAttribute("marker-end", `url(#arrow-${connection.type})`);

    // Add click handler to both paths
    const clickHandler = (e) => {
      e.stopPropagation();
      this.app.selectConnection(
        connection.id,
        e.shiftKey || e.ctrlKey || e.metaKey
      );
    };

    const contextHandler = (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.app.selectConnection(connection.id);
      this.app.ui.showContextMenu(e.clientX, e.clientY, null, connection.id);
    };

    hitArea.addEventListener("click", clickHandler);
    hitArea.addEventListener("contextmenu", contextHandler);
    path.addEventListener("click", clickHandler);
    path.addEventListener("contextmenu", contextHandler);

    // Append hit area first (behind visible path)
    group.appendChild(hitArea);
    group.appendChild(path);

    // Add label with node names and bandwidth
    const label = this.createConnectionLabel(connection, endpoints);
    if (label) {
      group.appendChild(label);
    }

    this.connectionsLayer.appendChild(group);
  }

  calculatePath(source, target) {
    return `M ${source.x} ${source.y} L ${target.x} ${target.y}`;
  }

  createConnectionLabel(connection, endpoints) {
    const sourceNode = this.app.diagram.nodes.get(connection.sourceId);
    const targetNode = this.app.diagram.nodes.get(connection.targetId);

    if (!sourceNode || !targetNode) return null;

    const midX = (endpoints.source.x + endpoints.target.x) / 2;
    const midY = (endpoints.source.y + endpoints.target.y) / 2;

    // Check if either node is a user device
    const isUserDevice =
      sourceNode.category === "user-device" ||
      targetNode.category === "user-device";

    // Build label text
    const sourceName =
      sourceNode.properties.name || sourceNode.type || "Unknown";
    const targetName =
      targetNode.properties.name || targetNode.type || "Unknown";
    const bandwidth = connection.properties.bandwidth || "1000";
    const bandwidthUnit = connection.properties.bandwidthUnit || "Mbit";
    const connectionName = connection.properties.name;
    const connectionType =
      CONNECTION_TYPES[connection.type] || CONNECTION_TYPES.ethernet;
    const connectionTypeName = connectionType.name;

    // Create a group for the label
    const labelGroup = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g"
    );
    labelGroup.classList.add("connection-label-group");

    // Background rectangle for better readability
    const bgRect = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "rect"
    );
    bgRect.classList.add("connection-label-bg");

    // Main label text
    const labelText = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text"
    );
    labelText.classList.add("connection-label");
    labelText.setAttribute("x", midX);
    labelText.setAttribute("y", midY);
    labelText.setAttribute("text-anchor", "middle");
    labelText.setAttribute("dominant-baseline", "middle");

    if (isUserDevice) {
      // Simplified label for user devices (Bandwidth only)
      const bandwidthTspan = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "tspan"
      );
      bandwidthTspan.setAttribute("x", midX);
      bandwidthTspan.setAttribute("dy", 0); // Center vertically
      bandwidthTspan.textContent = `${bandwidth} ${bandwidthUnit}`;
      bandwidthTspan.style.fontSize = "10px";
      bandwidthTspan.style.fontWeight = "600";
      bandwidthTspan.style.opacity = "0.9";
      labelText.appendChild(bandwidthTspan);
    } else {
      // Full detailed label for infrastructure
      let yOffset = connectionName ? -17 : -10;

      // Connection name (if exists)
      if (connectionName) {
        const nameTspan = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "tspan"
        );
        nameTspan.setAttribute("x", midX);
        nameTspan.setAttribute("dy", yOffset);
        nameTspan.textContent = connectionName;
        nameTspan.style.fontWeight = "600";
        labelText.appendChild(nameTspan);
        yOffset = 14;
      }

      // Node names
      const nodesTspan = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "tspan"
      );
      nodesTspan.setAttribute("x", midX);
      nodesTspan.setAttribute("dy", yOffset);
      nodesTspan.textContent = `${sourceName} → ${targetName}`;
      nodesTspan.style.fontSize = "11px";
      labelText.appendChild(nodesTspan);

      // Connection Type
      const typeTspan = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "tspan"
      );
      typeTspan.setAttribute("x", midX);
      typeTspan.setAttribute("dy", 14);
      typeTspan.textContent = connectionTypeName;
      typeTspan.style.fontSize = "10px";
      typeTspan.style.opacity = "0.7";
      typeTspan.style.fontStyle = "italic";
      labelText.appendChild(typeTspan);

      // Bandwidth
      const bandwidthTspan = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "tspan"
      );
      bandwidthTspan.setAttribute("x", midX);
      bandwidthTspan.setAttribute("dy", 14);
      bandwidthTspan.textContent = `${bandwidth} ${bandwidthUnit}`;
      bandwidthTspan.style.fontSize = "10px";
      bandwidthTspan.style.opacity = "0.8";
      labelText.appendChild(bandwidthTspan);
    }

    // Calculate background size based on text
    labelGroup.appendChild(labelText);

    // Add background after text to calculate bounds
    setTimeout(() => {
      try {
        const bbox = labelText.getBBox();
        bgRect.setAttribute("x", bbox.x - 4);
        bgRect.setAttribute("y", bbox.y - 2);
        bgRect.setAttribute("width", bbox.width + 8);
        bgRect.setAttribute("height", bbox.height + 4);
        bgRect.setAttribute("rx", "3");
        labelGroup.insertBefore(bgRect, labelText);
      } catch (e) {
        // Fallback if getBBox fails
        const width = isUserDevice ? 60 : 120;
        const height = isUserDevice ? 20 : 60;
        bgRect.setAttribute("x", midX - width / 2);
        bgRect.setAttribute("y", midY - height / 2);
        bgRect.setAttribute("width", width);
        bgRect.setAttribute("height", height);
        bgRect.setAttribute("rx", "3");
        labelGroup.insertBefore(bgRect, labelText);
      }
    }, 0);

    // Add delete button to label group
    const deleteBtn = this.createDeleteButton(connection.id, midX, midY);
    if (deleteBtn) {
      labelGroup.appendChild(deleteBtn);
    }

    return labelGroup;
  }

  createDeleteButton(connectionId, x, y) {
    const btnGroup = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g"
    );
    btnGroup.classList.add("connection-delete-btn");
    btnGroup.dataset.connectionId = connectionId;

    // Background circle
    const circle = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle"
    );
    circle.setAttribute("cx", x);
    circle.setAttribute("cy", y - 40); // Above label
    circle.setAttribute("r", "12");
    circle.classList.add("delete-btn-bg");

    // Trash icon (foreign object for HTML icon)
    const foreignObject = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "foreignObject"
    );
    foreignObject.setAttribute("x", x - 8);
    foreignObject.setAttribute("y", y - 48);
    foreignObject.setAttribute("width", "16");
    foreignObject.setAttribute("height", "16");

    const iconDiv = document.createElement("div");
    iconDiv.className = "trash-icon";
    iconDiv.style.width = "16px";
    iconDiv.style.height = "16px";
    iconDiv.style.color = "white";
    foreignObject.appendChild(iconDiv);

    btnGroup.appendChild(circle);
    btnGroup.appendChild(foreignObject);

    // Click handler
    btnGroup.addEventListener("click", (e) => {
      e.stopPropagation();
      e.preventDefault();
      this.app.removeConnection(connectionId);
    });

    btnGroup.style.cursor = "pointer";

    return btnGroup;
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

    // Add a buffer to keep the arrow visible
    const endpoints = this.app.diagram.getConnectionEndpoints(connectionId, 5);
    if (!endpoints) return;

    const group = this.connectionsLayer.querySelector(
      `g.connection-group[data-connection-id="${connectionId}"]`
    );
    if (!group) return;

    // Update paths
    const paths = group.querySelectorAll("path");
    if (paths.length > 0) {
      const pathData = this.calculatePath(endpoints.source, endpoints.target);
      paths.forEach((p) => p.setAttribute("d", pathData));
    }

    // Update label
    this.updateConnectionLabel(connectionId);
  }

  updateConnectionLabel(connectionId) {
    const connection = this.app.diagram.connections.get(connectionId);
    if (!connection) return;

    const endpoints = this.app.diagram.getConnectionEndpoints(connectionId, 5);
    if (!endpoints) return;

    const group = this.connectionsLayer.querySelector(
      `g.connection-group[data-connection-id="${connectionId}"]`
    );
    if (!group) return;

    // Remove old label
    const oldLabel = group.querySelector(".connection-label-group");
    if (oldLabel) {
      oldLabel.remove();
    }

    // Add new label
    const newLabel = this.createConnectionLabel(connection, endpoints);
    if (newLabel) {
      group.appendChild(newLabel);
    }
  }

  updateConnectionStyle(connectionId, type) {
    const connection = this.app.diagram.connections.get(connectionId);
    if (!connection) return;

    const connectionType = CONNECTION_TYPES[type] || CONNECTION_TYPES.ethernet;

    // Find the connection group first, then the visible path inside it
    const group = this.connectionsLayer.querySelector(
      `g.connection-group[data-connection-id="${connectionId}"]`
    );

    if (!group) return;

    // Get the visible path (not the hit area)
    const paths = group.querySelectorAll("path.connection");

    paths.forEach((path) => {
      // Remove old type class
      path.classList.remove(...Object.keys(CONNECTION_TYPES));
      path.classList.add(type);
      path.setAttribute("marker-end", `url(#arrow-${type})`);
    });

    // Update the label to reflect the new connection type
    this.updateConnectionLabel(connectionId);
  }
}
