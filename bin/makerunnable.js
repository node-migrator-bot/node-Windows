var path = require('path');


var exists = require('../lib/utility').exists;
var runnable = require('../lib/runnable');
var cwd = process.cwd();

var args = process.argv.slice(1);
if (path.resolve(args[0]) === __filename) {
  args.pop();
}

args = args.reduce(function(args, arg){
  if (!exists(arg)) {
    arg = path.resolve(process.cwd(), arg);
    if (!exists(arg)) {
      console.log('Unable to find "'+arg+'"');
      return args;
    }
  }
  args.push(arg);
  return args;
}, []);


runnable(args, function(result){
  result.forEach(console.log);
});