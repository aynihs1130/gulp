'use strict';
/**
 * 与えられたディレクトリ以下のpugファイルの依存関係をjson化する。
 * @constructor
 */
const _ = require('lodash');
const path_ = require('path');
const fs_ = require('fs');
const chalk_ = require('chalk');
const Lex_ = require('pug-lexer');
const Parser_ = require('pug-parser');
const Walk_ = require('pug-walk');
const glob_ = require('glob');
const EXTENSION = 'pug';
const IGNORE = [
  '_**/*.'+EXTENSION,
  '**/_*.'+EXTENSION
];
const INCLUDE_TYPE = [ 'Extends', 'RawInclude', 'Include' ];
const CACHE_FILE = '.pug_inheritance.json';


module.exports = class PugInheritance {

  /**
  * constructor
  * @param {string} base_dir 基準のディレクトリ.
  * @param {object} opt オプション 除外ファイルのアップデートとか.
  */
  constructor(base_dir, opt={}){
    if(!base_dir) { return; }
    console.time('Analysis of PugInheritance')
    this.base_dir = path_.join(process.cwd(), base_dir);
    this.extension = [EXTENSION];
    this.ignore = IGNORE;
    this.include_type = INCLUDE_TYPE;

    this.cache_file = this.path2Absolute(CACHE_FILE);

    _.merge(this, opt);

    this.partial_file = {};
    this.flat_partial_file = {};

    this.positive_glob = this.base_dir + '/**/*.{'+this.extension.join(',')+'}';
    this.negative_globs = _.map(this.ignore, (v) => {
      return this.base_dir + `/${v}`;
    });
    this.init();
  }


  /**
  * 初期化
  */
  init(){

    this.cache = this.loadCache();
    this.cache = false;

    this.delete_file = [];

    if(!this.cache) {
      this.partial_file = {};
      this.flat_partial_file = {};

      this.setFile();
      this.setInheritanceTree();
      this.flat();
    }

    console.timeEnd('Analysis of PugInheritance');
  }

  /**
  * キャッシュファイルのロード。
  * @return {bool} 成功したか否か.
  */
  loadCache(){
    try {
      let cache = require(this.cache_file);
      this.files = this.path2Absolute(cache.list);
      this.partial_file = cache.original;
      this.flat_partial_file = cache.flat;
      return true;
    }catch(e) {
      return false;
    }
  }


  /**
  * キャッシュを制作
  * @return {Promise}.
  */
  saveCacheFile(){
    let json = JSON.stringify({
      list: this.path2Relative(this.files),
      original: this.partial_file,
      flat: this.flat_partial_file
    });

    return new Promise((resolve, reject) => {

      fs_.writeFile(this.cache_file, json, (err)  => {
        if(err) {
          console.log(err);
          reject();
          return;
        }
        resolve();
      });
    });
  }

  /**
  * pathを相対パスに変更
  * @param {string or Array} files.
  */
  path2Relative(files){
    if(!_.isArray(files)) {
      return path_.relative(this.base_dir, files);
    }
    return _.map(files, (file) => {
      return path_.relative(this.base_dir, file);
    });
  }

  /**
  * pathを絶対パスに変更
  * @param {string or Array} files.
  */
  path2Absolute(files){
    if(!_.isArray(files)) {
      return path_.join(this.base_dir, files);
    }
    return _.map(files, (file) => {
      return path_.join(this.base_dir, file);
    });
  }

  /**
  * 取得した依存関係をフラットにする。
  */
  flat(){
    _.each(this.partial_file, (files, k) => {
      let i = 0;
      let l = files.length;
      let flat_files = [];

      for(;i<l;i++) {
        let file = files[i];

        if(!this.partial_file[file]) {
          flat_files.push(file);
        }else {
          Array.prototype.push.apply(flat_files, this.getRelationFile(this.partial_file[file]));
        }
      }
      this.flat_partial_file[k] = _.uniq(flat_files);
    });

    this.saveCacheFile();
  }


  /**
  * 指定したパーシャルに紐づくファイルを返す
  * @param {string} partial_name.
  * @return {array} file name.
  */
  getTargetFile(partial_name){
    let result = this.flat_partial_file[partial_name];
    return (result && result.length) ? result : false;
  }


  /**
  * includeしているpugを再帰的に追跡して末端まで検索
  */
  getRelationFile(files){
    let result = [];

    _.each(files, (file) => {
      if(!this.partial_file[file]) {
        result[result.length] = file;
      }else {
        Array.prototype.push.apply(result, this.getRelationFile(this.partial_file[file]));
      }
    });
    return result;
  }

  /**
  * パーシャルじゃないファイルを取得
  */
  setFile(){
    this.negative_files = _.uniq(_.flatten(_.map(this.negative_globs, (v) => {
      return glob_.sync(v);
    })));
    this.files = _.filter(glob_.sync(this.positive_glob), (file) => {
      return !_.includes(this.negative_files, file);
    });
  }


  /**
  * ファイルの依存関係の更新
  * @param {string or Array} 解析するファイル 指定なしで全解析 ※絶対パス。
  */
  reset(files=this.files){
    this.setInheritanceTree(files);
    this.flat();
  }

  /**
  * ファイルの削除
  * @param {string or Array} 削除するファイル ※絶対パス。
  */
  delate(file){
    if(!file) { return; }

    let n = _.indexOf(this.files, file);
    let rel_path = this.path2Relative(file);

    if(n === -1) { return; }

    this.files.splice(n, i);
    _.each(this.partial_file, (v) => {
      let n = _.indexOf(v, rel_path);
      v.splice(n, i);
    });
    this.flat();
  }

  /**
  * 新規書き出しファイルを追加
  * @param {string} 追加ファイル ※絶対パス。
  */
  addFile(file){
    this.files[this.files.length] = file;
    this.setInheritanceTree(file)
    this.flat();
  }


  /**
  * pugファイルを解析して依存を取得
  * @param {string or Array} 解析するファイル 指定なしで全解析
  */
  setInheritanceTree(files=this.files){

    if(!_.isArray(files)) { files = [files]; }

    _.each(files, (file) => {

      let dir_name = path_.dirname(path_.isAbsolute(file) ? file : this.path2Absolute(file));

      this.readFile(file, (node) => {

        let type = node.type;
        if(!_.includes(this.include_type, type)){ return; }

        let partial_file;

        if(path_.isAbsolute(node.file.path)){
          partial_file = this.path2Absolute(node.file.path);
        }else {
          partial_file = path_.join(dir_name, node.file.path);
        }

        //拡張子を取得
        let ext = path_.extname(partial_file);

        //- pug以外は無視。
        if(ext === '') {
          partial_file += '.pug';
        }else if(ext !== '.pug') {
          return;
        }

        let rel_partial_path = this.path2Relative(partial_file);
        let rel_file_path = this.path2Relative(file);

        if(!this.partial_file[rel_partial_path]) {
          this.partial_file[rel_partial_path] = [];
          this.setInheritanceTree(partial_file, true);
        }


        if(!_.includes(this.partial_file[rel_partial_path], rel_file_path)){
          this.partial_file[rel_partial_path].push(rel_file_path);
        }
      });
    });
  }


  /**
  * ファイルが存在するかチェック。
  * @param {bool} あるか、ないか
  */
  isExistFile(file) {
    try {
      fs_.statSync(file);
      return true
    } catch(err) {
      return false
    }
  }


  /**
  * 解析開始の糖衣構文
  * @param {string} file.
  * @param {function} callback.
  */
  readFile(file, callback){
    if(!this.isExistFile(file)) {
      console.log(chalk_.red('no-file') + ` ${file}`);
    }else {
      let pug_text = fs_.readFileSync(file, 'utf8');
      Walk_(Parser_(Lex_(pug_text, { filename: file })), callback);
    }
  }


}
