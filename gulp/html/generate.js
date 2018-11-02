let _ = require('lodash');
let fs_ = require('fs');
let path_ = require('path');
let chalk_ = require('chalk');

/*
* スプレッドシートからつくったjsonをもとにhtmlファイル生成
* */
module.exports = function(){
  _.each(this.data.sitemap, (v, k) => {
    let dist = k.split('/');
    let output = path_.join(
      process.cwd(),
      this.conf.work,
      k + '.pug'
    );
    let name = dist[dist.length - 1];
    let dir = dist.slice(0, dist.length - 1).join('/');
    let relative = '';

    if(dist.length === 1) {
      relative = './';

    }else {
      _.each(dist, (k, i) => {
        if(i !== dist.length - 1) {
          relative += '../';
        }
      });
    }

    /*
    * 存在しているかチェック
    * 存在していれば無視、していなければ新しくファイル作成
    * */
    fs_.open(output, 'r', (err) => {
      if(!err) { return; }
      create.call(this, name, relative, dir, output);
    });

  });



  function create(name, relative, dir, output){

    this.gulp.src(path_.join(
      this.conf.work,
      this.conf.template
    ))

    .pipe(this.plugin.replace('<%= path %>', relative))

    .pipe(this.plugin.rename((path) => {
      path.basename = name;
      dir && (path.dirname = dir);

    }))

    .pipe(this.gulp.dest(this.conf.work))

    .on('end', function(){
      console.log([
        chalk_.green('>>'),
        'Create:',
        chalk_.gray(output)
      ].join(' '));
    })
  }

}
