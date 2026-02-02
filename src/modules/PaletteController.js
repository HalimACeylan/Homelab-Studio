import { OS_TYPES, APPLICATION_TYPES } from "./nodeTypes.js";

export class PaletteController {
  constructor(app) {
    this.app = app;
    this.palette = document.getElementById("palette");
    this.searchInput = document.getElementById("palette-search");

    this.setupEventListeners();
    this.initializeSections();
    this.renderIcons();
  }

  renderIcons() {
    this.palette.querySelectorAll(".palette-item").forEach((item) => {
      const type = item.dataset.type;
      const iconContainer = item.querySelector(".palette-item-icon");
      if (iconContainer && type) {
        // Use the icon from NodeRenderer if it exists
        const iconSvg = this.app.nodeRenderer.icons[type];
        if (iconSvg) {
          iconContainer.innerHTML = iconSvg;
        }
      }
    });
  }

  setupEventListeners() {
    // Section toggle
    this.palette
      .querySelectorAll(".palette-section-header")
      .forEach((header) => {
        header.addEventListener("click", () => {
          const section = header.closest(".palette-section");
          section.classList.toggle("collapsed");
        });
      });

    // Search filtering
    this.searchInput.addEventListener("input", (e) => {
      this.filterItems(e.target.value.toLowerCase());
    });

    // Drag start on palette items
    this.palette.querySelectorAll(".palette-item").forEach((item) => {
      item.addEventListener("dragstart", (e) => this.handleDragStart(e));
      item.addEventListener("dragend", (e) => this.handleDragEnd(e));
    });

    // Drop on canvas
    const canvasContainer = document.getElementById("canvas-container");
    canvasContainer.addEventListener("dragover", (e) => this.handleDragOver(e));
    canvasContainer.addEventListener("drop", (e) => this.handleDrop(e));
  }

  initializeSections() {
    // By default, keep all sections open
    this.palette.querySelectorAll(".palette-section").forEach((section) => {
      section.classList.remove("collapsed");
    });
  }

  filterItems(query) {
    const items = this.palette.querySelectorAll(".palette-item");
    const sections = this.palette.querySelectorAll(".palette-section");

    if (!query) {
      items.forEach((item) => (item.style.display = ""));
      sections.forEach((section) => {
        section.style.display = "";
        section.classList.remove("collapsed");
      });
      return;
    }

    items.forEach((item) => {
      const name = item.querySelector("span").textContent.toLowerCase();
      const type = item.dataset.type.toLowerCase();
      const matches = name.includes(query) || type.includes(query);
      item.style.display = matches ? "" : "none";
    });

    // Hide sections with no visible items
    sections.forEach((section) => {
      const visibleItems = section.querySelectorAll(
        '.palette-item:not([style*="display: none"])'
      );
      section.style.display = visibleItems.length > 0 ? "" : "none";
      if (visibleItems.length > 0) {
        section.classList.remove("collapsed");
      }
    });
  }

  handleDragStart(e) {
    const item = e.target.closest(".palette-item");
    const type = item.dataset.type;
    const category = item.dataset.category || "node";

    // Encode data as JSON for reliability across browsers
    const dragData = JSON.stringify({ type, category });
    e.dataTransfer.setData("text/plain", dragData);
    e.dataTransfer.effectAllowed = "copy";

    // Create a drag ghost
    const ghost = item.cloneNode(true);
    ghost.style.position = "absolute";
    ghost.style.top = "-1000px";
    ghost.style.opacity = "0.7";
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 30, 30);

    setTimeout(() => ghost.remove(), 0);

    item.classList.add("dragging");
    this.app.updateStatus(`Dragging ${type}...`);

