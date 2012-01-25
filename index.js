module.exports = {
	driveAlias: require('./driveAlias'),
	getFontNames: require('./fonts').getNames,
	associations: require('./associations').associations,
	fileTypes: require('./associations').fileTypes,
	registry: require('./registry'),
	Command: require('./Command').Command,
	execSync: require('./Command').execSync,
};