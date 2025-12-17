// Jest setup file to handle Stripe SDK localStorage requirements

// Create a proper localStorage mock with all required properties
class LocalStorageMock {
  constructor() {
    this.store = {};
  }

  clear() {
    this.store = {};
  }

  getItem(key) {
    return this.store[key] || null;
  }

  setItem(key, value) {
    this.store[key] = String(value);
  }

  removeItem(key) {
    delete this.store[key];
  }

  get length() {
    return Object.keys(this.store).length;
  }

  key(index) {
    const keys = Object.keys(this.store);
    return keys[index] || null;
  }
}

// Assign to global before any modules are loaded
Object.defineProperty(global, 'localStorage', {
  value: new LocalStorageMock(),
  writable: true,
  configurable: true,
});
