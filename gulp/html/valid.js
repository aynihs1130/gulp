'use strict';
let _ = require('lodash');
let chalk_ = require('chalk');

module.exports = function(){

  var src = this.conf.dist + '**/*.{' + this.conf.extension.join(',') + '}';

  this.gulp.src(src)
    .pipe(this.plugin.htmlValidator({
      format: 'json'
    }))

    // 結果を書き出し
    .pipe(this.gulp.dest(this.conf.valid))

    // ログ表示
    .pipe(this.plugin.intercept((file) => {
      let json = JSON.parse(file.contents.toString());
      let errors = _.filter(json.messages, (e, i, a) => {
        return e.type != 'info'
      });

      if(errors.length > 0) {
        console.log([
          chalk_.green('\n>>'),
          chalk_.yellow(file.history[0])
        ].join(' '));

        _.each(errors, (e) => {
          console.log([
            chalk_.green('line: ' + e.lastLine),
          ].join(' '));
          console.log([
            chalk_.white(e.extract)
          ].join(' '));
          console.log([
            chalk_.red(e.message),
            '\n'
          ].join(' '));
        })
      }
    }))
}
