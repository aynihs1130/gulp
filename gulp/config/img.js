'use strict';

const EXTENSION = ['jpg', 'gif', 'png', 'svg'];

const _ = require('lodash');
const path_ = require('path');

module.exports = (core) => {
  let dir_name = 'img';

  let sprite_dir = '_sprite';

  let work = path_.join(core.__src__, dir_name);

  let dist = path_.join(core.dist, core.assets_dir, dir_name);

  let custom;

  try {
    custom = require(path_.join(core.custom_dir, 'config/img'));
  } catch(e) {
    custom = function(){return {};};
  }

  let config = {
    work,
    dist,
    src: [
      '**/*.{'+EXTENSION.join(',')+'}'
    ],

    //- 圧縮するか否か
    minify: true,

    ignore: [
      '**/' + sprite_dir + '/*.{'+EXTENSION.join(',')+'}',
      '**/_*.{'+EXTENSION.join(',')+'}'
    ],
    sprite: {
      src : '**/' + sprite_dir + '/',
    }
  };

  _.merge(config, custom(core, config));

  return config;
};
