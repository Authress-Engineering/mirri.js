const aws = require('aws-sdk');
const fs = require('fs-extra');
const crontab = require('crontab');
const _ = require('lodash');
const which = require('which');

function Mirri() {
  this.iamClient = new aws.IAM();
}
Mirri.prototype.Rotate = async function(profile) {
  try {
    await this.Cleanup(profile);
    const results = await this.iamClient.createAccessKey().promise();
    let currentAccessKey = aws.config.credentials.accessKeyId;
    let currentSecretKey = aws.config.credentials.secretAccessKey;
    let accessKeyId = results.AccessKey.AccessKeyId;
    let secretAccessKey = results.AccessKey.SecretAccessKey;

    // update the credentials file ~/.aws/credentials (linux) or %USERPROFILE%/.aws/credentials (windows)
    let credentialsFile = `${process.env.HOME || process.env.USERPROFILE}/.aws/credentials`;
    let accessKeyRE = new RegExp(_.escapeRegExp(currentAccessKey), 'g');
    let secretKeyRE = new RegExp(_.escapeRegExp(currentSecretKey), 'g');
		
    // eslint-disable-next-line no-unused-expressions
    await new Promise((resolve, reject) => { fs.readFile(credentialsFile, 'UTF-8', (error, data) => { error ? reject(error) : resolve(data);}); })
    .then(fileInfo => fileInfo.replace(accessKeyRE, accessKeyId).replace(secretKeyRE, secretAccessKey))
    .then(fileInfo => {
      return new Promise((resolve, reject) => { fs.outputFile(credentialsFile, fileInfo, error => error ? reject(error) : resolve(null)); });
    })
    .then(() => {
      return this.iamClient.updateAccessKey({ AccessKeyId: currentAccessKey, Status: 'Inactive' }).promise();
    });
  } catch (failure) {
    if (failure.code && failure.code.match('InvalidClientTokenId')) {
      console.error('The access key saved in your credentials file is not valid. If you just rotated your access key, please wait 10 seconds before rerunning this command again.');
      process.exit(1);
    }
    if (failure.code && failure.code.match('LimitExceeded')) {
      console.error('You already have the maximum number of keys for this user. Rotating requires a free slot, either run cleanup, or pass the force flag');
      process.exit(1);
    }
    console.error(failure);
    process.exit(1);
  }
};

Mirri.prototype.Cleanup = function() {
  // checks the current access key, deletes the other ones, and then rotates.
  return this.iamClient.listAccessKeys().promise()
  .then(data => {
    if (data.AccessKeyMetadata.length === 1) {
      return null;
    }
    let accessKeyId = data.AccessKeyMetadata.filter(key => key.AccessKeyId !== aws.config.credentials.accessKeyId)[0].AccessKeyId;
    return this.iamClient.deleteAccessKey({ AccessKeyId: accessKeyId }).promise();
  });
};

Mirri.prototype.Schedule = function(profile, frequency, useFullPath) {
  let mirrorResolvedPathPromise = new Promise((resolve, reject) => which('mirri', (error, resolvedPath) => error ? reject(error) : resolve(resolvedPath)));
  let cronProviderPomise = new Promise((resolve, reject) => crontab.load((error, cronProvider) => error ? reject(error) : resolve(cronProvider)));
  let nodeResolvedPathPromise = new Promise((resolve, reject) => which('node', (error, resolvedPath) => error ? reject(error) : resolve(resolvedPath)));
  return Promise.all([mirrorResolvedPathPromise, cronProviderPomise, nodeResolvedPathPromise])
  .then(results => {
    let mirriPath = useFullPath ? `${results[2]} ${results[0]}` : 'mirri';
    let cronProvider = results[1];
    let command = `${mirriPath} rotate --force ${profile}`;
    cronProvider.remove({ command: command });
    cronProvider.create(command, frequency, 'Managed by Mirri.js');
    return new Promise((resolve, reject) => cronProvider.save((error, result) => error ? reject(error) : resolve(result)));
  });
};
module.exports = Mirri;
