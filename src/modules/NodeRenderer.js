import { NODE_TYPES, APPLICATION_TYPES } from "./nodeTypes.js";
import appResources from "../data/appResources.json";

export class NodeRenderer {
  constructor() {
    this.resources = appResources;
  }

  summarizeEnvResources(envs, stats) {
    if (!envs) return;
    envs.forEach((env) => {
      const envData = this.resources.operating_systems[env.type?.toLowerCase()];
      if (envData) {
        stats.totalRam += envData.avgRamMB;
        stats.totalCpu += envData.avgCpuGhz;
        stats.totalStorage += envData.minStorageGB || 20;
      }
      (env.applications || []).forEach((appId) => {
        const appData = this.resources.applications[appId];
        if (appData) {
          stats.totalRam += appData.avgRamMB;
          stats.totalCpu += appData.avgCpuGhz;
          stats.totalStorage += appData.avgStorageGB || 5;
        }
      });
      if (env.osEnvironments) {
        this.summarizeEnvResources(env.osEnvironments, stats);
      }
    });
  }

  calculateResources(node) {
    const nodeType = NODE_TYPES[node.type] || NODE_TYPES.server;
    if (nodeType.category !== "hardware") return null;

    const hwDefaults =
      this.resources.hardware_defaults[node.type] ||
      this.resources.hardware_defaults.server;
    const apps = node.applications || [];

    let stats = { totalRam: 0, totalCpu: 0, totalStorage: 0 };

    // Add base OS resources
    const osType = node.properties.os?.toLowerCase();
    const osData = this.resources.operating_systems[osType];
    if (osData) {
      stats.totalRam += osData.avgRamMB;
      stats.totalCpu += osData.avgCpuGhz;
      stats.totalStorage += osData.minStorageGB || 20;
    }

    // Add OS Environments and their apps (recursive)
    this.summarizeEnvResources(node.osEnvironments, stats);

    apps.forEach((appId) => {
      const appData = this.resources.applications[appId];
      if (appData) {
        stats.totalRam += appData.avgRamMB;
        stats.totalCpu += appData.avgCpuGhz;
        stats.totalStorage += appData.avgStorageGB || 5;
      }
    });

    // Parse user-defined capacities from properties if they exist
    // Use defaults only if property is missing or invalid
    const parseSpec = (val, fallback) => {
      if (!val) return fallback;
      const num = parseFloat(String(val).replace(/[^0-9.]/g, ""));
      return isNaN(num) ? fallback : num;
    };

    const maxCpu = parseSpec(node.properties.cpu, hwDefaults.maxCpuGhz);
    const maxRamGB = parseSpec(node.properties.ram, null);
    const maxRam = maxRamGB ? maxRamGB * 1024 : hwDefaults.maxRamMB;
    const maxStorage = parseSpec(
      node.properties.storage,
      hwDefaults.maxStorageGB || 1024
    );

    return {
      ram: {
        used: stats.totalRam,
        max: maxRam,
        percent: Math.min(100, (stats.totalRam / maxRam) * 100),
      },
      cpu: {
        used: stats.totalCpu,
        max: maxCpu,
        percent: Math.min(100, (stats.totalCpu / maxCpu) * 100),
      },
      storage: {
        used: stats.totalStorage,
        max: maxStorage,
        percent: Math.min(100, (stats.totalStorage / maxStorage) * 100),
      },
    };
  }

