'use strict';

const requireDir = require('require-dir');

const _ = require('lodash');

const path_ = require('path');

const g = require('gulp');

const gulp = requireDir('./gulp');

const plugin = require('gulp-load-plugins')({
  pattern: ['gulp-*', 'gulp.*'],
  replaceString: /\bgulp[\-.]/
});

const original_plugin = requireDir('./gulp/plugin');

let custom_tasks;

let variable;

let builds = [];

let cleans = [];

let valids = [];

//- プラグインのマージ
_.extend(plugin, original_plugin);

try {
  custom_tasks = requireDir(path_.join(gulp.config.custom_dir, 'tasks'));
}catch(e) {
}

g._custom = {};
load_variable();

//- 変数ファイルのアップデート
g._updateVariable = load_variable;

//- taskの初期化
_.each(gulp, (obj, k) => {
  if(_.isFunction(obj)){
    g._custom[k] = new obj(g, plugin, gulp.config);
  }
});

//- カスタムタスクの初期化
custom_tasks && _.each(custom_tasks, (obj, k) => {
  if(_.isFunction(obj)){
    g._custom[k] = new obj(g, plugin, gulp.config);
  }
});


//- デフォルトタスク
g.task('default', ['watch']);


//- ビルドタスク
_.each(g.tasks, (v,k) => {
  /:build$/.test(k) && (builds[builds.length] = k);
});

g.task('gulp_test', ()=>{});

g.task('build', builds);

//- クリーンタスク
_.each(g.tasks, (v,k) => {
  /:clean$/.test(k) && (cleans[cleans.length] = k);
});

g.task('clean', cleans);

//- バリデートタスク
_.each(g.tasks, (v,k) => {
  /:valid$/.test(k) && (valids[valids.length] = k);
});

g.task('valid', valids);


function load_variable(){
  delete require.cache[path_.join(process.cwd(), gulp.config.__src__, 'variable.json')];

  try {
    g._variable = require(path_.join(gulp.config.__src__, 'variable.json'));
  } catch(e) {
    g._variable = {};
  }

}
