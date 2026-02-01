import { NODE_TYPES, APPLICATION_TYPES } from "./nodeTypes.js";
import appResources from "../data/appResources.json";

export class NodeRenderer {
  constructor() {
    this.icons = this.createIconSVGs();
    this.resources = appResources;
  }

  createIconSVGs() {
    return {
      // Category fallback icons
      hardware: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="2" y="3" width="20" height="6" rx="1"></rect>
        <rect x="2" y="11" width="20" height="6" rx="1"></rect>
        <circle cx="6" cy="6" r="1" fill="currentColor"></circle>
        <circle cx="6" cy="14" r="1" fill="currentColor"></circle>
      </svg>`,
      network: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="2" y="10" width="20" height="8" rx="2"></rect>
        <circle cx="6" cy="14" r="1.5" fill="currentColor"></circle>
        <line x1="10" y1="14" x2="18" y2="14"></line>
        <path d="M8 6 L12 2 L16 6"></path>
      </svg>`,
      os: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="12" cy="12" r="10"></circle>
        <circle cx="12" cy="6" r="2"></circle>
        <circle cx="12" cy="18" r="2"></circle>
        <circle cx="6" cy="12" r="2"></circle>
      </svg>`,
      service: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="3" y="3" width="18" height="18" rx="2"></rect>
        <path d="M9 9h6v6H9z"></path>
      </svg>`,

      // Specific node icons
      server: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="2" y="3" width="20" height="6" rx="1"></rect>
        <rect x="2" y="11" width="20" height="6" rx="1"></rect>
        <circle cx="6" cy="6" r="1" fill="currentColor"></circle>
        <circle cx="6" cy="14" r="1" fill="currentColor"></circle>
      </svg>`,
      nas: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="2" y="4" width="20" height="16" rx="2"></rect>
        <line x1="6" y1="8" x2="6" y2="16"></line>
        <line x1="10" y1="8" x2="10" y2="16"></line>
        <line x1="14" y1="8" x2="14" y2="16"></line>
        <line x1="18" y1="8" x2="18" y2="16"></line>
      </svg>`,
      "raspberry-pi": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="4" y="6" width="16" height="12" rx="2"></rect>
        <circle cx="8" cy="12" r="2"></circle>
        <circle cx="16" cy="12" r="2"></circle>
        <line x1="2" y1="9" x2="4" y2="9"></line>
        <line x1="2" y1="15" x2="4" y2="15"></line>
      </svg>`,
      router: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="2" y="10" width="20" height="8" rx="2"></rect>
        <circle cx="6" cy="14" r="1.5" fill="currentColor"></circle>
        <line x1="10" y1="14" x2="18" y2="14"></line>
        <path d="M8 6 L12 2 L16 6"></path>
      </svg>`,
      switch: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="2" y="8" width="20" height="8" rx="1"></rect>
        <line x1="6" y1="11" x2="6" y2="13"></line>
        <line x1="10" y1="11" x2="10" y2="13"></line>
        <line x1="14" y1="11" x2="14" y2="13"></line>
        <line x1="18" y1="11" x2="18" y2="13"></line>
      </svg>`,
      ubuntu: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="12" cy="12" r="10"></circle>
        <circle cx="12" cy="6" r="2"></circle>
        <circle cx="12" cy="18" r="2"></circle>
        <circle cx="6" cy="12" r="2"></circle>
      </svg>`,
      debian: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M12 2C7.58 2 4 5.58 4 10c0 5.5 4.5 9 8 12 3.5-3 8-6.5 8-12 0-4.42-3.58-8-8-8z"></path>
      </svg>`,
      windows: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M3 5L10 4V11H3V5ZM3 13H10V20L3 19V13ZM11 11V3.5L21 2V11H11ZM11 13H21V22L11 20.5V13Z"></path>
      </svg>`,
      macos: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M17.05 20.28c-.96.95-2.06 1.72-3.23 1.72-1.16 0-1.54-.74-2.83-.74-1.29 0-1.74.72-2.82.72-1.07 0-2.1-.69-3.23-1.72-2.31-2.1-3.64-5.26-3.64-8.08 0-2.83 1.7-4.32 3.39-4.32.89 0 1.74.5 2.45.5.71 0 1.63-.51 2.53-.51 1.34 0 2.52.61 3.25 1.58-2.65 1.5-2.21 4.71.49 5.86-.48 1.1-.96 2.16-1.5 3.03l-.08.06zM12.03 5.46c-.03-2.13 1.83-3.95 3.86-4.04.14 2.19-1.52 4-3.86 4.04z"></path>
      </svg>`,
      casaos: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        <polyline points="9 22 9 12 15 12 15 22"></polyline>
      </svg>`,
      umbrel: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M12 22v-4M8 18l4 4 4-4M12 2v10M12 12L8 8M12 12l4-4"></path>
        <circle cx="12" cy="12" r="10"></circle>
      </svg>`,
      yunohost: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
      </svg>`,
      unraid: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="2" y="2" width="20" height="20" rx="2"></rect>
        <path d="M7 7h10M7 12h10M7 17h10"></path>
      </svg>`,
      truenas_scale_os: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M20 7h-9m9 4h-11m11 4h-13M3 7h2m-2 4h4m-4 4h6"></path>
        <rect x="2" y="3" width="20" height="18" rx="2"></rect>
      </svg>`,
      startos: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      </svg>`,
      omv: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M12 2v20M2 12h20"></path>
      </svg>`,
      proxmox_os: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M4 4l16 16M4 20L20 4M12 4v16M4 12h16"></path>
        <circle cx="12" cy="12" r="10"></circle>
      </svg>`,
      xcp_ng: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
        <path d="M12 12v10"></path>
      </svg>`,
      esxi: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="2" y="2" width="20" height="20" rx="2"></rect>
        <path d="M6 6h12v12H6zM10 10h4v4h-4z"></path>
      </svg>`,
      harvester: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M12 2L2 12l10 10 10-10L12 2zM7 12h10M12 7v10"></path>
      </svg>`,
      ovirt: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M12 2c5.52 0 10 4.48 10 10s-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2zm0 4v12M6 12h12"></path>
      </svg>`,
      opennebula: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M12 2L2 12l10 10 10-10L12 2z"></path>
        <circle cx="12" cy="12" r="4"></circle>
      </svg>`,
      citrix: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M12 8v8M8 12h8"></path>
        <path d="M15 15l-6-6"></path>
      </svg>`,
      oracle_vm: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <ellipse cx="12" cy="12" rx="10" ry="6"></ellipse>
        <circle cx="12" cy="12" r="2"></circle>
      </svg>`,
      smartos: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
        <path d="M2 17l10 5 10-5V7l-10 5-10-5v10z"></path>
      </svg>`,
      trash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
      </svg>`,
    };
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
    }px; height: ${node.height || height}px; z-index: ${
      node.zIndex || 1
    }; --node-color: ${nodeType.color};">
        
