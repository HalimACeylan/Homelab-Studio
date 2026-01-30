/**
 * Node Types - Defines available node types and their properties
 */

export const NODE_CATEGORIES = {
  hardware: { name: "Hardware", color: "#3b82f6" },
  network: { name: "Network", color: "#22c55e" },
  "operating-system": { name: "Operating Systems", color: "#f59e0b" },
  "v-os": { name: "Hypervisors", color: "#8b5cf6" },
};

// Operating Systems
export const OS_TYPES = {
  ubuntu: {
    name: "Ubuntu",
    icon: "ubuntu",
    color: "#e95420",
    description: "Linux distribution based on Debian",
  },
  debian: {
    name: "Debian",
    icon: "debian",
    color: "#d70a53",
    description: "The universal operating system",
  },
  windows: {
    name: "Windows Server",
    icon: "windows",
    color: "#00a4ef",
    description: "Microsoft server operating system",
  },
  macos: {
    name: "macOS",
    icon: "macos",
    color: "#ffffff",
    description: "Apple desktop operating system",
  },
  centos: {
    name: "CentOS",
    icon: "centos",
    color: "#262577",
    description: "Community Enterprise Operating System",
  },
  casaos: {
    name: "CasaOS",
    icon: "casaos",
    color: "#007bff",
    description:
      "A simple, easy-to-use, elegant open-source Personal Cloud system",
  },
  umbrel: {
    name: "UmbrelOS",
    icon: "umbrel",
    color: "#ffffff",
    description: "Personal home server OS for self-hosting",
  },
  yunohost: {
    name: "YunoHost",
    icon: "yunohost",
    color: "#ffffff",
    description:
      "A server operating system aiming to make self-hosting accessible",
  },
  unraid: {
    name: "Unraid",
    icon: "unraid",
    color: "#bc2531",
    description:
      "A proprietary Linux-based OS for powerful NAS and app servers",
  },
  truenas: {
    name: "TrueNAS SCALE",
    icon: "truenas",
    color: "#0095d5",
    description:
      "Open storage for the enterprise, scale-out storage and containers",
  },
  startos: {
    name: "StartOS",
    icon: "startos",
    color: "#ffffff",
    description: "A private, sovereign personal server OS",
  },
  omv: {
    name: "OpenMediaVault",
    icon: "omv",
    color: "#3d5c5c",
    description: "Next generation network attached storage (NAS) solution",
  },
  proxmox_os: {
    name: "Proxmox VE",
    icon: "proxmox",
    color: "#e57000",
    category: "v-os",
    description: "Open-source server virtualization management platform",
  },
  xcp_ng: {
    name: "XCP-ng",
    icon: "xcp_ng",
    color: "#2ab0e5",
    category: "v-os",
    description: "Open-source hypervisor based on XenServer",
  },
  esxi: {
    name: "VMware ESXi",
    icon: "esxi",
    color: "#0095d1",
    category: "v-os",
    description: "Enterprise-class, type-1 hypervisor developed by VMware",
  },
  harvester: {
    name: "Harvester",
    icon: "harvester",
    color: "#007a99",
    category: "v-os",
    description:
      "Open-source hyperconverged infrastructure software based on Kubernetes",
  },
  ovirt: {
    name: "oVirt",
    icon: "ovirt",
    color: "#336699",
    category: "v-os",
    description: "Open-source distributed virtualization solution",
  },
  opennebula: {
    name: "OpenNebula",
    icon: "opennebula",
    color: "#00a1e4",
    category: "v-os",
    description:
      "Cloud computing platform for managing heterogeneous enterprise cloud infrastructures",
  },
  citrix: {
    name: "Citrix Hypervisor",
    icon: "citrix",
    color: "#ed1c24",
    category: "v-os",
    description:
      "Server virtualization platform optimized for application and desktop workloads",
  },
  oracle_vm: {
    name: "Oracle VM",
    icon: "oracle",
    color: "#f80000",
    category: "v-os",
    description: "Server virtualization software from Oracle",
  },
  smartos: {
    name: "SmartOS",
    icon: "smartos",
    color: "#fec001",
    category: "v-os",
    description:
      "Converged container and virtual machine hypervisor based on illumos",
  },
  truenas_scale_os: {
    name: "TrueNAS SCALE",
    icon: "truenas",
    color: "#0095d5",
    category: "v-os",
    description: "Open-source scale-out storage and virtualization solution",
  },
};

