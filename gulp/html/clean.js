let path_ = require('path');

module.exports = function(file){
  let key = file.replace(this.exp_work, '');
  let data = this.data.sitemap[key];
  let dist;

  if(!data || !data.file) {
    return false;
  }

  dist = path_.join(this.conf.dist, data.file);

  this.gulp._custom.clean.run([dist]);
}
