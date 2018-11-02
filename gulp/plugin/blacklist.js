/*
* black list notification.
* */
let _ = require('lodash');
let gutil_ = require('gulp-util');
let through_ = require('through2');
let chalk_ = require('chalk');

let Blacklist = require('./_class/blacklist/')


module.exports = function(options) {
  options = options || {};

  let restoreStream = through_.obj();
  let blacklist = new Blacklist(options);


  return through_.obj(function(file, encoding, callback) {

    if (file.isStream()) {
      throw new gutil_.PluginError('Stream not supported');
    }

    let text = String(file.contents);
    let name = file.history[0].replace(file.base, '');
    let error = [];
    let l = blacklist.lists.length;

    let result = blacklist.check(text);


    /*
    * output log.
    * */
    if(result.length > 0){
      console.log([
        chalk_.yellow('\nFile:'),
        name
      ].join(' '));

      _.each(result, function(v){
        console.log([
          chalk_.red('>>'),
          chalk_.green('line:' + v.line),
          v.log
        ].join(' '))
      });
    }

    options.callback && options.callback(blacklist.list, name, result);

    restoreStream.write(file);
    callback(null, file);
  });
}
