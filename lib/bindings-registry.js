var path = require('path');

var ffi = require('ffi');
var ref = require('ref');
var Struct = require('ref-struct');

var methods = require('./utility').methods;

var ptrSize = ref.sizeof.pointer;



exports.functions = {};
exports.callbacks = {};
exports.structs = {};



function Library(name){
  name += ffi.LIB_EXT;
  this.name = name;
  this.dll = new ffi.DynamicLibrary(name);
}

methods(Library.prototype, [
  function define(name, retType, argTypes){
    var ptr = this.dll.get(name);
    if (ptr.isNull())
      throw new Error(this.name + ' returned null for '+name);

    return this[name] = new ffi.ForeignFunction(ptr, retType, argTypes);
  }
]);



function Type(name, type){
  this.name = name;
  this.size = type.size;
  this.indirection = type.indirection;
  this.get = type.get;
  this.set = type.set;
  if (type.ffi_type)
    this.ffi_type = type.ffi_type
  Type.types[name] = this;
}

Type.types = {};

methods(Type.prototype, [
  function ref(){
    return new PointerType(this);
  },
  function deref(){
    if (this.indirection > 1)
      return Object.getPrototypeOf(this);
  },
  function inspect(){
    return '<'+this.name+'>';
  },
  function toString(){
    return '<'+this.name+'>';
  },
]);


function PointerType(name, type){
  if (!type && typeof name !== 'string') {
    type = name;
    name = type.name + '_ptr';
  }
  this.__proto__ = type;
  this.indirection++;
  this.name = name;
  this.size = ptrSize;
}

PointerType.prototype = Object.create(Type.prototype);
PointerType.prototype.constructor = PointerType;


var
 Void      = new Type('void',      ffi.types.void),
 int8      = new Type('int8',      ffi.types.int8),
 uint8     = new Type('uint8',     ffi.types.uint8),
 int16     = new Type('int16',     ffi.types.int16),
 uint16    = new Type('uint16',    ffi.types.uint16),
 int32     = new Type('int32',     ffi.types.int32),
 uint32    = new Type('uint32',    ffi.types.uint32),
 int64     = new Type('int64',     ffi.types.int64),
 uint64    = new Type('uint64',    ffi.types.uint64),
 float     = new Type('float',     ffi.types.float),
 double    = new Type('double',    ffi.types.double),
 byte      = new Type('byte',      ffi.types.byte),
 char      = new Type('char',      ffi.types.char),
 uchar     = new Type('uchar',     ffi.types.uchar),
 short     = new Type('short',     ffi.types.short),
 ushort    = new Type('ushort',    ffi.types.ushort),
 int       = new Type('int',       ffi.types.int),
 uint      = new Type('uint',      ffi.types.uint),
 long      = new Type('long',      ffi.types.long),
 ulong     = new Type('ulong',     ffi.types.ulong),
 longlong  = new Type('longlong',  ffi.types.longlong),
 ulonglong = new Type('ulonglong', ffi.types.ulonglong),
 size_t    = new Type('size_t',    ffi.types.size_t);






function LIBRARY(name){
  return LIBRARY.recent = new Library(name);
}

function CALLBACK(name, ret, params){
  var callback = exports.callbacks[name] = function(fn){
    return new ffi.Callback([ret, params], fn);
  }

  callback.returns = ret;
  callback.parameters = params;
  return new PointerType(name, Void);
}

function STRUCT(name, def){
 var struct = exports.structs[name] = new Struct(def);
 struct.name = name;
 return struct;
}

function FUNCTION(name, ret, params, library){
  var names = Object.keys(params);
  var args = names.map(function(name){
    return params[name];
  });
  var fn = exports.functions[name] = (library || LIBRARY.recent).define(name, ret, args);
  fn.parameters = params;
  fn.returns = ret;
  return fn;
}


function TYPEDEF(name, ffiType){
  return new Type(name, ffiType);
}

function PTR(type){
  if (type === 'void')
    type = Void;
  return type.ref ? type.ref() : ref.refType(type);
}







