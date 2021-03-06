"use strict";

module.exports = function loggerMiddleware() {
  function loggerMiddleware(loggerInstance) {
    return function accessLogMiddleware(req, res, next) {
      // This doesn't fire the log immediately, but waits until the response is finished
      // This means we have a chance of logging the response code
      res.on("finish", function () {
        loggerInstance.info({
          remoteAddress: req.ip,
          method: req.method,
          url: req.originalUrl,
          protocol: req.protocol,
          hostname: req.hostname,
          httpVersion: "".concat(req.httpVersionMajor, ".").concat(req.httpVersionMinor),
          userAgent: req.headers["user-agent"],
          status: res._header ? res.statusCode : undefined
        }, "access_log");
      });
      next();
    };
  }

  return {
    loggerMiddleware: loggerMiddleware
  };
};