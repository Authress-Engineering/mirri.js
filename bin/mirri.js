#!/usr/bin/env node

let commander = require('commander');
let path = require('path');
let Mirri = require('../index');
let aws = require('aws-sdk');

let version = require(path.join(__dirname, '../package.json')).version;
commander.version(version);

commander
.command('rotate [profile]')
.usage('rotate [profile]')
.description('Rotate AWS key, defaults to default')
.action(async profile => {
  let selectedProfile = profile || 'default';
  aws.config.credentials = new aws.SharedIniFileCredentials({ profile: selectedProfile });
  let mirri = new Mirri();
  await mirri.Rotate(selectedProfile);
  console.log('AWS key rotation Complete.');
});
commander
.command('cleanup [profile]')
.usage('cleanup [profile]')
.description('Removes unused key from IAM user.')
.action(async profile => {
  let selectedProfile = profile || 'default';
  aws.config.credentials = new aws.SharedIniFileCredentials({ profile: selectedProfile });
  let mirri = new Mirri();
  await mirri.Cleanup(selectedProfile);
  console.log('Cleanup Complete.');
});
commander
.command('schedule [profile] [frequency]')
.usage('schedule [options] [profile] [frequency]')
.option('-p, --path', 'Register with the full path of mirri.', false)
.description('Schedule a crontab task to rotate keys.')
.action(async (profile, frequency, options) => {
  let selectedProfile = profile || 'default';
  let specifiedFrequency = frequency || '@weekly';
  aws.config.credentials = new aws.SharedIniFileCredentials({ profile: selectedProfile });
  let mirri = new Mirri();
  await mirri.Schedule(selectedProfile, specifiedFrequency, options.path);
  console.log('Mirri scheduled.');
});

commander.on('*', () => {
  if (commander.args.join(' ') == 'tests/**/*.js') { return; }
  console.log(`Unknown Command: ${commander.args.join(' ')}`);
  commander.help();
  process.exit(0);
});

commander.parse(process.argv[2] ? process.argv : process.argv.concat(['help']));
