/**
 * DiagramManager - Manages the diagram data model
 */

import { generateId } from "./utils.js";
import { NODE_TYPES, APPLICATION_TYPES } from "./nodeTypes.js";

export class DiagramManager {
  constructor() {
    this.nodes = new Map();
    this.connections = new Map();
    this.groups = new Map();
    this.textItems = new Map();
    this.metadata = {
      name: "Untitled Diagram",
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
    };
  }

  createNode(type, x, y, properties = {}) {
    const nodeType = NODE_TYPES[type] || NODE_TYPES.server;
    const id = generateId("node");

    const node = {
      id,
      type,
      category: nodeType.category,
      x,
      y,
      width: nodeType.defaultWidth || 140,
      height: nodeType.defaultHeight || 90,
      expanded: false,
      applications: [],
      osEnvironments: [], // Added for OS-based grouping
      properties: {
        name: properties.name || nodeType.defaultName,
        description: properties.description || "",
        status: properties.status || "online",
        ip: properties.ip || "",
        ...properties,
      },
      zIndex: this.nodes.size + 1,
    };

    this.nodes.set(id, node);
    this.updateModified();
    return node;
  }

  addOSEnvironment(nodeId, osType, typeId, parentEnvId = null) {
    const node = this.nodes.get(nodeId);
    if (!node) return false;

    if (!node.osEnvironments) {
      node.osEnvironments = [];
    }

    const id = generateId("os-env");
    const newEnv = {
      id,
      type: osType,
      typeId, // Added explicitly
      applications: [],
      osEnvironments: [],
    };

    if (parentEnvId) {
      const parentEnv = this.findOSEnvironment(
        node.osEnvironments,
        parentEnvId
      );
      if (parentEnv) {
        if (!parentEnv.osEnvironments) parentEnv.osEnvironments = [];
        parentEnv.osEnvironments.push(newEnv);
      } else {
        node.osEnvironments.push(newEnv);
      }
    } else {
      node.osEnvironments.push(newEnv);
    }

    node.expanded = true;
    this.updateModified();
    return true;
  }

  removeOSEnvironment(nodeId, osEnvId) {
    const node = this.nodes.get(nodeId);
    if (!node) return false;

    const removeFromList = (envs) => {
      const index = envs.findIndex((e) => e.id === osEnvId);
      if (index !== -1) {
        envs.splice(index, 1);
        return true;
      }
      for (const env of envs) {
        if (env.osEnvironments && removeFromList(env.osEnvironments)) {
          return true;
        }
      }
      return false;
    };

    if (removeFromList(node.osEnvironments)) {
      this.updateModified();
      return true;
    }
    return false;
  }

  findOSEnvironment(envs, targetId) {
    if (!envs) return null;
    for (const env of envs) {
      if (env.id === targetId) return env;
      if (env.osEnvironments) {
        const found = this.findOSEnvironment(env.osEnvironments, targetId);
        if (found) return found;
      }
    }
    return null;
  }

  addApplicationToNode(nodeId, appType, osEnvId = null) {
    const node = this.nodes.get(nodeId);
    if (!node) return false;

    // Ensure backwards compatibility
    if (!node.applications) node.applications = [];
    if (!node.osEnvironments) node.osEnvironments = [];

    // Check if this application should behave as an OS environment (like Docker)
    const appInfo = APPLICATION_TYPES[appType];
    const isVOSApp = appInfo && appInfo.category === "v-os";

    // If it's a v-os application (like Docker), create it as an OS environment
    if (isVOSApp) {
      const envName = appInfo.name;
      return this.addOSEnvironment(nodeId, envName, appType, osEnvId);
    }

    // If osEnvId is provided, add to that environment (recursive search)
    if (osEnvId) {
      const osEnv = this.findOSEnvironment(node.osEnvironments, osEnvId);
      if (osEnv) {
        if (!osEnv.applications.includes(appType)) {
          osEnv.applications.push(appType);
          node.expanded = true;
          this.updateModified();
          return true;
        }
        return false;
      }
    }

    // Default: add to base applications
    if (!node.applications.includes(appType)) {
      node.applications.push(appType);
      node.expanded = true;
      this.updateModified();
      return true;
    }
    return false;
  }

