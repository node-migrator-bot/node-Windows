var path = require('path');
var fs = require('fs');
var npm = require('npm');


var exists = require('./utility').exists;


module.exports = function runnable(files, callback){
  npm.load(function(e, npm){
    callback(files.map(function(file){
      if (exists(file)) {
        var parts = {
          dir: path.dirname(file),
          base: path.basename(file),
          ext: path.extname(file)
        };
        parts.name = parts.base.slice(0, -parts.ext.length);
        var cmdfile = path.resolve(npm.globalBin, parts.name+'.cmd');
        fs.writeFileSync(cmdfile, '@node "'+path.join(parts.dir, parts.base)+'" %*');
        return cmdfile + ' succesfully created';
      } else {
        return
      }
    }));
  });
}