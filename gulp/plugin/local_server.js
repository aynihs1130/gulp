/*
* custom gulp-webserver.
* */

const _ = require('lodash');
const Webserver = require('./_class/webserver/')

const PORT = 8000;
const LR_PORT = 35729;

const DEFAULT_OPTION = {
  host: 'localhost',
  root: '../html/',
  port: PORT,
  https: false,
  open: true,
  open_url: '/',

  // Middleware: Livereload
  livereload: {
    enable: true,
    host: 'localhost',
    port: LR_PORT,
    filter: function (filename) {
      if (filename.match(/node_modules/)) {
        return false;
      } else { return true; }
    }
  },

  // Middleware: Directory listing
  // For possible options, see:
  //  https://github.com/expressjs/serve-index
  directoryListing: {
    enable: false,
    path: './',
    options: undefined
  },

  // Middleware: Proxy
  // For possible options, see:
  //  https://github.com/andrewrk/connect-proxy
  proxies: []
};


module.exports = function(option) {
  option = _.merge({}, DEFAULT_OPTION, option);
  return new Webserver(option);
}
