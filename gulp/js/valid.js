'use strict';

/*
* valid js file.
* コンパイル失敗するし、いらないかも。
* */
module.exports = function(){
  return;
  var src = this.conf.dist + '/**/*.js';

  this.gulp.src(src)

    .pipe(this.plugin.jsvalidate())

    //// 結果を書き出し
    //.pipe(this.gulp.dest(this.conf.valid))

    //// ログ表示
    .pipe(this.plugin.intercept((file) => {
      return;

      let json = JSON.parse(file.contents.toString());
      let errors = json.errors;
      let warnings = json.warnings;

      if(errors.length > 0) {
        console.log([
          chalk_.green('\n>>'),
          chalk_.yellow(file.history[0])
        ].join(' '));

        _.each(errors, (e) => {
          console.log([
            chalk_.green('line: ' + e.line),
            chalk_.yellow('error'),
            chalk_.white(e.errorType)
          ].join(' '));
          console.log([
            chalk_.yellow(e.message),
            '\n'
          ].join(' '));
        })
        _.each(warnings, (e) => {
          console.log([
            chalk_.green('line: ' + e.line),
            chalk_.red('warning'),
            chalk_.white(e.type)
          ].join(' '));
          console.log([
            chalk_.red(e.message),
            '\n'
          ].join(' '));
        })
      }
    }))
}
