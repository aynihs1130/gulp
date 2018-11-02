//- use module.
let _ = require('lodash');
let path_ = require('path');
let page_exp = /^(\$|\/)/;
let isWindows_ = (process.platform === 'win32');
let chalk_ = require('chalk');


//- pugファイルをhtmlにして出力
module.exports = function(stream){

  //- error対策
  stream.pipe(this.plugin.plumber())

  //- pugファイル内に渡す変数を作成
  .pipe(this.plugin.data(data_.bind(this)))

  //- global変数変換
  .pipe(this.plugin.multiple_replace(this.replace_word, (this.conf.multiple_replace||{})))

  //- blacklistワードのチェック
  .pipe(this.plugin.blacklist({
    callback: function(data, error_list){
    }
  }))

  //- pugをhtmlに出力
  .pipe(this.plugin.pug(this.conf.pug))

  //- watch時のみキャッシュみてやる
  .pipe(this.plugin.if(this.gulp.__state__ === 'watch', this.plugin.cached('html')))

  //- ファイルの名前変更
  .pipe(this.plugin.rename(rename_.bind(this)))

  //- 圧縮 処理
  .pipe(this.plugin.if((!this.conf_parent.dev && this.conf.minify), this.plugin.minifyHtml(this.conf.minify_option)))

  //- encode 処理
  .pipe(this.plugin.if((this.gulp._variable.charset && this.gulp._variable.charset !== 'utf-8'), this.plugin.convertEncoding({
    to: this.gulp._variable.charset
  })))

  //- 出力
  .pipe(this.gulp.dest(this.conf.dist))

  .pipe(this.plugin.debug())
  .pipe(this.plugin.size({
    title: 'html'
  }))
  .pipe(this.plugin.notify({
      message: 'Compile: <%= file.relative %>'
  }));


  //- output file用にリネーム
  function rename_(path){
    if (isWindows_){
      path.dirname = path.dirname.replace(/\\/g, '\/');
    }

    if(!this.data.sitemap) {
      return;
    }

    let key = path.dirname === '.' ?
      path.basename : path_.join(path.dirname, path.basename);

    let data = this.data.sitemap[key];

    if(!data) { return; }

    let output = data.file.split('/');
    let base = output.pop().split('.');
    let name = base.shift()

    path.dirname = output[0] ? output.join('/') : '.';
    path.basename = name;
    path.extname = '.' + base.join('.');
  }


  /**
  * 変数の受け渡し
  * makeDataでつくったdataをstreamに渡す
  * @param {Object} f - gulp streamからわたされるfile vinly Object.
  */
  function data_(f){

    //- systemの絶対パス
    let resolve_path = path_.join(
      process.cwd(),
      this.conf.work
    );

    let resolve_file_path = f.history[0].replace(resolve_path, '');

    let split_path = getLevel_.call(this, resolve_file_path);

    let data = getData_.call( this, _.clone(split_path));

    let key = split_path.join('/');

    let before_name = split_path.pop();

    let result = {}

    let sitemap_data = this.data.sitemap[key];

    let output_file_name;

    if(sitemap_data) {
      output_file_name = sitemap_data.file.split('/');
      result['name'] = output_file_name.pop().replace(this.exp_work, '');
      result['dirs'] = output_file_name;
    }else {
      result['name'] = before_name.replace(this.exp_work, '');
      result['dirs'] = split_path;
    }

    let variable = _.extend(
      result,
      this.gulp._variable,
      _.clone(this.data.core),
      sitemap_data ? sitemap_data : {},
      data
    );

    //- var_dump
    let var_dump = _.bind(function(data) {
      data || (data = this);

      log_(data);

      function log_(data, key='', indent=''){
        if(_.isArray(data) || _.isObject(data)) {
          if(key || key === 0) {
            console.log(`${indent}"${key}" =>`);
          }
          _.each(data, (v, k) => {
            log_(v, k, indent+ '  ');
          });
        }else {
          if(key || key === 0) {
            console.log(`${indent}"${key}" => ${chalk_.green(data)}`);
          }else {
            console.log(`${indent}${data}`);
          }
        }
      }
    }, variable);

    //- 相対パスを返す関数
    let relative = ((data) => {
      return function(path){
        return path_.relative(path_.dirname(data.url), path);
      }
    })(variable);

    return _.extend({
      _:_,
      f_util: {
        var_dump,
        relative
      }
    }, variable);


    //- streamのパスを使いやすい形にパース
    function getLevel_(filepath){
      if (isWindows_){
        filepath = filepath.replace(/\\/g, '/');
      }
      filepath = _.difference(filepath.split('/'), ['..']);

      return _.compact(_.map(filepath, (v) => {
        return v.replace(this.exp_work, '');
      }));
    }

    //- 構造化したデータを算出.
    function getData_(filepath){
      let result = filter(this.data.page);
      let data = this.data.page;

      _.each(filepath, (v, i) => {

        if(!data) {
          return;
        }

        if(i === filepath.length -1) {
          v = '$' + v;
        }else {
          v = '/' + v;
        }

        data = data[v];

        //- 再帰的に継承
        data && _.extend(result, filter(data));
      });


      return result;

      //- 不必要なデータを削除
      function filter(data){
        let result = {};
        _.each(data, (v, k) => {
          if(!page_exp.test(k)){
            result[k] = v;
          };
        });
        return result;
      }
    }
  }
}
