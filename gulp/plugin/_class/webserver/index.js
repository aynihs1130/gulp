// import module list
const _ = require('lodash');
const Q_ = require('q');
const http_ = require('http');
const https_ = require('https');
const connect_ = require('connect');
const serveStatic_ = require('serve-static');
const connectLivereload_ = require('connect-livereload');
const proxy_ = require('proxy-middleware');
const tinyLr_ = require('tiny-lr');
const watch_ = require('watch');
const fs_ = require('fs');
const serveIndex_ = require('serve-index');
const path_ = require('path');
const open_ = require('open');
const url_ = require('url');
const chalk_ = require('chalk');
//const RewriteMiddleware_ = require('express-htaccess-middleware');

const HTACCESS = '.htaccess';

module.exports = class Webserver {

  constructor(option = {}){
    this.option = option;

    this.port = option.port;

    this.init();
  }

  init(){
    this.app = connect_();

    //- set middleware.
    _.each(this.option.middleware, (m) => {
      _.isFunction(m) && this.app.use(m);
    });

    //- set proxi.
    _.each(this.option.proxy||[], (p) => {
      let option = url_.parse(p.target);
      _.isObject(p.option) && _.extend(option, p.option);
      this.app.use(p.source, proxy_(option));
    });


    //- directoryListing.
    if (this.option.directoryListing.enable) {
      this.app.use(
        serveIndex_(
          path_.resolve(this.option.directoryListing.path),
          this.option.directoryListing.options
        )
      );
    }

  }

  createServer(){
    if (this.option.https) {
      let opts;

      if(this.option.https.pfx) {
        opts = {
          pfx: fs_.readFileSync(this.option.https.pfx),
          passphrase: this.option.https.passphrase
        };
      } else {
        opts = {
          key: fs_.readFileSync(this.option.https.key || './ssl/dev-key.pem'),
          cert: fs_.readFileSync(this.option.https.cert || './ssl/dev-cert.pem')
        };
      }
      return https_.createServer(opts, this.app);
    } else {
      return http_.createServer(this.app);
    }
  }

  //- サーバー立ち上げ後に立ち上げるか
  openBrowser(url){
    if(!this.option.open) { return; }
    open_(url);
  }

  createLivereloadServer(){
    let opt;

    if (this.option.https) {
      let opt;
      if (this.option.https.pfx) {
        opt = {
          pfx: fs_.readFileSync(this.option.https.pfx),
          passphrase: this.option.https.passphrase
        };
      } else {
        opt = {
          key: fs_.readFileSync(this.option.https.key || './ssl/dev-key.pem'),
          cert: fs_.readFileSync(this.option.https.cert || './ssl/dev-cert.pem')
        };
      }
    }
    return tinyLr_(opt);
  }


  start(){

    setLivereload_.call(this).then(() => {

      this.server = this.createServer();

      //- port がかぶったときに発生
      this.server.on('error', (err) => {
        if(err.code !== 'EADDRINUSE'){ return; }
        this.port += 1;
        this.server.listen(this.port, this.option.host, callback_.bind(this));
      });

      this.server.listen(this.port, this.option.host, callback_.bind(this));
    });

    //- live reload server.
    function setLivereload_(){

      let def = Q_.defer();

      if (!this.option.livereload.enable) {
        setTimeout(() => { def.resolve(); });
        return def.promise;
      }

      this.livereloadServer = this.createLivereloadServer();

      this.livereloadServer.server.on('error', (err) => {
        if(err.code !== 'EADDRINUSE'){ return; }
        this.option.livereload.port += 1;
        this.livereloadServer.listen(this.option.livereload.port, this.option.host, callback_.bind(this));
      });

      this.livereloadServer.listen(
        this.option.livereload.port,
        this.option.livereload.host,
        callback_.bind(this));

      let option = {
        ignoreDotFiles: true,
        filter: this.option.livereload.filter
      };

      watch_.watchTree(this.option.root, option, (filename) => {
        this.livereloadServer.changed({
          body: { files: filename }
        });
      });

      return def.promise;

      //listenのcallback、
      //失敗（error）してもcallbackされるので一人時間差
      function callback_(a){
        if(this.timer) {
          clearTimeout(this.timer);
          this.timer = null;
        }
        this.timer = setTimeout(() => {
          this.app.use(connectLivereload_({
            port: this.option.livereload.port
          }));
          def.resolve();
        }, 1000);
      }
    }

    //listenのcallback、
    //失敗（error）してもcallbackされるので一人時間差
    function callback_(a){
      if(this.timer) {
        clearTimeout(this.timer);
        this.timer = null;
      }

      this.timer = setTimeout(() => {
        let url = [
          this.option.https ? 'https' : 'http',
          '://',
          this.option.host + ':' + this.port
        ].join('');

        this.app.use(serveStatic_(this.option.root));

        console.log([
          'Webserver started at',
          chalk_.green(url)
        ].join(' '));

        this.openBrowser(path_.join(url, this.option.open_url));

      }, 1000);


      function setHtaccess_(){
        let file = path_.join(process.cwd(), this.option.root, HTACCESS);
        let def = Q_.defer();

        fs_.readFile(file, (err, tokens) => {
          if(err) {
            console.log(err);
            def.resolve();
            return;
          }
          let opt = { file: file, verbose: true };
          this.app.use(RewriteMiddleware_(opt));
          def.resolve();
        });
        return def.promise;
      }

    }
  }

  stop(){
    this.webserver.close();
    if (this.option.livereload.enable) {
      this.livereloadServer.close();
    }
  }
}
