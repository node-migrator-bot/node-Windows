module.exports = {
  driveAlias:   require('./lib/driveAlias'),
  runnable:     require('./lib/runnable'),
  getFontNames: require('./lib/fonts').getNames,
  associations: require('./lib/associations').associations,
  fileTypes:    require('./lib/associations').fileTypes,
  registry:     require('./lib/registry'),
  windowsSDK:   require('./lib/winsdk.js'),
  Command:      require('./lib/Command').Command,
  execSync:     require('./lib/Command').execSync,
};