// Applications that can be added as subnodes to hardware
export const APPLICATION_TYPES = {
  pihole: {
    name: "Pi-hole",
    icon: "pihole",
    color: "#ef4444",
    description: "DNS-level ad blocker",
  },
  proxmox: {
    name: "Proxmox VE",
    icon: "proxmox",
    color: "#e97132",
    description: "Virtualization platform",
  },
  docker: {
    name: "Docker",
    icon: "docker",
    color: "#2496ed",
    description: "Container runtime",
  },
  plex: {
    name: "Plex",
    icon: "plex",
    color: "#e5a00d",
    description: "Media server",
  },
  homeassistant: {
    name: "Home Assistant",
    icon: "homeassistant",
    color: "#41bdf5",
    description: "Home automation",
  },
  nginx: {
    name: "Nginx",
    icon: "nginx",
    color: "#009639",
    description: "Web server / Reverse proxy",
  },
  portainer: {
    name: "Portainer",
    icon: "portainer",
    color: "#13bef9",
    description: "Container management",
  },
  grafana: {
    name: "Grafana",
    icon: "grafana",
    color: "#f46800",
    description: "Monitoring dashboard",
  },
};

export const NODE_TYPES = {
  // Hardware - expandable container nodes
  server: {
    category: "hardware",
    defaultName: "Server",
    defaultWidth: 240,
    defaultHeight: 160,
    minHeight: 100,
    expandedHeight: 280,
    icon: "server",
    color: "#3b82f6",
    canHaveApps: true,
    properties: {
      hostname: "",
      ip: "",
      os: "Ubuntu Server",
      cpu: "",
      ram: "",
      storage: "",
    },
  },
  nas: {
    category: "hardware",
    defaultName: "NAS",
    defaultWidth: 240,
    defaultHeight: 160,
    minHeight: 100,
    expandedHeight: 280,
    icon: "nas",
    color: "#06b6d4",
    canHaveApps: true,
    properties: {
      hostname: "",
      ip: "",
      model: "",
      capacity: "",
      raidType: "",
    },
  },
  "raspberry-pi": {
    category: "hardware",
    defaultName: "Raspberry Pi",
    defaultWidth: 240,
    defaultHeight: 160,
    minHeight: 100,
    expandedHeight: 280,
    icon: "raspberry-pi",
    color: "#c2185b",
    canHaveApps: true,
    properties: {
      hostname: "",
      ip: "",
      model: "Pi 4",
      ram: "4GB",
    },
  },

  // Network - simple nodes
  router: {
    category: "network",
    defaultName: "Router",
    defaultWidth: 160,
    defaultHeight: 100,
    icon: "router",
    color: "#22c55e",
    canHaveApps: false,
    properties: {
      ip: "",
      model: "",
      gateway: "",
    },
  },
  switch: {
    category: "network",
    defaultName: "Switch",
    defaultWidth: 160,
    defaultHeight: 100,
    icon: "switch",
    color: "#16a34a",
    canHaveApps: false,
    properties: {
      ip: "",
      model: "",
      ports: "24",
    },
  },
};

export const CONNECTION_TYPES = {
  ethernet: {
    name: "Cable (Ethernet)",
    color: "#64748b",
    strokeWidth: 2,
    dashArray: "",
  },
  fiber: {
    name: "Fiber Optic",
    color: "#f59e0b",
    strokeWidth: 3,
    dashArray: "",
  },
  wireless: {
    name: "WiFi (Wireless)",
    color: "#8b5cf6",
    strokeWidth: 2,
    dashArray: "5,5",
  },
  usb: {
    name: "USB",
    color: "#0ea5e9",
    strokeWidth: 2,
    dashArray: "2,2",
  },
};
