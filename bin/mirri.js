#!/usr/bin/env node

var commander = require('commander');
var path = require('path');
var Mirri = require('../index');
var aws = require('aws-sdk');

var version = require(path.join(__dirname, '../package.json')).version;
commander.version(version);

commander
	.command('rotate')
	.description('Rotate current AWS key.')
	.action(() => {
		console.log('Rotating AWS key');
		console.log('');
		var iam = new aws.IAM();
		var mirri = new Mirri(iam);
	});

commander.on('*', () => {
	if(commander.args.join(' ') == 'tests/**/*.js') { return; }
	displayHeader();
	console.log('Unknown Command: ' + commander.args.join(' '));
	commander.help();
	process.exit(0);
});

commander.parse(process.argv[2] ? process.argv : process.argv.concat(['rotate']));