const DELETE_FILE = [
  '.DS_Store'
];

const EMPTY_FILE = 'empty';

let _ = require('lodash');
let Q_ = require('q');
let path_ = require('path');
let chalk_ = require('chalk');
let fs_ = require('fs');
let del = require('del');
let glob = require('glob');


module.exports = class Clean{

  constructor(gulp, plugin, conf){
    if(!gulp || !plugin || !conf) {
      return;
    }

    this.gulp = gulp;
    this.plugin = plugin;
    this.conf = conf;
    this.delete_file = DELETE_FILE;
    this.task_exp = /:clean$/;

    _.isArray(this.conf.delete_file) &&
      this.delete_file.concat(this.conf.delete_file);

    this.init();
  }

  init(){
    this.scope = [
      this.conf.cwd,
      path_.join(this.conf.cwd, this.conf.dist)
    ];

    //-
    this.deleteEmptyFile();

    //- add task.
    this.setTask();
  }


  setTask(){

    this.gulp.task('main:clean', () => {

      //- 不要になったemptyファイルを削除
      this.deleteEmptyFile();

      //- 空ディレクトリの削除
      this.deleteEmptyDir(this.conf.dist);

      //_.each(this.gulp.tasks, function(v, k){
      //  if(exp.test(v.name)){
      //    this.gulp.start(v.name);
      //  }
      //}, this);

    });

  }

  run(file){
    let success = [];
    let error = [];

    _.each(file, (f) => {
      let path = path_.resolve(f),

      flg = _.some(this.scope, (scope) => {
        return path.indexOf(scope) === 0;
      });

      if(flg) {
        success[success.length] = f;
      }else {
        error[error.length] = f;
      }

    });

    _.each(success, (f) => {

      fs_.open(f, 'r', (err, fd) => {

        if(err) {
          console.log([
            chalk_.red('>>'),
            'No File:',
            chalk_.gray(f)
          ].join(' '));

          return;
        }

        del(f, {'force': true});

        console.log([
          chalk_.green('>>'),
          'Remove:',
          chalk_.gray(f)
        ].join(' '));

      });

    });

    _.each(error, (f) => {
      console.log([
        chalk_.red('>>'),
        'No Scope File:',
        chalk_.gray(f)
      ].join(' '));
    });

  }


  //- エンプティファイルがあるディレクトリにそれ以外のものがあったら
  //- エンプティファイルを削除する。
  deleteEmptyFile(){
    let empty_src = path_.join(this.conf.__src__, '**/' + EMPTY_FILE);

    glob(empty_src, (err, files) => {

      if(err) {
        console.log(err);
        return
      }

      _.each(files, (file,i) => {
        let dir = file.replace(EMPTY_FILE, '');

        fs_.readdir(dir, (err, files) => {
          (files.length > 1) && this.delFile(file);
        });
      });
    });
  }

  deleteEmptyDir(path){
    var def = Q_.defer(),
    exp = /^..\//,
    origin = path,
    rm = [];

    read(path).then(() => {
      console.log('all finish');
    });

    return def.promise;

    function read(path){
      var def = Q_.defer(),
      rel = path_.relative(origin, path);

      if(exp.test(rel)){
        setTimeout(() => { def.resolve(); });
        return def.promise;
      }

      fs_.readdir(path, (err, files) => {
        var dirs = [],
        flg;

        if(!files || files.length === 0) {
          //ディレクトリの中身が空のパターン
          if(path_.relative(origin, path) !== '') {
            this.delFile(path);
            //一個上の階層を再探索
            read.call(this, path_.join(path, '../')).then(() => {
              def.resolve();
            });
          }

        }else {
          _.each(files, (file) => {
            var p = path_.join(path, file),
            stat;

            try {
              stat = fs_.statSync(p);
            }catch(e) {
              return;
            }

            if (stat.isDirectory()) {
              flg = true;
              //下層ディレクトリの探索開始
              dirs[dirs.length] = p;

            }else if(stat.isFile() && _.includes(DELETE_FILE, file)) {
              //削除対象ファイルの削除
              //@DELETE_FILE + config.delete_fileで拡張
              this.delFile(p);
            }else {
              flg = true;
            }
          });

          if(!flg) {
            //削除ファイルを削除して空になったパターン
            if(path_.relative(origin, path) !== '') {
              delFile(path);
              //一個上の階層を再探索
              read.call(this, path_.join(path, '../')).then(() => {
                def.resolve();
              });
            }

          }else if(dirs.length === 0) {
            def.resolve();

          }else {
            Q_.all(_.map(dirs, (dir) => {
              return read.call(this, dir);
            })).then(() => { def.resolve(); });
          }

        }
      })
      return def.promise;
    }

    //指定ファイル/ディレクトリの削除
  }


  delFile(path){

    //if(_.includes(rm, path)) { return; }

    //rm[rm.length] = path;

    del.sync(path, {'force': true});

    console.log([
      chalk_.green('>>'),
      'Remove:',
      chalk_.gray(path)
    ].join(' '));
  }
}
