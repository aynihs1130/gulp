'use strict';

const _ = require('lodash');
const path_ = require('path');

module.exports = class CSSWatch {

  constructor(parent){
    this.parent = parent;
    this.init();
  }

  init(){
    let c = this.conf = this.parent.conf.css;
    let custom = this.parent.gulp._custom;
    let src = _.map(c.src, (src) => {
      return path_.join(c.work, src);
    });

    this.parent.plugin.watch(src, (vinly) => {
      this.parent.gulp.start(['css:build']);
    });
  }

}

