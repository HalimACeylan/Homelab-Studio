/**
 * HistoryManager - Handles undo/redo functionality
 */

export class HistoryManager {
  constructor(maxSize = 50) {
    this.undoStack = [];
    this.redoStack = [];
    this.maxSize = maxSize;
  }

  push(action) {
    this.undoStack.push(action);
    this.redoStack = []; // Clear redo stack on new action

    // Limit stack size
    if (this.undoStack.length > this.maxSize) {
      this.undoStack.shift();
    }

    this.updateButtons();
  }

  undo() {
    if (this.undoStack.length === 0) return null;

    const action = this.undoStack.pop();
    this.redoStack.push(action);
    this.updateButtons();

    return action;
  }

  redo() {
    if (this.redoStack.length === 0) return null;

    const action = this.redoStack.pop();
    this.undoStack.push(action);
    this.updateButtons();

    return action;
  }

  canUndo() {
    return this.undoStack.length > 0;
  }

  canRedo() {
    return this.redoStack.length > 0;
  }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
    this.updateButtons();
  }

  updateButtons() {
    const undoBtn = document.getElementById("btn-undo");
    const redoBtn = document.getElementById("btn-redo");

    if (undoBtn) {
      undoBtn.disabled = !this.canUndo();
    }
    if (redoBtn) {
      redoBtn.disabled = !this.canRedo();
    }
  }
}
