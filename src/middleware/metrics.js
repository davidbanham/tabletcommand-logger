"use strict";

// eslint-disable-next-line node/no-deprecated-api
const parse = require("url").parse;
const _ = require("lodash");
const os = require("os");
const expressStatsd = require("express-statsd");
const monitorRequest = expressStatsd();

// Add an express-statsd key that looks like http.post.api.hello.world for a HTTP POST to /api/hello/world URL
// See https://github.com/uber/express-statsd

module.exports = function metricsModule(filterFunction) {
  function defaultFilter(path, callback) {
    const uuidRegex = /[-a-f\d]{36}/i;
    const mongoIdRegex = /[a-f\d]{24}/i;
    if (path.match(uuidRegex) || path.match(mongoIdRegex)) {
      let parts = path.split(".");
      const cleanParts = parts.filter(function(part) {
        const isUUID = part.match(uuidRegex);
        const isMongoId = part.match(mongoIdRegex);
        return !(isUUID || isMongoId);
      });
      path = cleanParts.join(".");
    }

    return callback(path);
  }

  function statsd() {
    return function statsdFunc(req, res, next) {
      const hostname = process.env.NODE_STATSD_PREFIX || os.hostname();
      const env = process.env.NODE_ENV || "production";
      let method = req.method || "unknown_method";
      method = method.toLowerCase();
      let urlName = req.url || "unknown_url";
      let path = parse(urlName).pathname.toLowerCase();
      path = path.replace(/\//g, " ").trim().replace(/\s/g, ".");

      let filterFunc = defaultFilter;
      if (_.isFunction(filterFunction)) {
        filterFunc = filterFunction;
      }

      return filterFunc(path, function(filteredPath) {
        req.statsdKey = [hostname, env, "http", method, filteredPath].join(".");

        monitorRequest(req, res);
        return next();
      });
    };
  }

  return {
    defaultFilter: defaultFilter,
    statsd: statsd
  };
};
