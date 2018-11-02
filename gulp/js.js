let _ = require('lodash');
let fs_ = require('fs');
let path_ = require('path');
let isWindows = (process.platform === 'win32');


module.exports = class JS {

  constructor(gulp, plugin, conf){
    if(!gulp || !plugin || !conf) {
      return;
    }
    this.gulp = gulp;
    this.plugin = plugin;
    this.conf = conf.js;
    this.conf_parent = conf;
    this.ext = new RegExp('.(' + this.conf.ext.join('|') + ')');
    this.init();
  }

  init(){
    if(!this.conf_parent.target.js) { return }

    this.src = _.map(this.conf.src, (src) => {
      return path_.join(this.conf.work, src);
    });

    this.build = require('./js/build');
    this.add = require('./js/add');
    this.clean = require('./js/clean');
    //this.valid = require('./js/valid');

    this.setTask();
  }


  setTask(){
    this.gulp.task('js:build', () => {
      this.build(null, true);
    });

    this.gulp.task('js:clean', () => {
      this.clean(this.gulp.src(this.src));
    });

    this.gulp.task('js:add_module', () => {
      this.add();
    });

    //this.gulp.task('js:valid', this.valid.bind(this));
  }

  getEntry(){
    let fs_list = [];
    let entry = {};
    let abw = this.conf.work;

    if(!/\/$/.test(abw)) {
      abw += '/';
    }

    //entryファイルを取得
    getFile_.call(this, this.conf.entry);

    _.each(fs_list, (f) => {
      let k = f.replace(abw, '').replace(this.ext, '');
      entry[k] = './' + f;
    });

    entry = _.extend(entry, this.conf.file.shared);

    //- 全ファイルパターン
    return _.extend(entry, this.conf.file.library);

    function getFile_(path){
      let items;
      try {
        items = fs_.readdirSync(path);
      }catch(e) {
        items = [];
      }

      items.length > 0 && items.forEach((item) => {
        let p = path_.join(path, item);
        let stat;

        if (isWindows) {
          p = p.replace(/\\/g, '/');
        }

        stat = fs_.statSync(p);

        //頭に'_'のファイルは無視
        if (stat.isFile() && item.indexOf('_') !== 0 && this.ext.test(item)) {
          fs_list[fs_list.length] = p;
        } else if (stat.isDirectory()) {
          getFile_.call(this, p);
        }

      });

    }
  }

  /*
  * webpackへのエントリーファイルを作成
  * */
  _getEntry(file, flg){
    if(_.isObject(file)) {
      return file;
    }

    let fs_list = [];
    let entry = {};
    let abw = this.conf.work;

    if(!/\/$/.test(abw)) {
      abw += '/';
    }

    //entryファイルを取得
    getFile_.call(this, this.conf.entry);

    _.each(fs_list, (f) => {
      let k = f.replace(abw, '').replace(this.ext, '');
      entry[k] = './' + f;
    });

    entry = _.extend(entry, this.conf.file.shared);

    //- 全ファイルパターン
    return flg ? _.extend(entry, this.conf.file.library) : entry;

    function getFile_(path){
      let items;
      try {
        items = fs_.readdirSync(path);
      }catch(e) {
        items = [];
      }

      items.length > 0 && items.forEach((item) => {
        let p = path_.join(path, item);
        let stat;

        if (isWindows) {
          p = p.replace(/\\/g, '/');
        }

        stat = fs_.statSync(p);

        //頭に'_'のファイルは無視
        if (stat.isFile() && item.indexOf('_') !== 0 && this.ext.test(item)) {
          fs_list[fs_list.length] = p;
        } else if (stat.isDirectory()) {
          getFile_.call(this, p);
        }

      });

    }
  }



}
