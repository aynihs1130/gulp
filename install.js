const DEFAULT_FILE_SET = '../.default_src';
const CONFIG = require('./gulp/config.js')
const SRC_DIR = CONFIG.__src__;

const _ = require('lodash');
const fs_ = require('fs-extra');
const path_ = require('path');
const exec = require('child_process').exec;
const chalk_ = require('chalk');
const del_ = require('del');
const Q_ = require('q');
const src_dir = path_.join( process.cwd(), SRC_DIR);


fs_.stat(src_dir).then(() => {

  return new Promise((resolve, reject) => {
    resolve();
  })

}).catch(() => {

  return new Promise((resolve, reject) => {
    fs_.stat(DEFAULT_FILE_SET).then(() => {

      return copy_().then(() => {
        resolve()

      }).catch((err) => {
        reject(err)
      })

    }).catch(() => {
      resolve()
    })
  })


}).then(() => {

  console.log([
    chalk_.yellow('>> start:'),
    chalk_.white('npm install'),
    chalk_.white('"'+src_dir+'"'),
  ].join(' '));

  exec('npm --prefix '+src_dir+' install '+src_dir, () => {
    console.log(chalk_.green('\ncomplete npm install\n'));
    checkDir().then(() => {
      console.log(chalk_.green('\ncomplete all install\n'));
    });
  });

}).catch((err) => {
  if(err) {
    console.log(err);
    return;
  }
})

function copy_(){
  return new Promise((resolve, reject) => {
    fs_.copy(DEFAULT_FILE_SET, src_dir, (src) => {
      let dirs = src.split(/(\/|\\)/);
      return '.git' !== _.last(dirs);
    }, (err) => {

      if(err) { return reject(err) }

      console.log([
        chalk_.green('>> complete:'),
        chalk_.white('copy for'),
        chalk_.white('"'+DEFAULT_FILE_SET+'"'),
      ].join(' '));

      resolve();
    })
  })
}


function checkDir(){
  let def = Q_.defer();

  fs_.readdir(src_dir, (err, items) => {

    Q_.all(_.map(items, (item) => {

      let def = Q_.defer();
      let path = path_.join(src_dir, item);
      let flg = true;

      try {
        stat = fs_.statSync(path);
      }catch(e) {
        flg = false;
      }

      if (!flg || !stat.isDirectory() ) {
        setTimeout(() => { def.resolve(); });
        return def.promise;
      }

      fs_.readdir(path, (err, files) => {

        if(!files || files.length <= 0) {
          del_.sync(path, {'force': true});
        }
        def.resolve();
      });

      return def.promise;

    }), () => {

      def.resolve();

    });
  });

  return def.promise;
}
