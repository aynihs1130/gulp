'use strict';

//- webpackのwatchオプションを与えてビルドするだけ。
module.exports = class JSWatch {

  constructor(parent){
    this.parent = parent;
    this.init();
  }

  init(){
    this.parent.conf.js.webpack.watch = true;
    this.parent.gulp._custom.js.build();
  }
}
