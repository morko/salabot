/**
 * Class representing a plugin.
 * 
 * @param {object} options - Options for a plugin
 * @param {string} options.type - Type of the plugin
 * @param {object} options.name - Name of the plugin.
 * @param {object} options.description - Description of what the plugin does
 *    and possible usage instructions.
 * 
 */

module.exports = class Plugin {
  constructor(options) {
    options = options || {};

    // Required arguments

    if (!options.prefix) {
      throw new Error('Missing required argument: options.prefix');
    }
    if (!options.utils) {
      throw new Error('Missing required argument: options.utils');
    }
    if (!options.type) {
      throw new Error('Missing required argument: options.type');
    }
    this.prefix = options.prefix;
    this.utils = options.utils;
    this.type = options.type;
    this.useDatabase = options.useDatabase || false;
  }
}