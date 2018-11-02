'use strict';

const EXTENSION = ['*'];

const _ = require('lodash');
const path_ = require('path');


module.exports = function(core){

  let dir_name = 'assets';

  let work = path_.join(core.__src__, dir_name);

  let dist = path_.join(core.dist, dir_name);

  let custom;

  try {
    custom = require(path_.join(core.custom_dir, 'config/assets'));
  } catch(e) {
    custom = function(){return {};};
  }

  let config = _.merge({
    work,
    dist,

    //- 監視する拡張子
    extension: EXTENSION

  });

  _.merge(config, custom(core, config));

  return config;
};
