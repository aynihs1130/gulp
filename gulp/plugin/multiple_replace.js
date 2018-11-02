'use strict';

const OPTIONS = {
  context: '<!--% %%WORD%% %-->'
}

let _ = require('lodash');
let Transform = require('readable-stream/transform');
let rs = require('replacestream');
let istextorbinary = require('istextorbinary');

module.exports = function(replace_word, opt) {

  let option = _.extend({}, OPTIONS, opt);

  let word = option.context.replace('%%WORD%%', '(' + _.map(replace_word, (v,k) => {
    return k;
  }).join('|') + ')');

  let exp = new RegExp(word, 'g');

  return new Transform({
    objectMode: true,

    transform: function(file, enc, callback) {

      if (file.isNull()) {
        return callback(null, file);
      }

      //- stream
      //- TODO 確認できてない。
      if (file.isStream()) {
        file.contents = file.contents.pipe(rs(exp, (a,b,c) => {
          return replace_word[b];
        }));

      }else if (file.isBuffer()) {
        file.contents = new Buffer((file.contents+'').replace(exp, function(a,b,c){
          return replace_word[b];
        }));
      }

      return callback(null, file);
    }

  });
};
