'use strict';

const TEMPLATE_FILE = '_conf/_template.styl';

const _ = require('lodash');

const path_ = require('path');

module.exports = (core) => {
  let dir_name = 'css';

  let work = path_.join(core.__src__, dir_name);

  let valid = path_.join(core.__src__, core.valid_dir, dir_name);

  let dist = path_.join(core.dist, core.assets_dir, dir_name);

  let custom;

  try {
    custom = require(path_.join(core.custom_dir, 'config/css'));
  } catch(e) {
    custom = function(){return {};};
  }


  let config = {
    work,
    dist,
    valid,

    //- stylusの拡張子
    ext: 'styl',

    //- stylusファイル自動生成オプション
    generate: false,

    //- 自動生成する際のテンプレートファイル
    template: path_.join(work, TEMPLATE_FILE),

    //- 変換対象ファイル
    src: [
      '**/*.styl'
    ],

    //- 上記srcからの除外対象ファイル
    ignore: [
      '_*/**/*',
      '**/_*'
    ],

    //- 圧縮するか否か
    minify: true,

    //- stylusのキャッシュファイル置き場
    cache: '.cache/',

    //- 自動生成ファイルの置き場
    page_dir: path_.join(work, 'page'),

    //- スプライトファイルの置き場
    sprite_dir: path_.join(work, 'sprite'),

    //- autoprefixer
    browsers: [
      'last 2 Firefox versions',
      'last 2 Chrome versions',
      'last 2 Opera versions',
      'ie >= 8',
      'ios >= 7',
      'android >= 2.3'
    ],

    //- stylusの実行オプション
    stylus_options: {
      define: {
        import_tree: require('stylus-import-tree')
      }
    }

  };

  _.merge(config, custom(core, config));

  return config;
};
