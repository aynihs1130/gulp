let fs_ = require('fs');
let path_ = require('path');
let chalk_ = require('chalk');
let _ = require('lodash');
let Q_ = require('q');
let Token = require('./lib/token');
let google = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
const HOME = process.env[process.platform == "win32" ? "USERPROFILE" : "HOME"];
const SECRET_JSON_PATH = path_.join(HOME, '.gulp_gapi.json');
const TOKEN_FILEPATH = './.token.json';
const COL_KEY = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const COL_KEY_LENGTH = COL_KEY.length
const A = 'A'.charCodeAt(0);


module.exports = class GetMetadata{

  constructor(gulp, plugin, conf){
    if(!gulp || !plugin || !conf) {
      return;
    }

    this.gulp = gulp;
    this.plugin = plugin;
    this.conf = conf.html;

    this.output_file = path_.join(
      process.cwd(),
      this.conf.work,
      this.conf.sitemap
    );
    this.init();

  }

  /*
  * 初期化 gulpタスクを登録
  * */

  init(){

    try {
      this.key = require(SECRET_JSON_PATH);
    }catch(e){
      console.log([
        'can not find',
        chalk_.red(SECRET_JSON_PATH)
      ].join(' '))
    }


    this.key && this.gulp.task('get:meta', () => {
      this.cnt = 0;

      this.oAuth().then(() => {

        console.log([
          chalk_.green('update'),
          this.output_file
        ].join(' '))

        process.exit();

      }).fail(() => {

        //取得失敗
        console.log([
          chalk_.red('Error')
        ].join(' '))

        process.exit();
      });

    });
  }

  /*
  * タスクの実行 OAuth認証
  * */
  oAuth(def){
    def || (def = Q_.defer());

    if(def && this.cnt >= 5) {
      def.reject();
    }

    this.cnt++;

    // tokenの作成
    this.token = new Token(this.key.id, this.key.pass, SCOPES, TOKEN_FILEPATH);

    this.token.read().then(this.fetch.bind(this)).then(() => {

      this.data = parse_.call(this);

      write_.call(this).then(() => {
        def.resolve();
      });

    }).fail(() => {
      this.token.remove().then(this.run.bind(this, def));
    });

    return def.promise;

    function parse_(){

      let cache = {};
      let json = {};

      _.each(this.feed, (row, j) => {
        let result = _.clone(cache);

        _.each(row, (cell, i) => {
          if(!cell) { return; }

          let name = this.feed_key[i].split(':');
          setValue_(result, name, cell);

        });
        cache = result;
        json[result.id] = result;
      });

      return json;

      /*
      * 再帰的にデータを構築
      * */
      function setValue_(obj, name, val){
        let cnt = 0;
        return set(obj)

        function set(obj) {
          var c = cnt,
          n = name[c];
          cnt++;
          if(!n) { obj = val; }
          if(!name[cnt]) {
            obj[n] = val;
            return obj;
          }else {
            if(_.isNumber(n-0) && _.isArray(obj[n])) {
              obj[n] = [];
            }else if(!_.isObject(obj[n])){
              obj[n] = {};
            }
            set(obj[n])
          }
        }
      }
    }

    function write_() {
      let def = Q_.defer();
      let json = JSON.stringify(this.data);

      //- jsonの書き込み
      var n = fs_.writeFile(this.output_file, json, (err) => {
        if(err) {
          console.log(err);
          throw err;
        }
        def.resolve();
      });
      return def.promise;
    }

  }

  /*
  * スプレッドシートの取得
  * */
  fetch(){
    let def = Q_.defer();

    let sheets = google.sheets('v4');

    //- 一旦サイズを見るため spreadsheet のプロパティを取得
    sheets.spreadsheets.get({
      auth: this.token.client,
      spreadsheetId: this.conf.spreadsheet

    }, (err, response) => {

      if(err) {
        console.log('The API returned an error: ' + err);
        return
      }

      let property = response.sheets[0].properties;

      //- サイズから spreadsheet のバリューを取得
      sheets.spreadsheets.values.get({
        auth: this.token.client,
        spreadsheetId: this.conf.spreadsheet,
        range: encodeURIComponent(property.title)+'!A1:' + endCell_(property.gridProperties),

      }, (err, response) => {

        this.feed_key = response.values.shift();
        this.feed = response.values;
        def.resolve();
      });

      //- 列番号の取得
      //- 数字をアルファベットに変換
      function endCell_(prop){
        return (function(col){
          let s = '';

          while (col >= 1) {
            col--;
            s = String.fromCharCode(A + (col % COL_KEY_LENGTH)) + s;
            col = Math.floor(col / COL_KEY_LENGTH);
          }
          return s;
        })(prop.columnCount) + prop.rowCount;
      }
    });

    return def.promise;
  }

}
