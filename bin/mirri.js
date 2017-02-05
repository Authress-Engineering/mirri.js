#!/usr/bin/env node

var commander = require('commander');
var path = require('path');
var Mirri = require('../index');
var aws = require('aws-sdk');

var version = require(path.join(__dirname, '../package.json')).version;
commander.version(version);

commander
	.command('rotate [profile]')
	.usage('rotate [options] [profile]')
	.option('-f, --force', 'Allow rotate to delete unused keys.', false)
	.description('Rotate AWS key, defaults to default')
	.action((profile, options) => {
		var selectedProfile = profile || 'default';
		aws.config.credentials = new aws.SharedIniFileCredentials({profile: selectedProfile});
		var iam = new aws.IAM();
		var mirri = new Mirri(iam);
		mirri.Rotate(selectedProfile, options.force)
		.then(() => console.log('AWS key rotation Complete.'));
	});
commander
	.command('cleanup [profile]')
	.description('Removes unused key from IAM user.')
	.action((profile) => {
		var selectedProfile = profile || 'default';
		aws.config.credentials = new aws.SharedIniFileCredentials({profile: selectedProfile});
		var iam = new aws.IAM();
		var mirri = new Mirri(iam);
		mirri.Cleanup(selectedProfile)
		.then(() => console.log('Cleanup Complete.'));
	});
commander
	.command('schedule [frequency] [profile]')
	.description('Schedule a crontab task to rotate keys.')
	.action((frequency, profile) => {
		var selectedProfile = profile || 'default';
		var specifiedFrequency = frequency || '@weekly';
		aws.config.credentials = new aws.SharedIniFileCredentials({profile: selectedProfile});
		var iam = new aws.IAM();
		var mirri = new Mirri(iam);
		mirri.Schedule(selectedProfile, specifiedFrequency)
		.then(() => console.log('Mirri scheduled.'));
	});

commander.on('*', () => {
	if(commander.args.join(' ') == 'tests/**/*.js') { return; }
	console.log('Unknown Command: ' + commander.args.join(' '));
	commander.help();
	process.exit(0);
});

commander.parse(process.argv[2] ? process.argv : process.argv.concat(['help']));