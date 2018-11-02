const REDIRECT_URL = 'http://localhost/callback';

/*
* require Module
* */
let fs = require('fs');
let readline = require('readline');
let googleAuth = require('google-auth-library');
let _ = require('lodash');
let Q_ = require('q');


module.exports = class Token {

  /*
  * @constructor
  * トークンを扱うClass.
  * @param {string} id - クライアントID
  * @param {string} secret - クライアント シークレット
  * @param {string} scope - アクセスする範囲
  * @param {string} file - TOKENの保存先
  * */
  constructor(id, secret, scope, token_file){
    this.id = id;
    this.secret = secret;
    this.scope = scope;
    this.token_file = token_file;

    this.init();
  }

  /*
  * 初期化メソッド
  * クライアントの作成
  * */
  init(){
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    this.auth = new googleAuth();
    this.client = new this.auth.OAuth2(this.id, this.secret, REDIRECT_URL);
  }

  /*
  * 読み取りメソッド
  * ファイルからトークンを取得
  * 無ければ取得
  * */
  read(d) {
    d || (d = Q_.defer());

    fs.readFile(this.token_file, (err, token) => {
      if (err) {
        this.getAccessToken().then(this.read.bind(this, d));
        return;
      }
      this.client.credentials = JSON.parse(token);
      d.resolve();
    });
    return d.promise;
  }

  /*
  * アクセストークンを取得する
  * 取得後保存
  * */
  getAccessToken() {

    let def = Q_.defer();
    let url = this.client.generateAuthUrl({
      access_type: 'offline',
      scope: this.scope
    });

    console.log('Visit the URL: ', url);

    this.rl.question('Enter the code here: ', (code) => {

      this.rl.close();

      this.client.getToken(code, (err, tokens) => {

        if(err) {
          console.log("Error: one more please.");
          return def.resolve();
        }

        this.client.credentials = tokens;
        this.save().then(() => {
          def.resolve();
        });

      });

    });

    return def.promise;
  }


  /*
  * 保存メソッド
  * 取得したトークンを保存する
  * */
  save() {
    let d = Q_.defer();

    fs.writeFile(this.token_file, JSON.stringify(this.client.credentials), (err)  => {
      if(err) {
        console.log(err);
        d.reject();
        return;
      }
      d.resolve();
    });

    return d.promise;
  }

  /*
  * 削除メソッド
  * 保存したトークンを削除する
  * */
  remove() {
    let d = Q_.defer();

    fs.unlink(this.file, function(err) {
      if(err) {
        console.log(err);
        d.reject();
        return;
      }
      d.resolve();
    });

    return d.promise;
  }
}
