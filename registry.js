var fs = require('fs');
var path = require('path');
var util = require('util');

var Command = require('./Command').Command;
var lazyProperty = require('./utility').lazyProperty;
var expandPath = require('./utility').expandPath;
var q = require('./utility').q;



module.exports = registry;


function registry(key, options){
  key = typeof key === 'string' ? resolve(key) : key.toString();
  var p = [q(key)];

  if (options) {

    options.recursive        && p.push('/s');
    options.search           && p.push('/f', q(options.search));
    options.in === 'keys'    && p.push('/k');
    options.in === 'values'  && p.push('/d');
    options.case             && p.push('/c');
    options.exact            && p.push('/e');
    options.type             && p.push('/t', options.type);

  } else {
    options = {};
  }

  var result = new Keyset(key);

  registry.query(p).reduce(function(current, line){

    if (line.indexOf(key) === 0 && line !== key) {

      if (options.recursive) {
        result[line.slice(key.length + 1)] = current = new Keyset(line);

      } else {
        Object.defineProperty(result, line.slice(key.length + 1), {
          get: function(){ return registry(line, options) },
          enumerable: true
        });
      }

    } else if (line.indexOf('    ') === 0) {

      var entry = new Entry(current, line);
      current[entry.name] = entry;

    }

    return current;

  }, result);

  return result;
}


var commands = [

  'query', 'add', 'delete', 'copy',
  'save', 'restore', 'load', 'unload',
  'compare', 'export', 'import', 'flags'

].map(function(s){ return registry[s] = new Command('reg '+s) });


var rootkeys = {
  HKLM: 'HKEY_LOCAL_MACHINE',
  HKCU: 'HKEY_CURRENT_USER',
  HKCR: 'HKEY_CLASSES_ROOT',
  HKU: 'HKEY_USERS',
  HKCC: 'HKEY_CURRENT_CONFIG',
};


function resolve(name){
  name = name.split(/[\\\/]/);
  if (name[0] in rootkeys) {
    name[0] = rootkeys[name[0]];
  }
  return name.join('\\');
}


function DataType(name, options){
  this.name = name;
  if (options) {
    options.parse && (this.parse = options.parse);
    options.format && (this.format = options.format);
  }
}

DataType.prototype = {
  constructor: DataType,
  parse: function parse(x){ return x },
  format: function format(x){ return util.inspect(x) }
};


function DataTypes(value){
  var type = 'REG_SZ';

  if (Buffer.isBuffer(value)) {
    type = 'REG_BINARY';
    value = value.toString('binary');

  } else if (Array.isArray(value)) {
    type = 'REG_MULTI_SZ';
    value = value.join('\0');

  } else if (typeof value === 'number' || typeof value === 'boolean' || value > 0) {

    if (value !== value || value === Infinity || value === -Infinity) {
      value = String(value);

    } else {
      type = 'REG_DWORD';
      value = +value;

    }

  } else if (typeof value === 'string' && ~value.indexOf('%')) {
    var expand = value.match(/%(.*)%/);

    if (expand) {
      expand = expand.slice(1).reduce(function(r,s){

        if (s in process.env) {
          value.replace('%'+s+'%', '^%'+s+'^%');
          r++;
        }

        return r;
      }, 0);

      if (expand) {
        type = 'REG_EXPAND_SZ';
      }
    }
  }

  if (~value.indexOf(' ')) {
    value = q(value);
  }

  return { type: type, value: value };
}



DataTypes.REG_SZ         = new DataType('REG_SZ');

DataTypes.REG_QWORD      = new DataType('REG_QWORD');

DataTypes.REG_MULTI_SZ   = new DataType('REG_MULTI_SZ', {

  parse: function(x){ return x.split('\0') }

});

DataTypes.REG_EXPAND_SZ  = new DataType('REG_EXPAND_SZ', {

  parse: function(x){ return expandPath(x) }

});

DataTypes.REG_DWORD      = new DataType('REG_DWORD', {

  parse: function(x){ return parseInt(x) },
  format: function(x){ return '0x'+(0x1000000|x).toString(16).slice(1) }

});

DataTypes.REG_NONE       = new DataType('REG_NONE', {

  parse: function(x){ return new Buffer(x, 'binary') }

});

DataTypes.REG_BINARY     = new DataType('REG_BINARY', {

  parse: function(x){ return new Buffer(x, 'binary') }

});



function Keyset(path){
  this.path = path;
  this.name = path.split('\\').pop();
}

Keyset.prototype = {
  constructor: Keyset,

  remove: function remove(){
    return SUCCESS(registry.delete(q(this.path), '/f'));
  },

  add: function add(name, value){
    if (value) {

      this[name] = new Entry(this, { name: name, value: value });

      var params = [
        q(this.path),
        '/v', q(name),
        '/t', this[name].type,
        '/d', this[name].raw,
        '/f'
      ];

    } else {

      this[name] = new Keyset(q(this.path+'\\'+name));
      var params = this[name].path;

    }

    var result = SUCCESS(registry.add(params));

    if (result !== true) {
      delete this[name];
    }

    return result;
  }
};

lazyProperty(Keyset.prototype, ['_path', '_name']);


function Entry(parent, input){
  if (Object.getPrototypeOf(this) !== Entry.prototype) {
    return new Entry(parent, input);
  }

  this.parent = parent;

  if (typeof input === 'object') {

    this.name  = input.name;
    this.value = input.value;

    if (input instanceof Entry) {

      this.type = input.type;
      this.raw  = input.raw;

    } else {

      var value = DataTypes(input.value);
      this.type = value.type;
      this.raw  = value.value;

    }

  } else {

    input = input.split('    ');
    this.name   = input[1];
    this.value  = input[2] in DataTypes ? DataTypes[input[2]].parse(input[3]) : input[3];
    this.type   = input[2];
    this.raw    = input[3];

  }
};

Entry.prototype = {
  constructor: Entry,

  remove: function remove(){
    return SUCCESS(registry.delete(q(this.parent.path), '/v', q(this.name), '/f'));
  },

  inspect: function inspect(){
    return (DataTypes[this.type] ? DataTypes[this.type].format(this.value) : '');
  },

  valueOf: function valueOf(){
    return this.value;
  }
};

lazyProperty(Entry.prototype, ['_parent', '_name', '_type', '_raw']);




function SUCCESS(ret){
  ret = Array.isArray(ret) ? ret[0] : ret;
  return ret === 'The operation completed successfully.' ? true : ret;
}