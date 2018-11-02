'use strict';

const _ = require('lodash');
const path_ = require('path');
const PugInheritance = require('../lib/pug_inheritance');
let isWindows_ = (process.platform === 'win32');

module.exports = class HTMLWatch {

  constructor(parent){
    this.parent = parent;
    this.init();
  }

  init(){
    let c = this.conf = this.parent.conf.html;
    let custom = this.parent.gulp._custom;

    this.absolute_path = path_.join(process.cwd(), c.work);

    this.inheritance = new PugInheritance(c.work, {
      extension: c.work_extension,
      ignore: c.ignore
    });

    //- 一枚ビルドするやつ
    let src = _.map(c.src, (src) => {
      return path_.join(c.work, src);
    }).concat(_.map(c.ignore, (src) => {
      return path_.join('!' + c.work, src);
    }));

    //- 変更あったら全部ビルド
    let conf_file = _.compact([
      path_.join(this.absolute_path, c.core),
      path_.join(this.absolute_path, c.page),
      path_.join(this.absolute_path, c.sitemap)
    ]);

    //- 対応ファイルだけビルド
    let partial = _.map(c.ignore, (src) => {
      return path_.join(c.work, src);
    })

    if(!/\/$/.test(this.absolute_path)) {
      this.absolute_path += isWindows_ ? '\\' : '/';
    }

    //- 個別ビルド
    this.parent.plugin.watch(src, (vinly) => {

      let file = vinly.history[0];
      let rel_path = file.replace(this.absolute_path, '');
      let stream = this.parent.gulp.src(file, {
        base: this.absolute_path
      });
      let name;

      if(vinly.event === 'add') {
        this.inheritance.addFile(file);
      }else if(vinly.event === 'unlink') {
        this.inheritance.delate(file);
      }else {
        this.inheritance.reset(file);
      }

      //- 関連する公開ディレクトリのファイルを削除
      if(vinly.event === 'unlink') {
        custom.html.clean(rel_path);

      }else {
        //- 変更あったファイルをbuild
        custom.html.build(stream);
        name = custom.html.getName(rel_path);

        //- create new css file.
        if(name) {
          name && custom.css.generate(name);
        }
      }

    });

    //- パーシャルビルド
    this.parent.plugin.watch(partial, (vinly) => {
      let file = vinly.history[0];
      let name = path_.relative(this.absolute_path, file);
      this.inheritance.reset(file);

      let files = this.inheritance.getTargetFile(name);

      if(!files || !files.length) { return; }


      let stream = this.parent.gulp.src(_.map(files, (file) => {
        return path_.join(this.absolute_path, file);
      }), {
        base: this.absolute_path
      });
      custom.html.build(stream);
    });


    //- 全部ビルド
    this.parent.plugin.watch(conf_file, (vinly) => {
      custom.html.updateAllData();
      this.parent.gulp.start(['html:build']);
    });


  }
}


