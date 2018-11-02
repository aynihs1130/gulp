'use strict';

let _ = require('lodash');
let path_ = require('path');


module.exports = class CSS {

  constructor(gulp, plugin, conf) {

    if(!gulp || !plugin || !conf) {
      return;
    }

    this.gulp = gulp;
    this.plugin = plugin;
    this.conf = conf.css;
    this.conf_parent = conf;

    this.init();
  }

  /*
  * set src.
  * */
  init(g, p, cc){
    if(!this.conf_parent.target.css) { return }

    this.clean = require('./css/clean');

    this.build = require('./css/build');

    this.valid = require('./css/valid');

    if(this.conf.generate){
      this.generate = require('./css/generate');
    }

    //- 対象ファイルのワイルドカード作成
    this.src = _.map(this.conf.src, (src) => {
      return path_.join(this.conf.work, src);

    }).concat(_.map(this.conf.ignore, (src) => {
      return '!' + path_.join(this.conf.work, src);

    }));

    //- stylusからcssに変換する前に変換
    this.replace_word = _.extend(
      {},
      this.gulp._variable,
      this.conf.replace_word
    );

    this.setTask();
  }

  /*
  * regist task.
  * */
  setTask(){
    //- convert stylus to css.
    this.gulp.task('css:build', this.build.bind(this));

    this.gulp.task('css:valid', this.valid.bind(this));
  }

  generate(){}


};
