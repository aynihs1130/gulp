'use strict';

const _ = require('lodash');
const path_ = require('path');


const TEMPLATE_FILE = '_conf/template.pug';
const EXTENSION = ['html', 'php', 'htm'];
const WORK_EXTENSION = ['php', 'html', 'htm', 'pug', 'jade', 'haml'];

const KEY_NAME = ['img', 'css', 'js', 'assets'];


const CONFIG_CORE = '_conf/core.js';
const CONFIG_PAGE = '_conf/page.js';
const CONFIG_SITEMAP = '_conf/sitemap.json';


module.exports = (core) => {
  let dir_name = 'html';

  let work = path_.join(core.__src__, dir_name);

  let valid = path_.join(core.__src__, core.valid_dir, dir_name);

  let dist = core.dist;

  let custom;

  try {
    custom = require(path_.join(core.custom_dir, 'config/html'));
  } catch(e) {
    custom = function(){return {};};
  }

  let config = {
    work,
    dist,
    valid,

    key_name: KEY_NAME,

    extension: EXTENSION,

    work_extension: WORK_EXTENSION,

    //- 圧縮するか否か
    minify: false,

    //- makeFileする時に参照するpug。
    template: TEMPLATE_FILE,

    //- site全体で使える変数
    core: CONFIG_CORE,

    //- page単位で使える変数
    page: CONFIG_PAGE,

    //- meta情報の書いてあるjson
    sitemap: CONFIG_SITEMAP,

    //- meta等が書いてあるスプレッドシート
    spreadsheet: '',

    //- pugの設定
    pug: {
      //- doctypeの宣言
      doctype: 'default',
      pretty: true
    },

    //ストリーム glob.
    src: [
      '**/*.{'+WORK_EXTENSION.join(',')+'}'
    ],

    //- 圧縮設定
    minify_option: {
      //- do not remove empty attributes
      empty: true,
      //- do not strip CDATA from scripts
      cdata: false,
      //- do not remove comments
      comments: true,
      //- do not remove conditional internet explorer comments
      conditionals: false,
      //- do not remove redundant attributes
      spare: true,
      //- do not remove arbitrary quotes
      quotes: true,
      //- preserve one whitespace
      loose: false
    },

    //- 除外ファイル
    ignore: [
      '_parts/**/*',
      '_layout/**/*',
      '_support/**/*',
      '_conf/**/*',
      '**/_*.{'+WORK_EXTENSION.join(',')+'}'
    ]
  };

  _.merge(config, custom(core, config));

  return config;
};
