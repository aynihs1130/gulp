//- const.
const ASSETS_NAME = 'assets_dir';
const KEY_CATEGORY = ['img', 'css', 'js'];

//- use module.
const _ = require('lodash');
const path_ = require('path');
const chalk_ = require('chalk');
const PugInheritance = require('./lib/pug_inheritance');

module.exports = class HTML {

  /*
  * @constructor
  * @param {Gulp Object} gulp Object.
  * @param {Gulp Module Object} gulp-{*} module.
  * @param {Object} config.js.
  * */
  constructor(gulp, plugin, conf){

    if(!gulp || !plugin || !conf) {
      return;
    }
    this.gulp = gulp;
    this.plugin = plugin;
    this.conf = conf.html;
    this.conf_parent = conf;

    this.data = {};

    this.meta_data = {};

    this.init();
  }


  //- 初期化
  init(){
    if(!this.conf_parent.target.html) {
      return;
    }

    let c = this.conf;

    this.exp_work = new RegExp('.(' + c.work_extension.join('|') + ')');

    //- create method.
    this.valid = require('./html/valid');
    this.clean = require('./html/clean');
    this.build = require('./html/build');
    this.generate = require('./html/generate');
    this.makeSitemap = require('./html/sitemap');

    //- create glob.
    this.src = _.map(c.src, (src) => {
      return path_.join(c.work, src);

    }).concat(_.map(c.ignore, (src) => {
      return path_.join('!' + c.work, src);
    }));

    //- データの取得
    this.updateAllData();

    //- task entry
    this.setTask();

  }

  updateAllData(){
    let c = this.conf_parent;
    let core = this.getData(this.conf.core);
    let sitemap = this.getData(this.conf.sitemap);
    let page = this.getData(this.conf.page);
    let path = {};
    let exp = /\/$/;

    //- pug上で使う変数の取得
    this.data = { core, page, sitemap };

    //- データをチェック
    this.checkData();

    //- 各素材ディレクトリのdocment rootからのパスを算出
    _.each(this.conf.key_name, (k) => {
      let conf = c[k];
      let dir = conf.dist.replace(c.dist, '');

      if(!exp.test(dir)) {
        dir += '/';
      }
      this.data.core['__' + k + '_path__'] = path[k + '_path'] = dir;
    });
    this.data.core[ASSETS_NAME] = c[ASSETS_NAME];

    this.data['sitemap'] = this.makeSitemap(sitemap, path);


    //- pugからhtmlに変換する前に変換
    this.replace_word = _.extend(
      {},
      this.gulp._variable,
      this.conf.replace_word
    );
  }

  /*
  * get variable_data.
  * */
  getData(file){
    let result;

    let absolute_path = path_.join(process.cwd(), this.conf.work, file);

    if(require.cache[absolute_path]) {
      delete require.cache[absolute_path];
    }
    try {
      result = require(absolute_path);

    }catch(e) {
      console.log(e);
      result = false;

    }
    return result;
  }

  /**
  * タスクを登録
  */
  setTask(){

    //- pugファイルをhtmlファイルにトランスファー
    this.gulp.task('html:build', () => {
      this.build(this.gulp.src(this.src));
    });

    //- _conf/meta.jsonを元にhtmlfileを作成.
    this.gulp.task('html:new', () => {
      this.data.sitemap && this.generate();
    });

    //- html valid.
    this.gulp.task('html:valid', () => {
      this.valid();
    });

    //- meta.jsonと同期をとる
    //- TODO ↑ってなんだっけ。
    this.gulp.task('html:sync', () => {
    });

    //- 削除 task.
    //- 空ディレクトリを削除.
    this.gulp.task('html:clean', () => {
      if(this.gulp._custom['clean']){
        this.gulp._custom['clean'].deleteEmptyDir(this.conf.work);
      }
    });

  }

  /**
  * データの精査
  */
  checkData(){

    if(!this.data.core) {
      console.log([
        chalk_.red('>> Please:'),
        chalk_.white('copy for'),
        chalk_.green('\".default.pug/_conf/core.js\"'),
        chalk_.red('->'),
        chalk_.yellow('"_conf/core.js"')
      ].join(' '));

      this.core = {};
    }

    if(!this.data.page) {
      console.log([
        chalk_.red('>> Please:'),
        chalk_.white('copy for'),
        chalk_.green('\".default.pug/_conf/page.js\"'),
        chalk_.red('->'),
        chalk_.yellow('"_conf/page.js"')
      ].join(' '));

      this.data = {};
    }


    if(!this.data.sitemap) {
      console.log([
        chalk_.red('>> Please:'),
        chalk_.white('copy for'),
        chalk_.green('\".default.pug/_conf/sitemap.json\"'),
        chalk_.red('->'),
        chalk_.yellow('"_conf/sitemap.json"')
      ].join(' '));
      this.meta_data = {};
    }
  }


  /**
  * 名前の生成
  * @param {string} file - pugファイル
  */
  getName(file){
    let key = file.replace(this.exp_work, '');
    let data = this.data.sitemap[key];
    let name;

    if(!data || !data.file) {
      return false;
    }
    name = this.makeClassName(data.file);
    name = name.split(' ');
    return name[name.length-1];
  }


  //- bodyのclass_nameを生成.
  makeClassName(filepath){
    let path = _.compact(filepath.replace(this.exp_work, '').split('/'));
    let result = [];

    _.each(path, (v, i) => {
      let file = ['page'].concat(path.slice(0, i+1));
      result[result.length] = file.join('-');
    });
    return result.join(' ');
  }

}