  removeApplicationFromNode(nodeId, appType, osEnvId = null) {
    const node = this.nodes.get(nodeId);
    if (!node) return false;

    if (osEnvId) {
      const osEnv = this.findOSEnvironment(node.osEnvironments, osEnvId);
      if (osEnv && osEnv.applications) {
        const index = osEnv.applications.indexOf(appType);
        if (index !== -1) {
          osEnv.applications.splice(index, 1);
          this.updateModified();
          return true;
        }
      }
    } else if (node.applications) {
      const index = node.applications.indexOf(appType);
      if (index !== -1) {
        node.applications.splice(index, 1);
        this.updateModified();
        return true;
      }
    }
    return false;
  }

  toggleNodeExpanded(nodeId) {
    const node = this.nodes.get(nodeId);
    if (!node) return;

    node.expanded = !node.expanded;
    this.updateModified();
    return node.expanded;
  }

  updateNode(nodeId, updates) {
    const node = this.nodes.get(nodeId);
    if (!node) return null;

    Object.assign(node, updates);
    if (updates.properties) {
      Object.assign(node.properties, updates.properties);
    }

    this.updateModified();
    return node;
  }

  removeNode(nodeId) {
    this.nodes.delete(nodeId);
    this.updateModified();
  }

  importNode(nodeData) {
    this.nodes.set(nodeData.id, { ...nodeData });
    return nodeData;
  }

  createConnection(sourceId, targetId, properties = {}) {
    const id = generateId("conn");

    // Calculate which sides are closest between the two nodes
    const sourceNode = this.nodes.get(sourceId);
    const targetNode = this.nodes.get(targetId);

    let sourceSide = "right";
    let targetSide = "left";

    if (sourceNode && targetNode) {
      // Calculate node centers
      const sourceCenterX = sourceNode.x + sourceNode.width / 2;
      const sourceCenterY = sourceNode.y + sourceNode.height / 2;
      const targetCenterX = targetNode.x + targetNode.width / 2;
      const targetCenterY = targetNode.y + targetNode.height / 2;

      // Calculate angle from source to target
      const dx = targetCenterX - sourceCenterX;
      const dy = targetCenterY - sourceCenterY;
      const angle = Math.atan2(dy, dx);
      const absAngle = Math.abs(angle);

      // Determine source side based on direction to target
      if (absAngle < Math.PI / 4) {
        sourceSide = "right";
        targetSide = "left";
      } else if (absAngle > (3 * Math.PI) / 4) {
        sourceSide = "left";
        targetSide = "right";
      } else if (angle > 0) {
        sourceSide = "bottom";
        targetSide = "top";
      } else {
        sourceSide = "top";
        targetSide = "bottom";
      }
    }

    // Calculate unique anchor positions to avoid overlapping connections
    // Count existing connections from source and to target
    const sourceConnections = Array.from(this.connections.values()).filter(
      (c) => c.sourceId === sourceId
    );
    const targetConnections = Array.from(this.connections.values()).filter(
      (c) => c.targetId === targetId
    );

    // Distribute connections evenly along the edge
    const sourceCount = sourceConnections.length + 1; // +1 for the new connection
    const targetCount = targetConnections.length + 1;

    // Calculate offset for this connection (evenly distributed)
    const sourceOffset = sourceConnections.length / sourceCount;
    const targetOffset = targetConnections.length / targetCount;

    // Initialize anchor points with unique positions
    const sourceAnchor = properties.sourceAnchor || {
      side: sourceSide,
      offset: Math.max(0.1, Math.min(0.9, sourceOffset)), // Keep within 10-90% range
    };

    const targetAnchor = properties.targetAnchor || {
      side: targetSide,
      offset: Math.max(0.1, Math.min(0.9, targetOffset)),
    };

    // NOW create waypoints using the calculated anchor positions
    let waypoints = properties.waypoints;
    if (!waypoints) {
      if (sourceNode && targetNode) {
        // Calculate actual anchor positions on node edges
        const startPos = this.getAnchorPosition(sourceNode, sourceAnchor);
        const endPos = this.getAnchorPosition(targetNode, targetAnchor);

        const startX = startPos.x;
        const startY = startPos.y;
        const endX = endPos.x;
        const endY = endPos.y;

        // Create 4 waypoints along the straight line
        waypoints = [
          { x: startX, y: startY },
          {
            x: startX + (endX - startX) * 0.33,
            y: startY + (endY - startY) * 0.33,
          },
          {
            x: startX + (endX - startX) * 0.67,
            y: startY + (endY - startY) * 0.67,
          },
          { x: endX, y: endY },
        ];
      } else {
        waypoints = [];
      }
    }

    const connection = {
      id,
      sourceId,
      targetId,
      type: properties.type || "ethernet",
      waypoints: waypoints,
      waypointsLocked: false, // True if user has manually adjusted waypoints
      sourceAnchor, // Attachment point on source
      targetAnchor, // Attachment point on target
      properties: {
        ...properties,
      },
    };

    this.connections.set(id, connection);
    this.updateModified();
    return connection;
  }