  render(node) {
    const nodeType = NODE_TYPES[node.type] || NODE_TYPES.server;
    const isHardware = nodeType.category === "hardware";
    const isExpanded = node.expanded || false;
    const apps = node.applications || [];
    const resourceLoad = isHardware ? this.calculateResources(node) : null;

    const height =
      isExpanded && apps.length > 0
        ? nodeType.expandedHeight
        : nodeType.defaultHeight;

    return `
      <div class="canvas-node ${
        isHardware ? "hardware-node" : "network-node"
      } ${isExpanded ? "expanded" : ""}"
           data-node-id="${node.id}"
           data-node-type="${node.type}"
           style="left: ${node.x}px; top: ${node.y}px; width: ${
      node.width
    }px; min-height: ${height}px; z-index: ${node.zIndex || 1}; --node-color: ${
      nodeType.color
    };">
        
        <div class="node-header">
            <div class="node-icon ${
              nodeType.icon
                ? nodeType.icon + "-icon"
                : nodeType.category + "-icon"
            }">
            </div>
          <div class="node-info">
            <span class="node-title">${
              node.properties.name || nodeType.defaultName
            }</span>
            <span class="node-subtitle">${node.properties.ip || ""}</span>
          </div>
          
          <div class="node-actions">
            ${
              isHardware
                ? `<button class="node-action-btn node-properties-btn mobile-only" 
                          data-action="properties" 
                          title="Properties">
                    <div class="config-icon"></div>
                  </button>`
                : ""
            }
            <button class="node-action-btn node-delete-btn" 
                    data-action="delete" 
                    title="Delete">
              <div class="trash-icon"></div>
            </button>
          </div>
        </div>

        ${
          isHardware
            ? `
          <div class="node-resource-load">
             <div class="load-bar-group">
               <div class="load-label"><span>CPU (${resourceLoad.cpu.max.toFixed(
                 1
               )} GHz)</span> <span>${resourceLoad.cpu.percent.toFixed(
                0
              )}%</span></div>
               <div class="load-bar"><div class="load-fill cpu" data-load-level="${
                 resourceLoad.cpu.percent > 90
                   ? "critical"
                   : resourceLoad.cpu.percent > 70
                   ? "warning"
                   : "normal"
               }" style="width: ${resourceLoad.cpu.percent}%"></div></div>
             </div>
             <div class="load-bar-group">
               <div class="load-label"><span>RAM (${
                 resourceLoad.ram.max >= 1024
                   ? (resourceLoad.ram.max / 1024).toFixed(0) + " GB"
                   : resourceLoad.ram.max + " MB"
               })</span> <span>${resourceLoad.ram.percent.toFixed(
                0
              )}%</span></div>
               <div class="load-bar"><div class="load-fill ram" data-load-level="${
                 resourceLoad.ram.percent > 90
                   ? "critical"
                   : resourceLoad.ram.percent > 70
                   ? "warning"
                   : "normal"
               }" style="width: ${resourceLoad.ram.percent}%"></div></div>
             </div>
             <div class="load-bar-group">
               <div class="load-label"><span>Storage (${
                 resourceLoad.storage.max
               } GB)</span> <span>${resourceLoad.storage.percent.toFixed(
                0
              )}%</span></div>
               <div class="load-bar"><div class="load-fill storage" data-load-level="${
                 resourceLoad.storage.percent > 90
                   ? "critical"
                   : resourceLoad.storage.percent > 70
                   ? "warning"
                   : "normal"
               }" style="width: ${resourceLoad.storage.percent}%"></div></div>
             </div>
          </div>
        `
            : ""
        }

        <div class="node-specs">
          ${
            isHardware && node.properties.os
              ? `<span class="spec-tag os-tag">
                  <span class="spec-icon ${
                    node.properties.osId
                      ? node.properties.osId + "-icon"
                      : "os-icon"
                  }"></span>
                  ${node.properties.os}
                 </span>`
              : ""
          }
          ${
            isHardware && node.properties.ram
              ? `<span class="spec-tag">${node.properties.ram} GB RAM</span>`
              : ""
          }
          ${
            isHardware && node.properties.storage
              ? `<span class="spec-tag">${node.properties.storage} GB Storage</span>`
              : ""
          }
          ${
            !isHardware && node.properties.description
              ? `<span class="spec-tag">${node.properties.description}</span>`
              : ""
          }
        </div>

        ${
          isHardware
            ? `
          <div class="node-apps-container ${
            apps.length > 0 ||
            (node.osEnvironments && node.osEnvironments.length > 0)
              ? "has-apps"
              : ""
          }">
            ${
              apps.length > 0
                ? `
              <div class="node-apps-grid">
                ${apps.map((app) => this.renderAppItem(app)).join("")}
              </div>`
                : ""
            }
            
            ${(node.osEnvironments || [])
              .map((env) => this.renderOSEnvironment(env))
              .join("")}

            ${
              apps.length === 0 &&
              (!node.osEnvironments || node.osEnvironments.length === 0)
                ? '<div class="node-apps-grid"><span class="no-apps">Drop apps or OS here</span></div>'
                : ""
            }
          </div>
        `
            : ""
        }

      </div>
    `;
  }

  renderAppItem(appType) {
    const app = APPLICATION_TYPES[appType];
    if (!app) return "";

    return `
      <div class="node-app-item" data-app="${appType}" title="${app.description}">
        <div class="node-app-icon ${app.icon}-icon"></div>
        <span class="node-app-name">${app.name}</span>
        <button class="node-item-delete" data-action="delete-app" data-app-id="${appType}">
          <div class="trash-icon"></div>
        </button>
      </div>
    `;
  }

  renderOSEnvironment(env) {
    const apps = env.applications || [];
    const subEnvs = env.osEnvironments || [];
    return `
      <div class="os-env-group" data-os-env-id="${env.id}">
        <div class="os-env-header">
          <div class="os-env-icon">
            <div class="${env.typeId ? env.typeId + "-icon" : "os-icon"}"></div>
          </div>
          <span class="os-env-name">${env.type}</span>
          <button class="node-item-delete" data-action="delete-os" data-os-id="${
            env.id
          }">
            <div class="trash-icon"></div>
          </button>
        </div>
        <div class="os-env-content">
          ${
            apps.length > 0
              ? `<div class="node-apps-grid os-env-grid">
                  ${apps.map((app) => this.renderAppItem(app)).join("")}
                </div>`
              : ""
          }
          ${subEnvs.map((sub) => this.renderOSEnvironment(sub)).join("")}
          ${
            apps.length === 0 && subEnvs.length === 0
              ? '<div class="node-apps-grid os-env-grid"><span class="no-apps">Drop apps or OS here</span></div>'
              : ""
          }
        </div>
      </div>
    `;
  }

  updateNodeElement(nodeId, node) {
    const element = document.querySelector(`[data-node-id="${nodeId}"]`);
    if (!element) return;

    const nodeType = NODE_TYPES[node.type] || NODE_TYPES.server;

    // Update title
    const titleEl = element.querySelector(".node-title");
    if (titleEl) {
      titleEl.textContent = node.properties.name || nodeType.defaultName;
    }

    // Update subtitle
    const subtitleEl = element.querySelector(".node-subtitle");
    if (subtitleEl) {
      subtitleEl.textContent = node.properties.ip || "";
    }

    // Update status
    const statusEl = element.querySelector(".node-status");
    if (statusEl) {
      statusEl.className = `node-status ${node.properties.status || "online"}`;
    }

    // Update resource load (for hardware nodes)
    const resourceLoad = this.calculateResources(node);
    if (resourceLoad) {
      const loadContainer = element.querySelector(".node-resource-load");
      if (loadContainer) {
        // CPU Update
        const cpuGroup = loadContainer.querySelector(
          ".load-bar-group:nth-child(1)"
        );
        if (cpuGroup) {
          const labels = cpuGroup.querySelectorAll(".load-label span");
          if (labels[0])
            labels[0].textContent = `CPU (${resourceLoad.cpu.max.toFixed(
              1
            )} GHz)`;
          if (labels[1])
            labels[1].textContent = `${resourceLoad.cpu.percent.toFixed(0)}%`;

          const fill = cpuGroup.querySelector(".load-fill");
          if (fill) {
            fill.style.width = `${resourceLoad.cpu.percent}%`;
            fill.dataset.loadLevel =
              resourceLoad.cpu.percent > 90
                ? "critical"
                : resourceLoad.cpu.percent > 70
                ? "warning"
                : "normal";
          }
        }

        // RAM Update
        const ramGroup = loadContainer.querySelector(
          ".load-bar-group:nth-child(2)"
        );
        if (ramGroup) {
          const labels = ramGroup.querySelectorAll(".load-label span");
          if (labels[0])
            labels[0].textContent = `RAM (${
              resourceLoad.ram.max >= 1024
                ? (resourceLoad.ram.max / 1024).toFixed(0) + " GB"
                : resourceLoad.ram.max + " MB"
            })`;
          if (labels[1])
            labels[1].textContent = `${resourceLoad.ram.percent.toFixed(0)}%`;

          const fill = ramGroup.querySelector(".load-fill");
          if (fill) {
            fill.style.width = `${resourceLoad.ram.percent}%`;
            fill.dataset.loadLevel =
              resourceLoad.ram.percent > 90
                ? "critical"
                : resourceLoad.ram.percent > 70
                ? "warning"
                : "normal";
          }
        }

        // Storage Update
        const storageGroup = loadContainer.querySelector(
          ".load-bar-group:nth-child(3)"
        );
        if (storageGroup) {
          const labels = storageGroup.querySelectorAll(".load-label span");
          if (labels[0])
            labels[0].textContent = `Storage (${resourceLoad.storage.max} GB)`;
          if (labels[1])
            labels[1].textContent = `${resourceLoad.storage.percent.toFixed(
              0
            )}%`;

          const fill = storageGroup.querySelector(".load-fill");
          if (fill) {
            fill.style.width = `${resourceLoad.storage.percent}%`;
            fill.dataset.loadLevel =
              resourceLoad.storage.percent > 90
                ? "critical"
                : resourceLoad.storage.percent > 70
                ? "warning"
                : "normal";
          }
        }

        // Update status indicator based on load
        if (resourceLoad.cpu.percent > 90 || resourceLoad.ram.percent > 90) {
          if (statusEl) statusEl.className = "node-status warning";
        } else if (
          !node.properties.status ||
          node.properties.status === "online"
        ) {
          if (statusEl) statusEl.className = "node-status online";
        }
      }
    }

    // Update specs
    const specsEl = element.querySelector(".node-specs");
    if (specsEl) {
      let specsHTML = "";
      const isHardware = nodeType.category === "hardware";

      if (isHardware) {
        if (node.properties.os) {
          const osId = node.properties.osId || node.properties.os.toLowerCase();
          specsHTML += `<span class="spec-tag os-tag">
                          <span class="spec-icon ${osId + "-icon"}"></span>
                          ${node.properties.os}
                        </span>`;
        }
        if (node.properties.ram)
          specsHTML += `<span class="spec-tag">${node.properties.ram} GB RAM</span>`;
        if (node.properties.storage)
          specsHTML += `<span class="spec-tag">${node.properties.storage} GB Storage</span>`;
      } else if (node.properties.description) {
        specsHTML += `<span class="spec-tag">${node.properties.description}</span>`;
      }

      specsEl.innerHTML = specsHTML;
    }

    // Update apps container
    const apps = node.applications || [];
    const osEnvs = node.osEnvironments || [];
    const appsContainer = element.querySelector(".node-apps-container");

    if (appsContainer) {
      if (apps.length > 0 || osEnvs.length > 0) {
        appsContainer.classList.add("has-apps");

        let html = "";

        // Base apps
        if (apps.length > 0) {
          html += `<div class="node-apps-grid">
                    ${apps.map((app) => this.renderAppItem(app)).join("")}
                   </div>`;
        }

        // OS Environments
        osEnvs.forEach((env) => {
          html += this.renderOSEnvironment(env);
        });

        appsContainer.innerHTML = html;
      } else {
        appsContainer.classList.remove("has-apps");
        appsContainer.innerHTML =
          '<div class="node-apps-grid"><span class="no-apps">Drop apps or OS here</span></div>';
      }
    }
  }
}
