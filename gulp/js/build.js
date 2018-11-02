'use strict';

const webpack_ = require('webpack');
const _ = require('lodash');
const path_ = require('path');
const fs_ = require('fs');
const isWindows = (process.platform === 'win32');

/*
* convert babel file.
* */
module.exports = function(){

  let webpack_conf = this.conf.webpack;
  webpack_conf.entry = this.getEntry();

  let variable = _.merge(
    {},
    this.conf.define_variable,
    { __wp: { 'var': JSON.stringify(this.gulp._variable) } }
  );

  webpack_conf.plugins.push(new webpack_.DefinePlugin(variable));

  webpack_(webpack_conf, (err,stats) => {
    if (err) {
      //throw new gutil.PluginError('webpack:build', err);
      return
    }
    console.log(stats.toString({
        chunks: false, // Makes the build much quieter
        colors: true
    }));
  });
};
