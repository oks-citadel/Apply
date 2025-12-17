const NodeEnvironment = require("jest-environment-node").TestEnvironment;

class CustomEnvironment extends NodeEnvironment {
  constructor(config, context) {
    super(config, context);
    // Delete localStorage from global to avoid the SecurityError
    delete this.global.localStorage;
  }
}

module.exports = CustomEnvironment;
