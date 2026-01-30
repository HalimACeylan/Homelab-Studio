/**
 * FileManager - Handles saving and loading diagrams
 */

import { downloadFile, readFile, formatDate } from "./utils.js";

export class FileManager {
  constructor(app) {
    this.app = app;
    this.fileInput = document.getElementById("file-input");
    this.storageKey = "homelab-studio-autosave";

    this.setupEventListeners();
    this.loadAutosave();
    this.startAutosave();
  }

  setupEventListeners() {
    this.fileInput.addEventListener("change", (e) => this.handleFileSelect(e));
  }

  save() {
    const data = this.app.exportDiagram();
    const name = data.metadata.name || "homelab-diagram";
    const filename = `${name
      .toLowerCase()
      .replace(/\s+/g, "-")}-${Date.now()}.json`;

    const json = JSON.stringify(data, null, 2);
    downloadFile(json, filename, "application/json");

    this.app.ui.showToast("Diagram saved", "success");
  }

  load() {
    this.fileInput.click();
  }

  async handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const content = await readFile(file);
      const data = JSON.parse(content);

      this.app.importDiagram(data);
      this.app.ui.showToast(
        `Loaded: ${data.metadata?.name || "diagram"}`,
        "success"
      );
      this.app.updateStatus(
        `Loaded diagram from ${formatDate(
          data.metadata?.modified || new Date()
        )}`
      );
    } catch (error) {
      console.error("Failed to load file:", error);
      this.app.ui.showToast("Failed to load file", "error");
    }

    // Reset file input
    this.fileInput.value = "";
  }

  // Autosave functionality
  startAutosave() {
    setInterval(() => {
      this.autosave();
    }, 30000); // Autosave every 30 seconds
  }

  autosave() {
    if (this.app.diagram.nodes.size === 0) return;

    try {
      const data = this.app.exportDiagram();
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error("Autosave failed:", error);
    }
  }

  loadAutosave() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const data = JSON.parse(saved);

        // Only load if there's actual content
        if (data.nodes && data.nodes.length > 0) {
          // Check if user wants to restore
          // For now, we'll auto-restore
          this.app.importDiagram(data);
          this.app.updateStatus("Restored autosaved diagram");
        }
      }
    } catch (error) {
      console.error("Failed to load autosave:", error);
    }
  }

  clearAutosave() {
    localStorage.removeItem(this.storageKey);
  }
}
