const Plugin = require('./Plugin');

module.exports = class Filter extends Plugin {
  constructor(options) {
    super(options);

    options = options || {};
    if (!options.hook) {
      throw new Error('Missing required argument: options.hook');
    }
    if (!options.run) {
      throw new Error('Missing required argument: options.run');
    }
    this.hook = options.hook;
    this.run = options.run;
  }
}