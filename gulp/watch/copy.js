let _ = require('lodash');
let path_ = require('path');

module.exports = class CopyWatch{

  constructor(parent){
    this.parent = parent;
    this.init();
  }

  init(){
    let c = this.conf = this.parent.conf.assets;
    let custom = this.parent.gulp._custom;

    let src = _.map(this.conf.extension, (ext) => {
      return path_.join(this.conf.work, '**/*.' + ext);
    });

    this.absolute_path = path_.join(process.cwd(), c.work);

    this.parent.plugin.watch(src, function(vinly){
      let stream = this.parent.gulp.src(vinly.history[0], {
        base: this.absolute_path
      });
      let filepath = vinly.history[0].replace(this.absolute_path, '');

      //- 個別ビルド
      custom.copy.build(stream);

      if(vinly.event === 'unlink') {
        custom.copy.clean(filepath);
      }

    }.bind(this));

  };

}
