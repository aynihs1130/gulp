let _ = require('lodash');
let requireDir = require('require-dir');
let watch = requireDir('./watch');

module.exports = class Watch{

  constructor(gulp, plugin, conf){
    if(!gulp || !plugin || !conf) {
      return;
    }
    this.gulp = gulp;
    this.plugin = plugin;
    this.conf = conf;
    this.init();
  }

  init(){
    this.gulp.task('watch', () => {
      let v;

      this.gulp.__state__ = 'watch';

      //- webserverを立ち上げる
      if(this.conf.webserver){
        let webserver = this.plugin.local_server(this.conf.webserver);
        webserver.start();
      }

      this.plugin.watch('./variable.json', (vinly) => {
        this.gulp._updateVariable();
      });

      _.each(watch, (fn, k) => {
        if(_.isFunction(fn)){ this[k] = new fn(this); }
      });

    });
  }
}
