# Node Utilities for Windows

Right now it's just a few wrappers around some builtin console commands but FFI bindings are soon to come.

```javascript

`driveAlias('x', folder)`                alias a folder to `X:\`
`driveAlias('x')`                        remove aliased `X:\` folderdrive
`driveAlias()`                           list all aliased drives

`getFontNames()`                         list all the fonts in the registry by type

`associations('.js'. 'jscript')`         add or change extension to type map
`associations('.js')`                    retrieve type
`associations()`                         list all extension -> types

`fileTypes('jscript'. process.execPath)` add or change program that handles a filetype
                                         (example sets node as javascript's handler)
`fileTypes('jscript')`                   retrieve handler for the type
`fileTypes()`                            list all type -> handlers


`registry(key, options)`

`var v = registry('HKLM/Software/Microsoft')`
      //returns an object containing the keys and values
      //wrapped in objects allowing further fluent commands
      //such as `v.someKey.remove()` or `v.add('newKey', 'myValue')`


  options = { search    : 'query',
              recursive : false,
              case      : false,
              exact     : false,
              in        : 'keys' || 'values',
              type      : ('REG_SZ') || 'REG_MULTI_SZ' || 'REG_EXPAND_SZ' ||
                          'REG_QWORD' || 'REG_DWORD' || 'REG_BINARY' || 'REG_NONE' }


// The raw commands are provided as well but are annoying to use directly

`registry.query`
`registry.add`
`registry.delete`
`registry.copy`
`registry.save`
`registry.restore`
`registry.load`
`registry.unload`
`registry.compare`
`registry.export`
`registry.import`
`registry.flags`


`execSync('cmd' ...)` executes the command synchronously and returns the result,
                     flattening all params down to spaced delineation

`Command(name, splitLines)`  create a wrapped execSync calling function that executes
                             the command when called. Splits into an array of newlines
                             by default but can be disabled.
```