        <div class="node-header">
          <div class="node-icon" style="color: ${nodeType.color}">
            ${
              this.icons[node.type] ||
              this.icons[nodeType.category] ||
              this.icons.server
            }
          </div>
          <div class="node-info">
            <span class="node-title">${
              node.properties.name || nodeType.defaultName
            }</span>
            <span class="node-subtitle">${node.properties.ip || ""}</span>
          </div>
        </div>

        <div class="node-content">
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
                  <span class="spec-icon">${
                    this.icons[node.properties.os.toLowerCase()] || ""
                  }</span>
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

        <div class="node-ports">
          <div class="node-port port-left" data-port="left"></div>
          <div class="node-port port-right" data-port="right"></div>
        </div>

        <!-- Resize Handles -->
        <div class="node-resizer resizer-top" data-resize="top"></div>
        <div class="node-resizer resizer-bottom" data-resize="bottom"></div>
        <div class="node-resizer resizer-left" data-resize="left"></div>
        <div class="node-resizer resizer-right" data-resize="right"></div>
        <div class="node-resizer resizer-top-left" data-resize="top-left"></div>
        <div class="node-resizer resizer-top-right" data-resize="top-right"></div>
        <div class="node-resizer resizer-bottom-left" data-resize="bottom-left"></div>
        <div class="node-resizer resizer-bottom-right" data-resize="bottom-right"></div>
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
          ${this.icons.trash}
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
            ${
              this.icons[env.typeId] ||
              this.icons[env.type?.toLowerCase()] ||
              this.icons.os
            }
          </div>
          <span class="os-env-name">${env.type}</span>
          <button class="node-item-delete" data-action="delete-os" data-os-id="${
            env.id
          }">
            ${this.icons.trash}
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

    // Update dimensions if they changed
    element.style.width = `${node.width}px`;
    element.style.height = `${node.height}px`;

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
                          <span class="spec-icon">${
                            this.icons[osId] || ""
                          }</span>
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

    // Auto-growth check: if content overflows, expand the node
    const contentEl = element.querySelector(".node-content");
    if (contentEl) {
      const requiredHeight = contentEl.scrollHeight + 50; // content + header
      if (requiredHeight > node.height) {
        // Update model
        this.app.diagram.updateNode(nodeId, { height: requiredHeight });
        // Update self height in DOM
        element.style.height = `${requiredHeight}px`;

        // Update properties panel if this node is selected
        if (this.app.properties.selectedNodeId === nodeId) {
          const heightInput = document.getElementById("prop-height");
          if (heightInput) heightInput.value = Math.round(requiredHeight);
        }

        // Notify app to update connections/groups (some apps might need this)
        this.app.canvas.app.connections?.updateNodeConnections?.(nodeId);
      }
    }
  }
}
