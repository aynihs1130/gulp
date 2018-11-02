let _ = require('lodash');
let path_ = require('path');

module.exports = class Copy{

  constructor(gulp, plugin, conf){
    if(!gulp || !plugin || !conf) {
      return;
    }
    this.gulp = gulp;
    this.plugin = plugin;
    this.conf = conf.assets;
    this.init();
  }

  init(){
    this.src = _.map(this.conf.extension, (ext) => {
      return path_.join(this.conf.work, '**/*.' + ext);
    });
    this.gulp.task('copy:build', ()=>{
      this.build();
    });

  }

  build(stream){
    (stream || this.gulp.src(this.src))
    .pipe(this.gulp.dest(this.conf.dist))
    .pipe(this.plugin.debug())
    .pipe(this.plugin.notify({
        message: 'copy.'
    }));
  }

  /*
  * @param {string} file
  * */
  clean(file){
    let dist = path_.join(this.conf.dist, file);
    this.gulp._custom.clean.run([dist]);
  }

}
