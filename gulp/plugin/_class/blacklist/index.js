/*
* black list notification.
* */

const JSON_FILE = 'blacklist.json';

let _ = require('lodash');
let path_ = require('path');
let chalk_ = require('chalk');

module.exports = class Blacklist {

  constructor(option = {}){
    this.json_file = JSON_FILE;
    this.option = option;
    this.init();
  }

  init(){
    let blacklist;

    try {
      blacklist = require(path_.join(process.cwd(), this.json_file));

    }catch(e) {
      blacklist = { list: [] };
    }

    this.lists = _.map(blacklist.list, (exp) => {
      return new RegExp('(' + exp + ')');
    });

    if(this.option.list && _.isArray(this.option.list)) {
      this.lists = this.lists.concat(this.option.list);
    }
  }

  /*
  * check text.
  * */
  check(text){
    let result = [];

    _.each(text.split('\n'), (text, line) => {
      let i = 0;
      let def = text;
      let log = text;
      let l = this.lists.length;
      let exp;
      let f;

      for(;i<l;i++) {
        exp = this.lists[i]

        if(exp.test(text)) {
          f = true;
          text = text.replace(exp, '`$1`');
          log = log.replace(exp, chalk_.red('$1'));
        }

      }

      f && (result[result.length] = {
        line: (line + 1),
        default: def,
        text: text,
        log: log
      });

    });

    return result;
  }
}
