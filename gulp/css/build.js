'use strict';

/*
* convert stylus => css file.
* */
module.exports = function(stream){


  return this.gulp.src(this.src)

  .pipe(this.plugin.plumber())

  .pipe(this.plugin.multiple_replace(this.replace_word, (this.conf.multiple_replace||{})))

  .pipe(this.plugin.stylus(this.conf.stylus_options))

  //watch時のみキャッシュみてやる
  .pipe(this.plugin.if(this.gulp.__state__ === 'watch', this.plugin.cached('css')))

  //prefixつけるよ
  .pipe(this.plugin.autoprefixer(this.conf.browsers))

  //devモードの時は圧縮なし
  .pipe(this.plugin.if((!this.conf_parent.dev && this.conf.minify), this.plugin.csso()))

  //encode 処理
  .pipe(this.plugin.if((this.gulp._variable.charset !== 'utf8'), this.plugin.convertEncoding({
    to: this.gulp._variable.charset
  })))

  //出力
  .pipe(this.gulp.dest(this.conf.dist))

  .pipe(this.plugin.notify({
      message: 'Compile: css.'
  }));

};
