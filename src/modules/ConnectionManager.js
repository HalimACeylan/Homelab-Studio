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

    // Calculate path with waypoints
    const pathData = this.calculatePath(
      endpoints.source,
      endpoints.target,
      connection.waypoints
    );
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

    // Add waypoint control points
    if (connection.waypoints && connection.waypoints.length > 0) {
      connection.waypoints.forEach((wp, index) => {
        // Determine control point type
        let type = "normal";
        if (index === 0) type = "start";
        else if (index === connection.waypoints.length - 1) type = "end";

        const controlPoint = this.createControlPoint(
          connection.id,
          index,
          wp.x,
          wp.y,
          type
        );
        group.appendChild(controlPoint);
      });
    }

    // Add label with node names and bandwidth
    const label = this.createConnectionLabel(connection, endpoints);
    if (label) {
      group.appendChild(label);
    }

    this.connectionsLayer.appendChild(group);
  }

  calculatePath(source, target, waypoints = []) {
    if (!waypoints || waypoints.length === 0) {
      // Direct line when no waypoints
      return `M ${source.x} ${source.y} L ${target.x} ${target.y}`;
    }

    // Build path through waypoints - starts at first waypoint (first dot)
    let pathData = `M ${waypoints[0].x} ${waypoints[0].y}`;
    for (let i = 1; i < waypoints.length; i++) {
      pathData += ` L ${waypoints[i].x} ${waypoints[i].y}`;
    }
    return pathData;
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

  createControlPoint(connectionId, waypointIndex, x, y, type = "normal") {
    const cpGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    cpGroup.classList.add("connection-control-point");
    cpGroup.dataset.connectionId = connectionId;
    cpGroup.dataset.waypointIndex = waypointIndex;
    cpGroup.dataset.controlType = type;

    // All control points are circles
    // Outer circle (larger for easier grabbing)
    const outerCircle = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle"
    );
    outerCircle.setAttribute("cx", x);
    outerCircle.setAttribute("cy", y);
    outerCircle.setAttribute("r", "6");
    outerCircle.classList.add("control-point-outer");

    // Inner circle (visual dot) - color based on type
    const innerCircle = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle"
    );
    innerCircle.setAttribute("cx", x);
    innerCircle.setAttribute("cy", y);
    innerCircle.setAttribute("r", "3");
    innerCircle.classList.add("control-point-inner");

    // Add type-specific class for coloring
    if (type === "start") {
      innerCircle.classList.add("control-point-start");
    } else if (type === "end") {
      innerCircle.classList.add("control-point-end");
    }

    cpGroup.appendChild(outerCircle);
    cpGroup.appendChild(innerCircle);

    // Drag handlers
    let isDragging = false;
    let startX, startY;

    const handleMouseDown = (e) => {
      e.stopPropagation();
      e.preventDefault();
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      cpGroup.classList.add("dragging");
    };

    const handleMouseMove = (e) => {
      if (!isDragging) return;
      e.stopPropagation();

      const connection = this.app.diagram.connections.get(connectionId);
      if (!connection || !connection.waypoints[waypointIndex]) return;

      // Get SVG coordinates
      const svg = this.connectionsLayer;
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());

      // Handle start/end points differently - constrain to node boundary
      if (waypointIndex === 0) {
        // Start point - constrain to source node
        const sourceNode = this.app.diagram.nodes.get(connection.sourceId);
        if (sourceNode) {
          const anchor = this.calculateNodeAnchor(svgP.x, svgP.y, sourceNode);
          connection.sourceAnchor = anchor;
          const pos = this.getAnchorPosition(sourceNode, anchor);
          connection.waypoints[waypointIndex] = { x: pos.x, y: pos.y };
        }
      } else if (waypointIndex === connection.waypoints.length - 1) {
        // End point - constrain to target node
        const targetNode = this.app.diagram.nodes.get(connection.targetId);
        if (targetNode) {
          const anchor = this.calculateNodeAnchor(svgP.x, svgP.y, targetNode);
          connection.targetAnchor = anchor;
          const pos = this.getAnchorPosition(targetNode, anchor);
          connection.waypoints[waypointIndex] = { x: pos.x, y: pos.y };
        }
      } else {
        // Middle waypoints - free movement
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        startX = e.clientX;
        startY = e.clientY;
        connection.waypoints[waypointIndex].x += dx;
        connection.waypoints[waypointIndex].y += dy;
      }

      this.updateConnection(connectionId);
    };

    const handleMouseUp = (e) => {
      if (isDragging) {
        e.stopPropagation();
        isDragging = false;
        cpGroup.classList.remove("dragging");

        // Only lock waypoints if user manually adjusted MIDDLE waypoints
        // Start/end points should always stick to nodes
        const connection = this.app.diagram.connections.get(connectionId);
        if (
          connection &&
          waypointIndex !== 0 &&
          waypointIndex !== connection.waypoints.length - 1
        ) {
          connection.waypointsLocked = true;
        }

        this.app.diagram.updateModified();
      }
    };

    cpGroup.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    // Touch support
    cpGroup.addEventListener("touchstart", (e) => {
      e.stopPropagation();
      const touch = e.touches[0];
      handleMouseDown({
        clientX: touch.clientX,
        clientY: touch.clientY,
        stopPropagation: () => {},
        preventDefault: () => {},
      });
    });

    cpGroup.style.cursor = "move";

    return cpGroup;
  }

  calculateNodeAnchor(x, y, node) {
    // Determine which side of the node is closest and offset along that side
    const centerX = node.x + node.width / 2;
    const centerY = node.y + node.height / 2;

    const dx = x - centerX;
    const dy = y - centerY;

    // Determine side based on angle
    const angle = Math.atan2(dy, dx);
    const absAngle = Math.abs(angle);

    let side, offset;

    if (absAngle < Math.PI / 4) {
      // Right side
      side = "right";
      offset = Math.max(0, Math.min(1, (y - node.y) / node.height));
    } else if (absAngle > (3 * Math.PI) / 4) {
      // Left side
      side = "left";
      offset = Math.max(0, Math.min(1, (y - node.y) / node.height));
    } else if (angle > 0) {
      // Bottom side
      side = "bottom";
      offset = Math.max(0, Math.min(1, (x - node.x) / node.width));
    } else {
      // Top side
      side = "top";
      offset = Math.max(0, Math.min(1, (x - node.x) / node.width));
    }

    return { side, offset };
  }

  getAnchorPosition(node, anchor) {
    const { side, offset } = anchor;
    let x, y;

    switch (side) {
      case "right":
        x = node.x + node.width;
        y = node.y + offset * node.height;
        break;
      case "left":
        x = node.x;
        y = node.y + offset * node.height;
        break;
      case "top":
        x = node.x + offset * node.width;
        y = node.y;
        break;
      case "bottom":
        x = node.x + offset * node.width;
        y = node.y + node.height;
        break;
      default:
        x = node.x + node.width;
        y = node.y + node.height / 2;
    }

    return { x, y };
  }

  addWaypointAtPosition(connectionId, x, y) {
    const connection = this.app.diagram.connections.get(connectionId);
    if (!connection) return;

    if (!connection.waypoints) {
      connection.waypoints = [];
    }

    // Add new waypoint
    console.log(
      "Adding waypoint at:",
      x,
      y,
      "Total waypoints:",
      connection.waypoints.length + 1
    );
    connection.waypoints.push({ x, y });
    this.updateConnection(connectionId);
    this.app.diagram.updateModified();
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

    // Always update start/end waypoints based on anchor positions
    // (they should always stick to nodes)
    if (connection.waypoints && connection.waypoints.length === 5) {
      const sourceNode = this.app.diagram.nodes.get(connection.sourceId);
      const targetNode = this.app.diagram.nodes.get(connection.targetId);

      if (sourceNode && targetNode) {
        // Always update start and end positions
        const startPos = this.getAnchorPosition(
          sourceNode,
          connection.sourceAnchor
        );
        const endPos = this.getAnchorPosition(
          targetNode,
          connection.targetAnchor
        );

        connection.waypoints[0] = { x: startPos.x, y: startPos.y };
        connection.waypoints[4] = { x: endPos.x, y: endPos.y };

        // Only update middle waypoints if not locked
        if (!connection.waypointsLocked) {
          const startX = startPos.x;
          const startY = startPos.y;
          const endX = endPos.x;
          const endY = endPos.y;

          connection.waypoints[1] = {
            x: startX + (endX - startX) * 0.25,
            y: startY + (endY - startY) * 0.25,
          };
          connection.waypoints[2] = {
            x: startX + (endX - startX) * 0.5,
            y: startY + (endY - startY) * 0.5,
          };
          connection.waypoints[3] = {
            x: startX + (endX - startX) * 0.75,
            y: startY + (endY - startY) * 0.75,
          };
        }
      }
    }

    const group = this.connectionsLayer.querySelector(
      `g.connection-group[data-connection-id="${connectionId}"]`
    );
    if (!group) return;

    // Update paths with waypoints
    const paths = group.querySelectorAll("path");
    if (paths.length > 0) {
      const pathData = this.calculatePath(
        endpoints.source,
        endpoints.target,
        connection.waypoints
      );
      paths.forEach((p) => p.setAttribute("d", pathData));
    }

    // Remove old control points
    const oldControlPoints = group.querySelectorAll(
      ".connection-control-point"
    );
    oldControlPoints.forEach((cp) => cp.remove());

    // Re-add control points if waypoints exist
    if (connection.waypoints && connection.waypoints.length > 0) {
      connection.waypoints.forEach((wp, index) => {
        // Determine control point type
        let type = "normal";
        if (index === 0) type = "start";
        else if (index === connection.waypoints.length - 1) type = "end";

        const controlPoint = this.createControlPoint(
          connection.id,
          index,
          wp.x,
          wp.y,
          type
        );
        // Insert before label
        const label = group.querySelector(".connection-label-group");
        if (label) {
          group.insertBefore(controlPoint, label);
        } else {
          group.appendChild(controlPoint);
        }
      });
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
