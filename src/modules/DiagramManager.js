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

    const connection = {
      id,
      sourceId,
      targetId,
      type: properties.type || "ethernet",
      properties: {
        ...properties,
      },
    };

    this.connections.set(id, connection);
    this.updateModified();
    return connection;
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

  getConnectionEndpoints(connectionId) {
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
      targetCenter
    );
    const targetPoint = this.getEdgeIntersection(
      targetBounds,
      targetCenter,
      sourceCenter
    );

    return { source: sourcePoint, target: targetPoint };
  }

  getEdgeIntersection(bounds, from, to) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;

    if (dx === 0 && dy === 0) return from;

    const halfWidth = bounds.width / 2;
    const halfHeight = bounds.height / 2;
    const centerX = bounds.left + halfWidth;
    const centerY = bounds.top + halfHeight;

    let t;

    if (Math.abs(dx) * halfHeight > Math.abs(dy) * halfWidth) {
      // Intersects left or right edge
      t = halfWidth / Math.abs(dx);
    } else {
      // Intersects top or bottom edge
      t = halfHeight / Math.abs(dy);
    }

    return {
      x: centerX + dx * t,
      y: centerY + dy * t,
    };
  }
}