var
 ULONG = TYPEDEF('ULONG', ulong),
 DWORD = TYPEDEF('DWORD', ulong),
 BOOL = TYPEDEF('BOOL', int),
 LPBYTE = TYPEDEF('LPBYTE', PTR(uchar)),
 LPDWORD = TYPEDEF('LPDWORD', PTR(ulong)),
 LPVOID = TYPEDEF('LPVOID', PTR('void')),
 LPCVOID = TYPEDEF('LPCVOID', PTR('void')),
 DWORD_PTR = TYPEDEF('DWORD_PTR', ulong),
 PVOID = TYPEDEF('PVOID', PTR('void')),
 LONG = TYPEDEF('LONG', long),
 LPWSTR = TYPEDEF('LPWSTR', PTR(ushort)),
 LPCWSTR = TYPEDEF('LPCWSTR', PTR(ushort)),
 LPSTR = TYPEDEF('LPSTR', PTR(int8)),
 LPCSTR = TYPEDEF('LPCSTR', PTR(int8)),
 PLONG = TYPEDEF('PLONG', PTR(long)),
 HANDLE = TYPEDEF('HANDLE', PTR('void')),
 HKEY = TYPEDEF('HKEY', HANDLE),
 PHKEY = TYPEDEF('HKEY', PTR(HKEY)),
 PSECURITY_DESCRIPTOR = TYPEDEF('PSECURITY_DESCRIPTOR', PTR('void')),
 SECURITY_INFORMATION = TYPEDEF('SECURITY_INFORMATION', ulong),
 LPSECURITY_INFORMATION = TYPEDEF('SECURITY_INFORMATION', ulong),
 REGSAM = TYPEDEF('REGSAM', ulong),
 LSTATUS = TYPEDEF('LSTATUS', long);




var val_context = STRUCT('val_context', {
 valuelen: int,
 value_context: LPVOID,
 val_buff_ptr: LPVOID
});


var PQUERYHANDLER = CALLBACK('PQUERYHANDLER', ulong, [
 PTR('void'),
 PTR(val_context),
 ulong,
 PTR('void'),
 PTR(ulong),
 ulong
]);


var PVALUE = STRUCT('PVALUE', {
 pv_valuename: LPSTR,
 pv_valuelen: int,
 pv_value_context: LPVOID,
 pv_type: DWORD
});

var PVALUEW = STRUCT('PVALUEW', {
 pv_valuename: LPWSTR,
 pv_valuelen: int,
 pv_value_context: LPVOID,
 pv_type: DWORD
});

var REG_PROVIDER = STRUCT('REG_PROVIDER', {
 pi_R0_1val: PQUERYHANDLER,
 pi_R0_allvals: PQUERYHANDLER,
 pi_R3_1val: PQUERYHANDLER,
 pi_R3_allvals: PQUERYHANDLER,
 pi_flags: DWORD,
 pi_key_context: LPVOID
});

var VALENT = STRUCT('VALENT', {
 ve_valuename: LPSTR,
 ve_valuelen: DWORD,
 ve_valueptr: DWORD_PTR,
 ve_type: DWORD
});

var VALENTW = STRUCT('VALENTW', {
 ve_valuename: LPWSTR,
 ve_valuelen: DWORD,
 ve_valueptr: DWORD_PTR,
 ve_type: DWORD
});


var SECURITY_ATTRIBUTES = STRUCT('SECURITY_ATTRIBUTES', {
 nLength: DWORD,
 lpSecurityDescriptor: LPVOID,
 bInheritHandle: BOOL
});

var FILETIME = STRUCT('FILETIME', {
 dwLowDateTime: DWORD,
 dwHighDateTime: DWORD
});


var
 LPSECURITY_ATTRIBUTES = TYPEDEF('LPSECURITY_ATTRIBUTES', PTR(SECURITY_ATTRIBUTES)),
 PFILETIME = TYPEDEF('PFILETIME', PTR(FILETIME)),
 PVALENTW = TYPEDEF('PVALENTW', PTR(VALENTW));



var Advapi32 = LIBRARY('Advapi32');