    // Set a global dragging state for easy access in dragover
    this.currentDragData = { type, category };
  }

  handleDragEnd(e) {
    const item = e.target.closest(".palette-item");
    if (item) {
      item.classList.remove("dragging");
    }
    this.app.updateStatus("Ready");
    this.currentDragData = null;

    // Clear all drop potentials
    document.querySelectorAll(".canvas-node.hardware-node").forEach((el) => {
      el.classList.remove("drop-potential");
    });
  }

  handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";

    // Highlight hardware nodes if dragging an application or OS
    const isApplication = this.currentDragData?.category === "application";
    const isOS = this.currentDragData?.category === "os";

    if (isApplication || isOS) {
      const nodeElement = e.target.closest(".canvas-node.hardware-node");
      document.querySelectorAll(".canvas-node.hardware-node").forEach((el) => {
        el.classList.remove("drop-potential");
      });
      if (nodeElement) {
        nodeElement.classList.add("drop-potential");

        // If dragging app, also highlight internal OS environments
        if (isApplication) {
          const osEnvGroup = e.target.closest(".os-env-group");
          document
            .querySelectorAll(".os-env-group")
            .forEach((el) => el.classList.remove("drop-potential-inner"));
          if (osEnvGroup) {
            osEnvGroup.classList.add("drop-potential-inner");
          }
        }

        // If dragging OS, only highlight if target is a V-OS (Hypervisor)
        if (isOS) {
          const osEnvGroup = e.target.closest(".os-env-group");
          document
            .querySelectorAll(".os-env-group")
            .forEach((el) => el.classList.remove("drop-potential-inner"));

          if (osEnvGroup) {
            const nodeId = nodeElement.dataset.nodeId;
            const node = this.app.diagram.nodes.get(nodeId);
            const targetEnvId = osEnvGroup.dataset.osEnvId;
            const targetEnv = this.app.diagram.findOSEnvironment(
              node.osEnvironments,
              targetEnvId
            );

            // Check if target OS type is a V-OS (check both OS_TYPES and APPLICATION_TYPES)
            if (targetEnv && targetEnv.typeId) {
              const osInfo =
                OS_TYPES[targetEnv.typeId] ||
                APPLICATION_TYPES[targetEnv.typeId];
              if (osInfo && osInfo.category === "v-os") {
                osEnvGroup.classList.add("drop-potential-inner");
              }
            }
          }
        }
      }
    }
  }

  handleDrop(e) {
    e.preventDefault();

    let data;
    try {
      const rawData = e.dataTransfer.getData("text/plain");
      data = JSON.parse(rawData);
    } catch (err) {
      // Fallback for old simple data
      data = { type: e.dataTransfer.getData("text/plain"), category: "node" };
    }

    const { type, category } = data;
    if (!type) return;

    // Check if dropping application or OS onto hardware node
    if (category === "application" || category === "os") {
      const nodeElement = e.target.closest(".canvas-node.hardware-node");
      if (nodeElement) {
        const nodeId = nodeElement.dataset.nodeId;

        if (category === "application") {
          // Check if dropped specifically into an OS environment grid
          const osEnvElement = e.target.closest(".os-env-group");
          const osEnvId = osEnvElement ? osEnvElement.dataset.osEnvId : null;

          const success = this.app.diagram.addApplicationToNode(
            nodeId,
            type,
            osEnvId
          );
          if (success) {
            const node = this.app.diagram.nodes.get(nodeId);
            this.app.nodeRenderer.updateNodeElement(nodeId, node);
            const targetName = osEnvElement
              ? osEnvElement.querySelector(".os-env-name").textContent
              : node.properties.name;
            this.app.ui.showToast(`Added ${type} to ${targetName}`, "success");
          }
        } else if (category === "os") {
          // Check if dropped specifically into another OS environment (Hypervisor nesting)
          const parentEnvElement = e.target.closest(".os-env-group");
          let parentEnvId = null;

          if (parentEnvElement) {
            const potentialParentId = parentEnvElement.dataset.osEnvId;
            const node = this.app.diagram.nodes.get(nodeId);
            const targetEnv = this.app.diagram.findOSEnvironment(
              node.osEnvironments,
              potentialParentId
            );

            // Check both OS_TYPES and APPLICATION_TYPES for v-os category
            if (targetEnv && targetEnv.typeId) {
              const osInfo =
                OS_TYPES[targetEnv.typeId] ||
                APPLICATION_TYPES[targetEnv.typeId];
              if (osInfo && osInfo.category === "v-os") {
                parentEnvId = potentialParentId;
              }
            }
          }

          const osNaming = {
            proxmox_os: "Proxmox VE",
            truenas_scale_os: "TrueNAS SCALE",
            xcp_ng: "XCP-ng",
            esxi: "VMware ESXi",
          };
          const osFriendlyName =
            osNaming[type] || type.charAt(0).toUpperCase() + type.slice(1);

          const success = this.app.diagram.addOSEnvironment(
            nodeId,
            osFriendlyName,
            type, // Carry the type ID
            parentEnvId
          );
          if (success) {
            const node = this.app.diagram.nodes.get(nodeId);
            this.app.nodeRenderer.updateNodeElement(nodeId, node);
            const toastMsg = parentEnvId
              ? `Created ${osFriendlyName} VM on ${
                  parentEnvElement.querySelector(".os-env-name").textContent
                }`
              : `Created ${osFriendlyName} environment on ${node.properties.name}`;
            this.app.ui.showToast(toastMsg, "success");
          }
        }

        nodeElement.classList.remove("drop-potential");
        return;
      } else {
        this.app.ui.showToast(
          "Items must be dropped onto hardware nodes",
          "warning"
        );
        return;
      }
    }

    // Get canvas position for regular nodes
    const canvasPos = this.app.canvas.screenToCanvas(e.clientX, e.clientY);

    // Snap to grid
    const x = Math.round(canvasPos.x / 20) * 20;
    const y = Math.round(canvasPos.y / 20) * 20;

    // Create the node
    const node = this.app.addNode(type, x, y);
    this.app.selectNode(node.id);

    this.app.ui.showToast(`Added ${type} component`, "success");
  }
}
