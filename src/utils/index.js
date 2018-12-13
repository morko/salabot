module.exports = createUtils;
function createUtils(options) {
  options = options || {};
  if (!options.prefix) {
    throw new Error('Missing required argument: options.prefix');
  }
  return {
    http: require('./http'),
    format : require('./format')
  }
}