FUNCTION('RegCloseKey', LSTATUS, { hKey: HKEY });
FUNCTION('RegOverridePredefKey', LSTATUS, { hKey: HKEY, hNewHKey: HKEY });
FUNCTION('RegOpenUserClassesRoot', LSTATUS, { hToken: HANDLE, dwOptions: DWORD, samDesired: REGSAM, phkResult: PHKEY });
FUNCTION('RegOpenCurrentUser', LSTATUS, { samDesired: REGSAM, phkResult: PHKEY });
FUNCTION('RegDisablePredefinedCache', LSTATUS, {  });
FUNCTION('RegDisablePredefinedCacheEx', LSTATUS, {  });
FUNCTION('RegConnectRegistryA', LSTATUS, { lpMachineName: LPCSTR, hKey: HKEY, phkResult: PHKEY });
FUNCTION('RegConnectRegistryW', LSTATUS, { lpMachineName: LPCWSTR, hKey: HKEY, phkResult: PHKEY });
FUNCTION('RegConnectRegistryExA', LSTATUS, { lpMachineName: LPCSTR, hKey: HKEY, Flags: ULONG, phkResult: PHKEY });
FUNCTION('RegConnectRegistryExW', LSTATUS, { lpMachineName: LPCWSTR, hKey: HKEY, Flags: ULONG, phkResult: PHKEY });
FUNCTION('RegCreateKeyA', LSTATUS, { hKey: HKEY, lpSubKey: LPCSTR, phkResult: PHKEY });
FUNCTION('RegCreateKeyW', LSTATUS, { hKey: HKEY, lpSubKey: LPCWSTR, phkResult: PHKEY });
FUNCTION('RegCreateKeyExA', LSTATUS, { hKey: HKEY, lpSubKey: LPCSTR, Reserved: DWORD, lpClass: LPSTR, dwOptions: DWORD, samDesired: REGSAM, lpSecurityAttributes: LPSECURITY_ATTRIBUTES, phkResult: PHKEY, lpdwDisposition: LPDWORD });
FUNCTION('RegCreateKeyExW', LSTATUS, { hKey: HKEY, lpSubKey: LPCWSTR, Reserved: DWORD, lpClass: LPWSTR, dwOptions: DWORD, samDesired: REGSAM, lpSecurityAttributes: LPSECURITY_ATTRIBUTES, phkResult: PHKEY, lpdwDisposition: LPDWORD });
FUNCTION('RegCreateKeyTransactedA', LSTATUS, { hKey: HKEY, lpSubKey: LPCSTR, Reserved: DWORD, lpClass: LPSTR, dwOptions: DWORD, samDesired: REGSAM, lpSecurityAttributes: LPSECURITY_ATTRIBUTES, phkResult: PHKEY, lpdwDisposition: LPDWORD, hTransaction: HANDLE, pExtendedParemeter: PVOID });
FUNCTION('RegCreateKeyTransactedW', LSTATUS, { hKey: HKEY, lpSubKey: LPCWSTR, Reserved: DWORD, lpClass: LPWSTR, dwOptions: DWORD, samDesired: REGSAM, lpSecurityAttributes: LPSECURITY_ATTRIBUTES, phkResult: PHKEY, lpdwDisposition: LPDWORD, hTransaction: HANDLE, pExtendedParemeter: PVOID });
FUNCTION('RegDeleteKeyA', LSTATUS, { hKey: HKEY, lpSubKey: LPCSTR });
FUNCTION('RegDeleteKeyW', LSTATUS, { hKey: HKEY, lpSubKey: LPCWSTR });
FUNCTION('RegDeleteKeyExA', LSTATUS, { hKey: HKEY, lpSubKey: LPCSTR, samDesired: REGSAM, Reserved: DWORD });
FUNCTION('RegDeleteKeyExW', LSTATUS, { hKey: HKEY, lpSubKey: LPCWSTR, samDesired: REGSAM, Reserved: DWORD });
FUNCTION('RegDeleteKeyTransactedA', LSTATUS, { hKey: HKEY, lpSubKey: LPCSTR, samDesired: REGSAM, Reserved: DWORD, hTransaction: HANDLE, pExtendedParameter: PVOID });
FUNCTION('RegDeleteKeyTransactedW', LSTATUS, { hKey: HKEY, lpSubKey: LPCWSTR, samDesired: REGSAM, Reserved: DWORD, hTransaction: HANDLE, pExtendedParameter: PVOID });
FUNCTION('RegDisableReflectionKey', LONG, { hBase: HKEY });
FUNCTION('RegEnableReflectionKey', LONG, { hBase: HKEY });
FUNCTION('RegQueryReflectionKey', LONG, { hBase: HKEY, bIsReflectionDisabled: PTR(int) });
FUNCTION('RegDeleteValueA', LSTATUS, { hKey: HKEY, lpValueName: LPCSTR });
FUNCTION('RegDeleteValueW', LSTATUS, { hKey: HKEY, lpValueName: LPCWSTR });
FUNCTION('RegEnumKeyA', LSTATUS, { hKey: HKEY, dwIndex: DWORD, lpName: LPSTR, cchName: DWORD });
FUNCTION('RegEnumKeyW', LSTATUS, { hKey: HKEY, dwIndex: DWORD, lpName: LPWSTR, cchName: DWORD });
FUNCTION('RegEnumKeyExA', LSTATUS, { hKey: HKEY, dwIndex: DWORD, lpName: LPSTR, lpcchName: LPDWORD, lpReserved: LPDWORD, lpClass: LPSTR, lpcchClass: LPDWORD, lpftLastWriteTime: PFILETIME });
FUNCTION('RegEnumKeyExW', LSTATUS, { hKey: HKEY, dwIndex: DWORD, lpName: LPWSTR, lpcchName: LPDWORD, lpReserved: LPDWORD, lpClass: LPWSTR, lpcchClass: LPDWORD, lpftLastWriteTime: PFILETIME });
FUNCTION('RegEnumValueA', LSTATUS, { hKey: HKEY, dwIndex: DWORD, lpValueName: LPSTR, lpcchValueName: LPDWORD, lpReserved: LPDWORD, lpType: LPDWORD, lpData: LPBYTE, lpcbData: LPDWORD });
FUNCTION('RegEnumValueW', LSTATUS, { hKey: HKEY, dwIndex: DWORD, lpValueName: LPWSTR, lpcchValueName: LPDWORD, lpReserved: LPDWORD, lpType: LPDWORD, lpData: LPBYTE, lpcbData: LPDWORD });
FUNCTION('RegFlushKey', LSTATUS, { hKey: HKEY });
FUNCTION('RegGetKeySecurity', LSTATUS, { hKey: HKEY, SecurityInformation: SECURITY_INFORMATION, pSecurityDescriptor: PSECURITY_DESCRIPTOR, lpcbSecurityDescriptor: LPDWORD });
FUNCTION('RegLoadKeyA', LSTATUS, { hKey: HKEY, lpSubKey: LPCSTR, lpFile: LPCSTR });
FUNCTION('RegLoadKeyW', LSTATUS, { hKey: HKEY, lpSubKey: LPCWSTR, lpFile: LPCWSTR });
FUNCTION('RegNotifyChangeKeyValue', LSTATUS, { hKey: HKEY, bWatchSubtree: BOOL, dwNotifyFilter: DWORD, hEvent: HANDLE, fAsynchronous: BOOL });
FUNCTION('RegOpenKeyA', LSTATUS, { hKey: HKEY, lpSubKey: LPCSTR, phkResult: PHKEY });
FUNCTION('RegOpenKeyW', LSTATUS, { hKey: HKEY, lpSubKey: LPCWSTR, phkResult: PHKEY });
FUNCTION('RegOpenKeyExA', LSTATUS, { hKey: HKEY, lpSubKey: LPCSTR, ulOptions: DWORD, samDesired: REGSAM, phkResult: PHKEY });
FUNCTION('RegOpenKeyExW', LSTATUS, { hKey: HKEY, lpSubKey: LPCWSTR, ulOptions: DWORD, samDesired: REGSAM, phkResult: PHKEY });
FUNCTION('RegOpenKeyTransactedA', LSTATUS, { hKey: HKEY, lpSubKey: LPCSTR, ulOptions: DWORD, samDesired: REGSAM, phkResult: PHKEY, hTransaction: HANDLE, pExtendedParemeter: PVOID });
FUNCTION('RegOpenKeyTransactedW', LSTATUS, { hKey: HKEY, lpSubKey: LPCWSTR, ulOptions: DWORD, samDesired: REGSAM, phkResult: PHKEY, hTransaction: HANDLE, pExtendedParemeter: PVOID });
FUNCTION('RegQueryInfoKeyA', LSTATUS, { hKey: HKEY, lpClass: LPSTR, lpcchClass: LPDWORD, lpReserved: LPDWORD, lpcSubKeys: LPDWORD, lpcbMaxSubKeyLen: LPDWORD, lpcbMaxClassLen: LPDWORD, lpcValues: LPDWORD, lpcbMaxValueNameLen: LPDWORD, lpcbMaxValueLen: LPDWORD, lpcbSecurityDescriptor: LPDWORD, lpftLastWriteTime: PFILETIME });
FUNCTION('RegQueryInfoKeyW', LSTATUS, { hKey: HKEY, lpClass: LPWSTR, lpcchClass: LPDWORD, lpReserved: LPDWORD, lpcSubKeys: LPDWORD, lpcbMaxSubKeyLen: LPDWORD, lpcbMaxClassLen: LPDWORD, lpcValues: LPDWORD, lpcbMaxValueNameLen: LPDWORD, lpcbMaxValueLen: LPDWORD, lpcbSecurityDescriptor: LPDWORD, lpftLastWriteTime: PFILETIME });
FUNCTION('RegQueryValueA', LSTATUS, { hKey: HKEY, lpSubKey: LPCSTR, lpData: LPSTR, lpcbData: PLONG });
FUNCTION('RegQueryValueW', LSTATUS, { hKey: HKEY, lpSubKey: LPCWSTR, lpData: LPWSTR, lpcbData: PLONG });
FUNCTION('RegQueryMultipleValuesW', LSTATUS, { hKey: HKEY, val_list: PVALENTW, num_vals: DWORD, lpValueBuf: LPWSTR, ldwTotsize: LPDWORD });
FUNCTION('RegQueryValueExA', LSTATUS, { hKey: HKEY, lpValueName: LPCSTR, lpReserved: LPDWORD, lpType: LPDWORD, lpData: LPBYTE, lpcbData: LPDWORD });
FUNCTION('RegQueryValueExW', LSTATUS, { hKey: HKEY, lpValueName: LPCWSTR, lpReserved: LPDWORD, lpType: LPDWORD, lpData: LPBYTE, lpcbData: LPDWORD });
FUNCTION('RegReplaceKeyA', LSTATUS, { hKey: HKEY, lpSubKey: LPCSTR, lpNewFile: LPCSTR, lpOldFile: LPCSTR });
FUNCTION('RegReplaceKeyW', LSTATUS, { hKey: HKEY, lpSubKey: LPCWSTR, lpNewFile: LPCWSTR, lpOldFile: LPCWSTR });
FUNCTION('RegRestoreKeyA', LSTATUS, { hKey: HKEY, lpFile: LPCSTR, dwFlags: DWORD });
FUNCTION('RegRestoreKeyW', LSTATUS, { hKey: HKEY, lpFile: LPCWSTR, dwFlags: DWORD });
FUNCTION('RegRenameKey', LSTATUS, { hKey: HKEY, lpSubKeyName: LPCWSTR, lpNewKeyName: LPCWSTR });
FUNCTION('RegSaveKeyA', LSTATUS, { hKey: HKEY, lpFile: LPCSTR, lpSecurityAttributes: LPSECURITY_ATTRIBUTES });
FUNCTION('RegSaveKeyW', LSTATUS, { hKey: HKEY, lpFile: LPCWSTR, lpSecurityAttributes: LPSECURITY_ATTRIBUTES });
FUNCTION('RegSetKeySecurity', LSTATUS, { hKey: HKEY, SecurityInformation: SECURITY_INFORMATION, pSecurityDescriptor: PSECURITY_DESCRIPTOR });
FUNCTION('RegSetValueA', LSTATUS, { hKey: HKEY, lpSubKey: LPCSTR, dwType: DWORD, lpData: LPCSTR, cbData: DWORD });
FUNCTION('RegSetValueW', LSTATUS, { hKey: HKEY, lpSubKey: LPCWSTR, dwType: DWORD, lpData: LPCWSTR, cbData: DWORD });
FUNCTION('RegSetValueExA', LSTATUS, { hKey: HKEY, lpValueName: LPCSTR, Reserved: DWORD, dwType: DWORD, lpData: PTR(uchar), cbData: DWORD });
FUNCTION('RegSetValueExW', LSTATUS, { hKey: HKEY, lpValueName: LPCWSTR, Reserved: DWORD, dwType: DWORD, lpData: PTR(uchar), cbData: DWORD });
FUNCTION('RegUnLoadKeyA', LSTATUS, { hKey: HKEY, lpSubKey: LPCSTR });
FUNCTION('RegUnLoadKeyW', LSTATUS, { hKey: HKEY, lpSubKey: LPCWSTR });
FUNCTION('RegDeleteKeyValueA', LSTATUS, { hKey: HKEY, lpSubKey: LPCSTR, lpValueName: LPCSTR });
FUNCTION('RegDeleteKeyValueW', LSTATUS, { hKey: HKEY, lpSubKey: LPCWSTR, lpValueName: LPCWSTR });
FUNCTION('RegSetKeyValueA', LSTATUS, { hKey: HKEY, lpSubKey: LPCSTR, lpValueName: LPCSTR, dwType: DWORD, lpData: LPCVOID, cbData: DWORD });
FUNCTION('RegSetKeyValueW', LSTATUS, { hKey: HKEY, lpSubKey: LPCWSTR, lpValueName: LPCWSTR, dwType: DWORD, lpData: LPCVOID, cbData: DWORD });
FUNCTION('RegDeleteTreeA', LSTATUS, { hKey: HKEY, lpSubKey: LPCSTR });
FUNCTION('RegDeleteTreeW', LSTATUS, { hKey: HKEY, lpSubKey: LPCWSTR });
FUNCTION('RegCopyTreeA', LSTATUS, { hKeySrc: HKEY, lpSubKey: LPCSTR, hKeyDest: HKEY });
FUNCTION('RegCopyTreeW', LSTATUS, { hKeySrc: HKEY, lpSubKey: LPCWSTR, hKeyDest: HKEY });
FUNCTION('RegGetValueA', LSTATUS, { hkey: HKEY, lpSubKey: LPCSTR, lpValue: LPCSTR, dwFlags: DWORD, pdwType: LPDWORD, pvData: PVOID, pcbData: LPDWORD });
FUNCTION('RegGetValueW', LSTATUS, { hkey: HKEY, lpSubKey: LPCWSTR, lpValue: LPCWSTR, dwFlags: DWORD, pdwType: LPDWORD, pvData: PVOID, pcbData: LPDWORD });
FUNCTION('RegLoadMUIStringA', LSTATUS, { hKey: HKEY, pszValue: LPCSTR, pszOutBuf: LPSTR, cbOutBuf: DWORD, pcbData: LPDWORD, Flags: DWORD, pszDirectory: LPCSTR });
FUNCTION('RegLoadMUIStringW', LSTATUS, { hKey: HKEY, pszValue: LPCWSTR, pszOutBuf: LPWSTR, cbOutBuf: DWORD, pcbData: LPDWORD, Flags: DWORD, pszDirectory: LPCWSTR });
FUNCTION('RegLoadAppKeyA', LSTATUS, { lpFile: LPCSTR, phkResult: PHKEY, samDesired: REGSAM, dwOptions: DWORD, Reserved: DWORD });
FUNCTION('RegLoadAppKeyW', LSTATUS, { lpFile: LPCWSTR, phkResult: PHKEY, samDesired: REGSAM, dwOptions: DWORD, Reserved: DWORD });
FUNCTION('InitiateSystemShutdownA', BOOL, { lpMachineName: LPSTR, lpMessage: LPSTR, dwTimeout: DWORD, bForceAppsClosed: BOOL, bRebootAfterShutdown: BOOL });
FUNCTION('InitiateSystemShutdownW', BOOL, { lpMachineName: LPWSTR, lpMessage: LPWSTR, dwTimeout: DWORD, bForceAppsClosed: BOOL, bRebootAfterShutdown: BOOL });
FUNCTION('AbortSystemShutdownA', BOOL, { lpMachineName: LPSTR });
FUNCTION('AbortSystemShutdownW', BOOL, { lpMachineName: LPWSTR });
FUNCTION('InitiateSystemShutdownExA', BOOL, { lpMachineName: LPSTR, lpMessage: LPSTR, dwTimeout: DWORD, bForceAppsClosed: BOOL, bRebootAfterShutdown: BOOL, dwReason: DWORD });
FUNCTION('InitiateSystemShutdownExW', BOOL, { lpMachineName: LPWSTR, lpMessage: LPWSTR, dwTimeout: DWORD, bForceAppsClosed: BOOL, bRebootAfterShutdown: BOOL, dwReason: DWORD });
FUNCTION('InitiateShutdownA', DWORD, { lpMachineName: LPSTR, lpMessage: LPSTR, dwGracePeriod: DWORD, dwShutdownFlags: DWORD, dwReason: DWORD });
FUNCTION('InitiateShutdownW', DWORD, { lpMachineName: LPWSTR, lpMessage: LPWSTR, dwGracePeriod: DWORD, dwShutdownFlags: DWORD, dwReason: DWORD });
FUNCTION('RegSaveKeyExA', LSTATUS, { hKey: HKEY, lpFile: LPCSTR, lpSecurityAttributes: LPSECURITY_ATTRIBUTES, Flags: DWORD });
FUNCTION('RegSaveKeyExW', LSTATUS, { hKey: HKEY, lpFile: LPCWSTR, lpSecurityAttributes: LPSECURITY_ATTRIBUTES, Flags: DWORD });
