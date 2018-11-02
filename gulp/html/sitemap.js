const KEYNAME = 'link';
const exp = /\/$/;

let _ = require('lodash');
let path_ = require('path');
let isWindows_ = (process.platform === 'win32');

/**
* データ作成
* @param data sitemap.jsonのデータ.
*/
module.exports = function(sitemap, assets_path){

  let doc_root = this.conf_parent.doc_root;
  let output_dir = this.conf.dist;

  return !sitemap ? false : parse.call(this);

  /*
  * config.meta を処理
  * */
  function parse(){
    let result = {};

    //meta.json を処理
    _.each(sitemap, (v, k) => {
      let path = makePath_.call(this, _.clone(v));
      let dir = k.split('/');

      result[k] = _.extend({
        __key__: k,
        __dir_map__: dir,
        class_name: this.makeClassName(v.file)
      }, v, path);

    });

    return result;

    /**
    * 変数にパスをぶち込む
    * @param {string} data - 自信の場所
    */
    function makePath_(data){
      type = data.path_type||this.data.core.path_type;

      if(data.url.slice(-1) === '/') {
        data.url += 'index';
      }

      let result = {};
      let all_data = this.meta_data;
      let dir = path_.dirname(data.url);

      result[KEYNAME] = {};

      //- 一旦document rootからの絶対パスを作成
      _.each(assets_path, (v, k) => {

        let path = path_.join(
          '/',
          output_dir.replace(doc_root, ''),
          v
        );

        if (isWindows_) {
          path = path.replace(/\\/g, '/');
        }

        //- バックスラッシュ終わりで統一
        !exp.test(path) && (path += '/');

        result[k] = path;
      });


      //- サイトマップに記載あるページへのパスを生成
      _.each(_.clone(sitemap), (v, k) => {
        let kk = k.split('/');
        let r;

        v.url = v.url.replace(/\/index$/, '\/');

        result.link[k] = v.url;

        if(kk.length > 1) {
          r = result.link;

          //- 再帰的に連想配列を生成
          _.each(kk, (vv, i) => {

            if(i === (kk.length - 1)) {
              r[vv] = v;
            } else {
              !_.isObject(r[vv]) && (r[vv] = {});
              r = r[vv];
            }

          });
        }
      });

      //- 絶対パスの場合そのまんま返す.
      if(type === 'absolute') {
        return result;
      }

      //- 相対パスの作成
      _.each(result, (v, k) => {
        if(k === KEYNAME) {
          result[k] = _.extend({}, relLink(_.clone(v)));

        }else {
          let path = path_.relative(dir, v).replace(/\\/g, '/');
          //- バックスラッシュ終わりで統一
          !exp.test(path) && (path += '/');
          result[k] = path;
        }
      });


      return result;


      //- ページへのリンクの相対パス作成
      function relLink(obj){
        let result = {};
        set(obj)

        return result;

        function set(obj){
          _.each(obj, (v, k) => {
            let path;

            if(!_.isObject(v)){
              path = path_.relative(dir, v).replace(/\\/g, '/');
              if(!path) {
                path = './' + _.last(v.split('/'));

              }else {
                if(v.slice(-1) === '/') {
                  path += '/';
                }
              }
              result[k] = path;

            }else {
              set(v);
            }
          });
          return obj;
        }
      }
    }
  }
}
