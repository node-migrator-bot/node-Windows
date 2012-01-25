var Command = require('./Command').Command;
var expandPath = require('./utility').expandPath;
var resolveDir = require('./utility').resolveDir;
var q = require('./utility').q;




module.exports = function driveAlias(name, folder){
  switch (arguments.length) {
    case 0:
      return aliases = aliases();
    case 1:
      delete aliases.cache[name[0]];
      return subst(drive(name), '/d')[0] || true;
    case 2:
      alias[name[0]] = folder = resolveDir(folder);
      return subst(drive(name), q(folder))[0] || folder;
  }
}


var subst = new Command('subst');

function drive(name){ return name[0]+':' }

function aliases(){
  return aliases.cache = subst().reduce(function(r,s){
    if ((s = s.split(':\\: => ')).length) {
      r[s[0]] = s[1];
    }
    return r;
  }, {});
}

aliases.cache = {};