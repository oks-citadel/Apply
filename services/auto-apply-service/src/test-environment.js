/**
 * Custom Jest environment to handle Node.js 25+ Web Storage API compatibility.
 * Node.js 25 introduces localStorage/sessionStorage as experimental features
 * that require --localstorage-file flag. This environment removes these
 * globals before jest-environment-node enumerates them.
 */

// Remove localStorage and sessionStorage from globalThis BEFORE
// requiring jest-environment-node to prevent SecurityError during enumeration
const storageProps = ['localStorage', 'sessionStorage'];
const originalDescriptors = {};

storageProps.forEach(prop => {
  if (Object.getOwnPropertyDescriptor(globalThis, prop)) {
    originalDescriptors[prop] = Object.getOwnPropertyDescriptor(globalThis, prop);
    Object.defineProperty(globalThis, prop, {
      configurable: true,
      enumerable: false,
      get() {
        return undefined;
      }
    });
  }
});

const NodeEnvironment = require('jest-environment-node').TestEnvironment;

class CustomEnvironment extends NodeEnvironment {
  constructor(config, context) {
    super(config, context);
  }

  async setup() {
    await super.setup();
  }

  async teardown() {
    await super.teardown();
  }

  getVmContext() {
    return super.getVmContext();
  }
}

module.exports = CustomEnvironment;
