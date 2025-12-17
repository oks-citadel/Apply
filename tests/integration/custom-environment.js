const NodeEnvironment = require("jest-environment-node").TestEnvironment;

class CustomNodeEnvironment extends NodeEnvironment {
  constructor(config, context) {
    super(config, context);

    // Mock localStorage to avoid the Node.js 25 SecurityError
    this.global.localStorage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      key: () => null,
      length: 0,
    };

    // Mock sessionStorage
    this.global.sessionStorage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      key: () => null,
      length: 0,
    };
  }
}

module.exports = CustomNodeEnvironment;
