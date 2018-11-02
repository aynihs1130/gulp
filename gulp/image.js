const SPRITE_IMG_NAME = 'sprite.png';
//- use module.
const _ = require('lodash');
const glob_ = require('glob');
const chalk_ = require('chalk');
const path_ = require('path');

const pngquant = require('imagemin-pngquant');
const mozjpeg = require('imagemin-mozjpeg');

module.exports = class Image {
  /*
  * @constructor
  * @param {Gulp Object} gulp Object.
  * @param {Gulp Module Object} gulp-{*} module.
  * @param {Object} config.js.
  * */
  constructor(gulp, plugin, conf){
    if(!gulp || !plugin || !conf) {
      return;
    }
    this.gulp = gulp;
    this.plugin = plugin;
    this.conf = conf.img;
    this.conf_parent = conf;
    this.init();
  }

  init(g, p, cc){
    //- 画像ミニファイ
    this.src = _.map(this.conf.src, (src) => {
      return path_.join(this.conf.work, src);
    }).concat(_.map(this.conf.ignore, (src) => {
      return '!' + path_.join(this.conf.work, src);
    }));

    if(this.conf_parent.css){
      //- cssのアウトプット先
      this.css_dir = this.conf_parent.css['dist'];
      //- スプライト用sass の吐き出し先
      this.sprite_sass_dir = this.conf_parent.css['sprite_dir'];
      //- スプライト用 glob.
      this.sprite_src = path_.join(this.conf.work, this.conf.sprite.src);
    }

    //- タスクの登録
    this.setTask();

  }

  setTask(){
    //- 画像ミニファイタスク
    this.gulp.task('image:build', () => {
      this.run(this.gulp.src(this.src));
    });

    //- imgディレクトリは以下の空ディレクトリを削除
    this.gulp.task('image:clean', () => {
      if(this.gulp._custom['clean']){
        this.gulp._custom['clean'].deleteEmptyDir(this.conf.work);
      }
    });

    //- スプライト画像タスク
    this.sprite_src && this.gulp.task('image:sprite:build', this.sprite.bind(this));
  }


  run(stream){
    stream.pipe(this.plugin.plumber())

    .pipe(this.plugin.if(this.gulp.__state__ === 'watch', this.plugin.cached('image')))

    //- devモードの時は圧縮なし
    .pipe(this.plugin.if((!this.conf_parent.dev && this.conf.minify), this.plugin.imagemin([
      pngquant({
        quality: '65-80',
        speed: 1,
        floyd:0
      }),
      this.plugin.imagemin.jpegtran(),
      this.plugin.imagemin.svgo(),
      this.plugin.imagemin.optipng(),
      this.plugin.imagemin.gifsicle()
    ])))

    //- 吐き出し
    .pipe(this.gulp.dest(this.conf.dist));

    //- 告知だが、ファイル数多いとうまくいかないから
    //- 一旦削除
    //.pipe(this.plugin.notify({
    //    message: 'Compile: <%= file.relative %>'
    //}));
  }

  sprite(){
    var g = new glob_.Glob(this.sprite_src, (err, result) => {
      if (err) {
        g.abort();
        console.warn(err);
        return;
      }

      _.each(result, (path) => {
        var p = path.replace(this.conf.work, ''),
        key, src, dist;

        p = _.compact(p.split('/'));
        p.pop();

        key = p.length < 1 ? _.uniqueId(['sprite_']) : p.join('_'),
        src = path + '*.png',
        dist = path_.join(this.conf.dist, p.join('/'));
        make_.call(this, key, src, dist);

      });

    });


    /*
    * Make Sprite Img.
    * @param {string} css - css file name.
    * @param {string} src - img src path.
    * @param {string} dist - output dir.
    * */
    function make_(css, src, dist) {
      css = '_' + css + '.scss';

      var stream = this.gulp.src(src)
      .pipe(this.plugin.spritesmith({
        imgName: SPRITE_IMG_NAME,
        cssName: css,
        imgPath: path_.relative(this.css_dir, dist) + '/' + SPRITE_IMG_NAME,
        cssFormat: 'scss', //フォーマット
        cssVarMap: function (sprite) {
          sprite.name = 'sprite-' + sprite.name;
        }
      }));

      stream.img.pipe(this.gulp.dest(dist));

      stream.css.pipe(this.gulp.dest(this.sprite_sass_dir));

      console.log([
        chalk_.green('>>'),
        'Create:',
        chalk_.gray(path_.join(this.sprite_sass_dir, css))
      ].join(' '));

      console.log([
        chalk_.green('>>'),
        'Create:',
        chalk_.gray(path_.join(dist, SPRITE_IMG_NAME))
      ].join(' '));
    }

  }

  /*
  * 削除
  * @param {string} file
  * */
  clean(file){
    var dist = path_.join(this.conf.dist, file);
    this.gulp._custom.clean.run([dist]);
  }

}
