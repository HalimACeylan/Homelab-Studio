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
  "custom-os": {
    name: "Custom OS",
    icon: "os",
    color: "#f97316",
    description: "Generic operating system",
  },
  "custom-v-os": {
    name: "Custom Hypervisor",
    icon: "os", // Use generic OS icon or specific v-os icon if available
    color: "#8b5cf6",
    category: "v-os",
    description: "Generic hypervisor",
  },
};

// Applications that can be added as subnodes to hardware
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
    category: "v-os", // Behaves like a hypervisor - can hold apps and OS
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
  "custom-service": {
    name: "Custom Service",
    icon: "service",
    color: "#14b8a6",
    description: "Generic application or service",
  },

  // --- Network & Security ---
  frigate: {
    name: "Frigate NVR",
    icon: "frigate",
    color: "#ef4444",
    description: "NVR with real-time object detection",
  },
  adguard: {
    name: "AdGuard Home",
    icon: "adguard",
    color: "#68bc71",
    description: "Network-wide software for blocking ads & tracking",
  },
  traefik: {
    name: "Traefik",
    icon: "traefik",
    color: "#24a1c1",
    description: "Modern HTTP reverse proxy and load balancer",
  },
  wireguard: {
    name: "WireGuard",
    icon: "wireguard",
    color: "#88171a",
    description: "Fast, modern, secure VPN tunnel",
  },
  tailscale: {
    name: "Tailscale",
    icon: "tailscale",
    color: "#18181b",
    description: "Zero config VPN",
  },
  "cloudflare-dns": {
    name: "Cloudflare DNS",
    icon: "cloudflare-dns",
    color: "#f38020",
    description: "DNS service",
  },
  "cloudflare-tunnel": {
    name: "Cloudflare Tunnel",
    icon: "vpn",
    color: "#f38020",
    description: "Securely expose servers to internet",
  },
  "lets-encrypt": {
    name: "Let's Encrypt",
    icon: "vpn",
    color: "#003a70",
    description: "Certificate Authority",
  },
  heimdall: {
    name: "Heimdall",
    icon: "monitoring",
    color: "#c2185b",
    description: "Application dashboard",
  },
  pfsense: {
    name: "pfSense",
    icon: "pfsense",
    color: "#212121",
    description: "Firewall and Router",
  },
  openwrt: {
    name: "OpenWrt",
    icon: "openwrt",
    color: "#dc0050",
    description: "Linux operating system targeting embedded devices",
  },

  // --- Media & Storage ---
  jellyfin: {
    name: "Jellyfin",
    icon: "jellyfin",
    color: "#00a4dc",
    description: "Free Software Media System",
  },
  photoprism: {
    name: "PhotoPrism",
    icon: "photoprism",
    color: "#aa00ff",
    description: "AI-Powered Photos App",
  },
  immich: {
    name: "Immich",
    icon: "immich",
    color: "#4285f4",
    description: "Self-hosted photo and video backup solution",
  },
  minio: {
    name: "MinIO",
    icon: "minio",
    color: "#c72c48",
    description: "High Performance Object Storage",
  },
  syncthing: {
    name: "Syncthing",
    icon: "syncthing",
    color: "#0882c8",
    description: "Continuous File Synchronization",
  },

  // --- Databases ---
  influxdb: {
    name: "InfluxDB",
    icon: "influxdb",
    color: "#22adf6",
    description: "Time series database",
  },
  redis: {
    name: "Redis",
    icon: "redis",
    color: "#d82c20",
    description: "In-memory data structure store",
  },
  postgresql: {
    name: "PostgreSQL",
    icon: "postgresql",
    color: "#336791",
    description: "Open source relational database",
  },
  mariadb: {
    name: "MariaDB",
    icon: "mariadb",
    color: "#003545",
    description: "Open source relational database",
  },
  mongodb: {
    name: "MongoDB",
    icon: "mongodb",
    color: "#4db33d",
    description: "NoSQL database program",
  },

  // --- Monitoring ---
  prometheus: {
    name: "Prometheus",
    icon: "prometheus",
    color: "#e6522c",
    description: "Monitoring system and time series database",
  },
  "uptime-kuma": {
    name: "Uptime Kuma",
    icon: "uptime-kuma",
    color: "#17b897",
    description: "Self-hosted monitoring tool",
  },

  // --- Management & Virtualization ---
  "synology-container-manager": {
    name: "Container Manager",
    icon: "container",
    color: "#005a9e",
    description: "Synology Docker Management",
  },

  // --- AI & Productivity ---
  ollama: {
    name: "Ollama",
    icon: "ollama",
    color: "#000000",
    description: "Get up and running with large language models",
  },
  "open-webui": {
    name: "Open WebUI",
    icon: "service",
    color: "#303030",
    description: "User-friendly WebUI for LLMs",
  },
  obsidian: {
    name: "Obsidian",
    icon: "obsidian",
    color: "#7c3aed",
    description: "Knowledge base",
  },
  "paperless-ngx": {
    name: "Paperless-ngx",
    icon: "paperless-ngx",
    color: "#2a52be",
    description: "Document management system",
  },

  // --- Automation ---
  "node-red": {
    name: "Node-RED",
    icon: "node-red",
    color: "#8f0000",
    description: "Flow-based programming tool",
  },
};

