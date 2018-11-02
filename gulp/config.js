'use strict';

const path_ = require('path');
const requireDir = require('require-dir');
const minimist_ = require('minimist');

const SRC = '../_mrk_src';
const CUSTOM_CONFIG = path_.join(process.cwd(), SRC, 'gulp');
const _ = require('lodash');

let conf_files = requireDir('./config');
let argv = minimist_(process.argv.slice(2));
let custom;
let config;

//config
config = {

  //- 動作範囲
  target: {
    html: true,
    css: true,
    js: true,
    image: true
  },

  //- 作業ファイル ディレクトリ名
  __src__: SRC,

  //- webserverを立ち上げるか
  webserver: {},

  //- 実行ディレクトリ
  cwd: process.cwd(),

  //- 開発モード
  dev: false,

  //- 素材 ディレクトリ名
  //- img, css, javascriptが吐き出される場所
  assets_dir: 'assets',

  custom_dir: CUSTOM_CONFIG,

  //- valid 結果ディレクトリ
  valid_dir: '../.valid/',

  //- document root.
  doc_root: '../html/',

  //- 公開ファイル置き場
  dist: '../html/',

  //- gulp clean時に削除するファイル
  delete_file: []

};


try {
  custom = require(path_.join(config.custom_dir, 'config/main'));
} catch(e) {
  custom = function(){return {};};
}


//- カスタムコンフィグとデータをマージ.
_.merge(config, custom(config));

// --dev optionで起動の場合強制devモード
if(argv.dev) {
  config.dev = true;
}

if(config.webserver){
  if(!_.isObject(config.webserver)) {
    config.webserver = {};
  }
  if(argv.no) {
    config.webserver['open'] = false;
  }

  config.webserver['root'] = config.doc_root;
}

//- パスの形式を統一
config.doc_root = path_.join(config.doc_root);
config.dist = path_.join(config.dist);


_.each(conf_files, (fn, k) => {
  _.isFunction(fn) && (config[k] = fn(config));
});

module.exports = config;
