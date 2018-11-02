'use strict';
let _ = require('lodash');
let path_ = require('path');

module.exports = class ImageWatch {
  constructor(parent){
    this.parent = parent;
    this.init();
  }

  init(){
    let c = this.conf = this.parent.conf.img;
    let custom = this.parent.gulp._custom;

    //-
    let src = _.map(c.src, (src) => {
      return path_.join(c.work, src);
    }).concat(_.map(c.ignore, (src) => {
      return path_.join('!' + c.work, src);
    }));

    this.absolute_path = path_.join(process.cwd(), c.work);

    this.parent.plugin.watch(src, (vinly) => {
      let stream = this.parent.gulp.src(vinly.history[0], {
        base: this.absolute_path
      }),
      filepath = vinly.history[0].replace(this.absolute_path, '');

      //- 個別ビルド
      custom.image.run(stream);

      if(vinly.event === 'unlink') {
        custom.image.clean(filepath);
      }

    });
  }

}

