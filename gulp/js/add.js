'use strict';

/*
* add npm module.
* */

const CONFIG = require('../config.js')
const SRC_DIR = CONFIG.__src__;


const _ = require('lodash');
const path_ = require('path');
const fs_ = require('fs');
const exec_ = require('child_process').exec;
const chalk_ = require('chalk');
const minimist_ = require('minimist');
const del_ = require('del');
let Q_ = require('q');

const npm_dir = path_.join(
  process.cwd(),
  SRC_DIR
);

let argv = minimist_(process.argv.slice(2));

module.exports = function(){

  if(!argv.m && !argv.module) { return; }

  let modules = _.compact((argv.m||'').split(',').concat((argv.module||'').split(',')));

  console.log([
    chalk_.green('install for'),
    chalk_.yellow(modules.join(' '))
  ].join(' '));

  exec_('npm --prefix '+npm_dir+' install '+npm_dir+' '+modules.join(' ')+' -S', () => {
    checkDir().then(() => {
      console.log(chalk_.green('\ncomplete all install\n'));
    });
  });

}

function checkDir(){
  let def = Q_.defer();

  fs_.readdir(npm_dir, (err, items) => {

    Q_.all(_.map(items, (item) => {

      let def = Q_.defer();
      let path = path_.join(npm_dir, item);
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