// User Devices - End-user equipment (TVs, phones, etc.)
const USER_DEVICE_TYPES = {
  tv: {
    name: "TV",
    icon: "tv",
    color: "#ec4899",
    category: "user-device",
    description: "Smart TV or display",
    defaultName: "TV",
    defaultWidth: 180,
    defaultHeight: 80,
    properties: {
      name: "",
      ip: "",
      description: "",
    },
  },
  smartphone: {
    name: "Smartphone",
    icon: "smartphone",
    color: "#8b5cf6",
    category: "user-device",
    description: "Mobile phone",
    defaultName: "Phone",
    defaultWidth: 180,
    defaultHeight: 80,
    properties: {
      name: "",
      ip: "",
      description: "",
    },
  },
  tablet: {
    name: "Tablet",
    icon: "tablet",
    color: "#06b6d4",
    category: "user-device",
    description: "Tablet device",
    defaultName: "Tablet",
    defaultWidth: 180,
    defaultHeight: 80,
    properties: {
      name: "",
      ip: "",
      description: "",
    },
  },
  laptop: {
    name: "Laptop",
    icon: "laptop",
    color: "#3b82f6",
    category: "user-device",
    description: "Laptop computer",
    defaultName: "Laptop",
    defaultWidth: 180,
    defaultHeight: 80,
    properties: {
      name: "",
      ip: "",
      description: "",
    },
  },
  desktop: {
    name: "Desktop PC",
    icon: "desktop",
    color: "#6366f1",
    category: "user-device",
    description: "Desktop computer",
    defaultName: "Desktop",
    defaultWidth: 180,
    defaultHeight: 80,
    properties: {
      name: "",
      ip: "",
      description: "",
    },
  },
  printer: {
    name: "Printer",
    icon: "printer",
    color: "#64748b",
    category: "user-device",
    description: "Network printer",
    defaultName: "Printer",
    defaultWidth: 180,
    defaultHeight: 80,
    properties: {
      name: "",
      ip: "",
      description: "",
    },
  },
  camera: {
    name: "IP Camera",
    icon: "camera",
    color: "#ef4444",
    category: "user-device",
    description: "Security camera",
    defaultName: "Camera",
    defaultWidth: 180,
    defaultHeight: 80,
    properties: {
      name: "",
      ip: "",
      description: "",
    },
  },
  speaker: {
    name: "Smart Speaker",
    icon: "speaker",
    color: "#f59e0b",
    category: "user-device",
    description: "Smart speaker or audio device",
    defaultName: "Speaker",
    defaultWidth: 180,
    defaultHeight: 80,
    properties: {
      name: "",
      ip: "",
      description: "",
    },
  },
  "game-console": {
    name: "Game Console",
    icon: "game-console",
    color: "#10b981",
    category: "user-device",
    description: "Gaming console",
    defaultName: "Console",
    defaultWidth: 180,
    defaultHeight: 80,
    properties: {
      name: "",
      ip: "",
      description: "",
    },
  },
  "iot-device": {
    name: "IoT Device",
    icon: "iot-device",
    color: "#14b8a6",
    category: "user-device",
    description: "Smart home device",
    defaultName: "IoT Device",
    defaultWidth: 180,
    defaultHeight: 80,
    properties: {
      name: "",
      ip: "",
      description: "",
    },
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
  custom: {
    category: "hardware",
    defaultName: "Custom Hardware",
    defaultWidth: 240,
    defaultHeight: 160,
    minHeight: 100,
    expandedHeight: 280,
    icon: "hardware",
    color: "#6366f1",
    canHaveApps: true,
    properties: {
      hostname: "",
      ip: "",
      description: "",
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
      description: "",
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
      description: "",
    },
  },
  "custom-network": {
    category: "network",
    defaultName: "Custom Network",
    defaultWidth: 160,
    defaultHeight: 100,
    icon: "network",
    color: "#10b981",
    canHaveApps: false,
    properties: {
      ip: "",
      description: "",
    },
  },

  // User Devices - End-user equipment
  tv: {
    ...USER_DEVICE_TYPES.tv,
    canHaveApps: false,
  },
  smartphone: {
    ...USER_DEVICE_TYPES.smartphone,
    canHaveApps: false,
  },
  tablet: {
    ...USER_DEVICE_TYPES.tablet,
    canHaveApps: false,
  },
  laptop: {
    ...USER_DEVICE_TYPES.laptop,
    canHaveApps: false,
  },
  desktop: {
    ...USER_DEVICE_TYPES.desktop,
    canHaveApps: false,
  },
  printer: {
    ...USER_DEVICE_TYPES.printer,
    canHaveApps: false,
  },
  camera: {
    ...USER_DEVICE_TYPES.camera,
    canHaveApps: false,
  },
  speaker: {
    ...USER_DEVICE_TYPES.speaker,
    canHaveApps: false,
  },
  "game-console": {
    ...USER_DEVICE_TYPES["game-console"],
    canHaveApps: false,
  },
  "iot-device": {
    ...USER_DEVICE_TYPES["iot-device"],
    canHaveApps: false,
  },
};

// User Devices - End-user equipment (TVs, phones, etc.)

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
