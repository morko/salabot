const url = require('url');
const parseString = require('xml2js').parseString;
const version = require('../../package.json').version;
/**
 * GET request to given url using either http or https.
 *
 * Expects XML as response. Returns parsed XML object if no errors.
 *
 */
const getXML = module.exports.getXML = function(url) {
  return new Promise((resolve, reject) => {
    get(url)
    .then((data) => {
      parseString(data, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    })
    .catch((err) => {
      return reject(err);
    });
  });
}
/**
 * GET request to given url using either http or https.
 *
 * Expects JSON as response. Returns parsed JSON object if no errors.
 *
 */
const getJSON = module.exports.getJSON = function(url) {
  return new Promise((resolve, reject) => {
    get(url)
    .then((data) => {
      return resolve(JSON.parse(data));
    })
    .catch((err) => {
      return reject(err);
    });
  });
}

/**
 * GET request to given url using either http or https. Default is https.
 */
const get = module.exports.get = function(options) {

  options = options || {};
  let lib;
  if (typeof options === 'string') {
    let urlString = options;
    options = {};
    if (urlString.startsWith('https')) {
      lib = require('https');
    } else {
      lib = require('http');
    }
    // parse the url
    let parsedURL = url.parse(urlString);
    options.hostname = options.hostname || parsedURL.host;
    options.path = options.path || parsedURL.path;
  }
  options.headers = options.headers || {};
  options.headers['User-Agent'] = `salabot/${version}`;

  return new Promise((resolve, reject) => {

    const request = lib.get(options, (response) => {

      // get the ratelimit reset time from headers if any
      let ratelimitReset = parseInt(response.headers['x-ratelimit-reset']);

      // handle http errors
      if (response.statusCode < 200 || response.statusCode > 299) {
        reject({statusCode: response.statusCode});
        return;
      }
      // temporary data holder
      let rawData = '';
      // on every content chunk, push it to the data array
      response.on('data', (chunk) => {
        rawData += chunk;
      });
      // we are done, resolve promise with those joined chunks
      response.on('end', () => {
        resolve(rawData, ratelimitReset);
      });
    });
    // handle connection errors of the request
    request.on('error', (err) => reject(err))
	});
};