  createTextItem(x, y, text = "New Text") {
    const id = generateId("text");
    const textItem = {
      id,
      x,
      y,
      text,
      fontSize: 14,
      color: "#ffffff",
    };
    this.textItems.set(id, textItem);
    this.updateModified();
    return textItem;
  }

  updateTextItem(id, updates) {
    const item = this.textItems.get(id);
    if (!item) return null;
    Object.assign(item, updates);
    this.updateModified();
    return item;
  }

  deleteTextItem(id) {
    const deleted = this.textItems.delete(id);
    if (deleted) {
      this.updateModified();
    }
    return deleted;
  }

  importTextItem(itemData) {
    this.textItems.set(itemData.id, { ...itemData });
    return itemData;
  }

  updateConnection(connectionId, updates) {
    const connection = this.connections.get(connectionId);
    if (!connection) return null;

    Object.assign(connection, updates);
    if (updates.properties) {
      Object.assign(connection.properties, updates.properties);
    }

    this.updateModified();
    return connection;
  }

  removeConnection(connectionId) {
    this.connections.delete(connectionId);
    this.updateModified();
  }

  importConnection(connData) {
    this.connections.set(connData.id, { ...connData });
    return connData;
  }

  createGroup(nodeIds, name = "Network Group") {
    const id = generateId("group");
    const group = {
      id,
      name,
      nodeIds: [...nodeIds], // Copy array
      type: "network",
      // Random nicely selected colors
      color: ["#ff4444", "#58a6ff", "#00c853", "#ffab00", "#aa00ff", "#ff4081"][
        Math.floor(Math.random() * 6)
      ],
    };
    this.groups.set(id, group);
    this.updateModified();
    return group;
  }

  updateGroup(groupId, updates) {
    const group = this.groups.get(groupId);
    if (!group) return null;
    Object.assign(group, updates);
    this.updateModified();
    return group;
  }

  removeGroup(groupId) {
    this.groups.delete(groupId);
    this.updateModified();
  }

  importGroup(groupData) {
    this.groups.set(groupData.id, { ...groupData });
    return groupData;
  }

  clear() {
    this.nodes.clear();
    this.connections.clear();
    this.groups.clear();
    this.metadata.modified = new Date().toISOString();
  }

  updateModified() {
    this.metadata.modified = new Date().toISOString();
  }

  export() {
    return {
      version: "1.0.0",
      metadata: this.metadata,
      groups: Array.from(this.groups.values()),
      nodes: Array.from(this.nodes.values()),
      connections: Array.from(this.connections.values()),
    };
  }

  getNodeCenter(nodeId) {
    const node = this.nodes.get(nodeId);
    if (!node) return { x: 0, y: 0 };

    return {
      x: node.x + node.width / 2,
      y: node.y + node.height / 2,
    };
  }

