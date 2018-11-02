'use strict';

/*
* generate stylus file.
* */


//- require module.
let path_ = require('path');
let fs_ = require('fs');
let chalk_ = require('chalk');


module.exports = function(key){

  let dist = key.split('-');
  let output;
  let dir;

  dist[dist.length - 1] = '_' + dist[dist.length - 1];
  dir = dist.slice(0, dist.length - 1).join('/');
  output = path_.join(
    this.conf.work,
    dist.join('/') + '.' + this.conf.ext
  );

  fs_.open(output, 'r', (err) => {
    if(!err) { return; }

    this.gulp.src(this.conf.template)

    .pipe(this.plugin.replace('<%= class_name %>', key))

    .pipe(this.plugin.rename((path) => {
      path.basename = dist[dist.length - 1];
      path.dirname = dir;
    }))

    .pipe(this.gulp.dest(this.conf.work))

    .on('end', () => {

      console.log([
        chalk_.green('>>'),
        'Create:',
        chalk_.gray(output)
      ].join(' '));

    });
  });
}
