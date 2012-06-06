var fs = require('fs');
var path = require('path');

var existsSync = fs.existsSync || path.existsSync;

var hasOwn = Function.call.bind({}.hasOwnProperty);


exports.extend = function extend(o){
  var z,x,y,w;
  for (z in y = arguments)
    if (z)
      for (x in w = y[z])
        if (hasOwn(w, x))
          o[x] = w[x];
  return o;
}

exports.methods = function methods(o){
  var z,x,y,w,v;
  for (z in y = arguments)
    if (z)
      if (Array.isArray(x = y[z]) || typeof x === 'function' && (x = [x]))
        for (w = 0; v = x[w]; w++)
          if (typeof v === 'function' && v.name)
            o[v.name] = v;
  return o;
}


exports.q = function q(str){
  return '"'+str.replace(/"/g, '\\\"')+'"';
}

exports.arrayToObject = function arrayToObject(arr, callback){
  return arr.reduce(function(r,s){
    var result = callback(s);
    if (Array.isArray(result)) {
      r[result[0]] = result[1];
    }
    return r;
  }, {})
}


exports.lazyProperty = function lazyProperty(obj, name){
  if (Array.isArray(name)) {
    name.forEach(function(prop){ lazyProperty(obj, prop) });
    return obj;
  }
  var visible = name[0] === '$';
  name = visible ? name.slice(1) : name;
  Object.defineProperty(obj, name, {
    configurable: true,
    enumerable: visible,
    get: function(){},
    set: function(v){ Object.defineProperty(this, name, { value: v, writable: true }) }
  });
}

var exists = exports.exists = function exists(x){
  return existsSync(path._makeLong(x))
}


var expand = exports.expand = function expand(str){
  return Object.keys(process.env).reduce(function(str, name){
    return str.replace(new RegExp('%'+name+'%', 'ig'), process.env[name]);
  }, str);
}


exports.resolve = function resolve(x){
  var resolved = x;
  if (!exists(resolved)) {
    if (!exists(resolved = expand(x))) {
      return false
    }
  }
  return resolved;
}