  getNodeBounds(nodeId) {
    const node = this.nodes.get(nodeId);
    if (!node) return null;

    return {
      left: node.x,
      top: node.y,
      right: node.x + node.width,
      bottom: node.y + node.height,
      width: node.width,
      height: node.height,
    };
  }

  getConnectionEndpoints(connectionId, buffer = 0) {
    const connection = this.connections.get(connectionId);
    if (!connection) return null;

    const sourceCenter = this.getNodeCenter(connection.sourceId);
    const targetCenter = this.getNodeCenter(connection.targetId);
    const sourceBounds = this.getNodeBounds(connection.sourceId);
    const targetBounds = this.getNodeBounds(connection.targetId);

    if (!sourceBounds || !targetBounds) return null;

    // Calculate intersection points with node edges
    const sourcePoint = this.getEdgeIntersection(
      sourceBounds,
      sourceCenter,
      targetCenter,
      buffer
    );
    const targetPoint = this.getEdgeIntersection(
      targetBounds,
      targetCenter,
      sourceCenter,
      buffer
    );

    return { source: sourcePoint, target: targetPoint };
  }

  getEdgeIntersection(bounds, from, to, buffer = 0) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;

    if (dx === 0 && dy === 0) return from;

    const halfWidth = bounds.width / 2;
    const halfHeight = bounds.height / 2;
    const centerX = bounds.left + halfWidth;
    const centerY = bounds.top + halfHeight;

    let t;

    // Expand bounds by buffer for calculating intersection
    const bufferedHalfWidth = halfWidth + buffer;
    const bufferedHalfHeight = halfHeight + buffer;

    if (Math.abs(dx) * halfHeight > Math.abs(dy) * halfWidth) {
      // Intersects left or right edge
      // Adjust t calculation to use buffered dimensions
      // But t is ratio along the vector (dx, dy).
      // Vector starts at 'from' (center).
      // t=1 means 'to'.
      // We want point on edge.
      // x = center + halfWidth.
      // dx*t = halfWidth -> t = halfWidth/dx.

      // If we want a buffer GAP, we should STOP SHORT.
      // So we want the effective bounds to be larger? No, that puts the point further OUT.
      // We want the point further IN? No, the arrow is outside.
      // Wait, if the arrow is BEHIND the node, we want to push the point OUTWARD so the arrow tip is visible?
      // Or do we want the line to stop BEFORE the node so the arrow (which is at the end of line) is visible?

      // If the arrow is drawn at the END of the path:
      // Point P is on the edge.
      // Arrow is at P.
      // If node covers P, arrow is covered.
      // We want P to be OUTSIDE the node.
      // So we want to inflate the bounds?
      // Yes, if we inflate the bounds, the intersection P moves away from center.
      // So buffer > 0 means inflate.

      t = bufferedHalfWidth / Math.abs(dx);
    } else {
      // Intersects top or bottom edge
      t = bufferedHalfHeight / Math.abs(dy);
    }

    return {
      x: centerX + dx * t,
      y: centerY + dy * t,
    };
  }

  // Helper method to calculate anchor position on node
  getAnchorPosition(node, anchor) {
    const { side, offset } = anchor;
    const padding = 5; // 5px inside the border for better UI
    let x, y;

    switch (side) {
      case "right":
        x = node.x + node.width - padding;
        y = node.y + padding + offset * (node.height - 2 * padding);
        break;
      case "left":
        x = node.x + padding;
        y = node.y + padding + offset * (node.height - 2 * padding);
        break;
      case "top":
        x = node.x + padding + offset * (node.width - 2 * padding);
        y = node.y + padding;
        break;
      case "bottom":
        x = node.x + padding + offset * (node.width - 2 * padding);
        y = node.y + node.height - padding;
        break;
      default:
        x = node.x + node.width - padding;
        y = node.y + node.height / 2;
    }

    return { x, y };
  }
}
