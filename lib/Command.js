var child_process = require('child_process');
var fs = require('fs');
var path = require('path');
var exists = fs.existsSync || path.existsSync;

var q = require('./utility').q;

module.exports = {
  Command: Command,
  execSync: execSync
};


/**
 * Create a function that executes the given command when called, recursively joining params to a space delimeted argv list.
 * Will also have a build in `.help()` function.
 * @param {String}  name        The command name which will become the function's name as well with spaces replaced by underscores
 * @param {Boolean} splitLines  Whether to automatically split all reponses into an array of lines
 */
function Command(command, name, formatter){
  if (typeof name === 'function') {
    formatter = name;
    name = command;
  } else if (!formatter) {
    formatter = function(s){ return s.trim().split(/\r?\n/g) };
  }
  name = name || command;
  var run = eval(fn(name, 'return formatter(execSync('+q(command)+', arguments))'));
  run.__proto__ = Command.prototype;
  return run;
}

Command.prototype = {
  __proto__: Function.prototype,
  constructor: Command,
  help: function help(){
    return execSync(this.name.replace(/_/g, ' '), arguments, '/?').trim().replace(/\r?\n/g);
  }
}


/**
 * Execute a command using cmd.exe synchronously
 * @params {Any[]}   Params will be recursively joined to a space delimeted argv list
 * @return {String}  return value of the command
 */
function execSync(){
  var f = 'sync' + Math.random();
  child_process.exec(makeParams(arguments)+' 1>'+f+' 2>&1 & ren '+f+' '+f+'_');
  f += '_';
  while (!exists(f));
  var output = fs.readFileSync(f, 'utf8');
  fs.unlinkSync(f);
  return output;
}



function fn(name, params, body){
  if (arguments.length === 2) {
    body = params;
    params = '';
  }
  return '1 && function '+name.replace(/\s/g, '_')+'('+params+'){\n'+body+'\n}';
}

function applyable(o){
  return Array.isArray(o) || Object.prototype.toString.call(o) === '[object Arguments]';
}

function makeParams(){
  var params = [];
  for (var k in arguments) {
    if (applyable(arguments[k])) {
      params.push(makeParams.apply(null, arguments[k]));
    } else {
      params.push(arguments[k]);
    }
  }
  return params.join(' ');
}
