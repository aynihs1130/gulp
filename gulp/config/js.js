'use strict';

//- 対象拡張子
const EXTENSION = ['js', 'json'];

const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const LicenseInfoWebpackPlugin = require('license-info-webpack-plugin').default;

const _ = require('lodash');
const path_ = require('path');

let isWindows = (process.platform === 'win32');

module.exports = (core) => {
  let ext = EXTENSION;

  let dir_name = 'js';

  let work = path_.join(core.__src__, dir_name);

  let valid = path_.join(core.__src__, core.valid_dir, dir_name);

  let dist = path_.join(core.dist, core.assets_dir, dir_name);

  let custom;

  if (isWindows) work = work.replace(/\\/g, '/');

  try {
    custom = require(path_.join(core.custom_dir, 'config/js'));
  } catch(e) {
    custom = function(){return {};};
  }

  let config = {
    ext,
    work,
    dist,
    valid,

    //- 圧縮するか否か
    minify: true,

    src: [
      '**/*.{' + ext.join(',') + '}'
    ],

    //- エントリーディレクトリ
    entry: work + '/page/',

    file: {
      //- ライブラリファイル、watch時は無視
      library: {},

      //- エントリーディレクトリ以外のファイル。
      shared: {}
    },

    //- DefinePluginにわたす変数.
    define_variable: {
      __wp: {
        dev: core.dev
      }
    },

    //- webpackの設定
    webpack: {

      mode: core.dev ? 'development' : 'production',

      cache: true,

      output: {
        //- 出力先ファイルパス
        path: path_.join(process.cwd(), dist),
        filename: '[name].js'
      },

      resolve: {

        //- require path.
        //- npmをrootディレクトリに登録
        modules: [
          //- scriptのディレクトリを登録
          path_.join(core.cwd, work),
          //- npm modules
          path_.join(core.cwd, core.__src__, 'node_modules')
        ],

        extensions: [].concat(_.map(EXTENSION, (v) => {
          return '.' + v;
        }))

      },

      plugins: [
        new LicenseInfoWebpackPlugin({ glob: '{LICENSE,license,License}*', }),
      ],

      optimization: {
        minimizer: !core.dev ? [
          new UglifyJSPlugin({
            uglifyOptions: {
              output: { comments: /^\**!|@preserve|@license|@cc_on/ }
            }
          })
        ] : [],
      },

      devtool: core.dev ? 'source-map' : false,

      module: {
        rules: [{
          test: /\.js$/,
          exclude: /node_modules/,
          use: 'babel-loader'
        },{
          test: /\.glsl$/,
          exclude: /node_modules/,
          use: 'glsl-loader'
        }]
      }
    }
  }

  _.merge(config, custom(core, config));


  return config;
};
