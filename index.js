'use strict';

const aws = require('aws-sdk');
const fs = require('fs-extra');
const path = require('path');
const crontab = require('crontab');
const _ = require('lodash');
const which = require('which');

function Mirri(iamClient) {
	this.iamClient = iamClient;
}
Mirri.prototype.Rotate = function(profile, force) {
	let p = Promise.resolve();
	if (force) {
		p = p.then(() => this.Cleanup(profile));
	}
	return p.then(() => this.iamClient.createAccessKey().promise())
	.then(results => {
		var currentAccessKey = aws.config.credentials.accessKeyId;
		var currentSecretKey = aws.config.credentials.secretAccessKey;
		let accessKeyId = results.AccessKey.AccessKeyId;
		let secretAccessKey = results.AccessKey.SecretAccessKey;

		// update the credentials file ~/.aws/credentials (linux) or %USERPROFILE%/.aws/credentials (windows)
		let credentialsFile = `${process.env.HOME || process.env.USERPROFILE}/.aws/credentials`;
		var accessKeyRE = new RegExp(_.escapeRegExp(currentAccessKey), 'g');
		var secretKeyRE = new RegExp(_.escapeRegExp(currentSecretKey), 'g');
		return new Promise((s, f) => { fs.readFile(credentialsFile, 'UTF-8', (error, data) => { error ? f(error) : s(data)}); })
		.then(fileInfo => fileInfo.replace(accessKeyRE, accessKeyId).replace(secretKeyRE, secretAccessKey))
		.then(fileInfo => {
			return new Promise((s, f) => { fs.outputFile(credentialsFile, fileInfo, (error) => error ? f(error) : s(null)); });
		})
		.then(() => {
			return this.iamClient.updateAccessKey({AccessKeyId: currentAccessKey, Status: 'Inactive'}).promise();
		});
	})
	.catch(failure => {
		if(failure.code && failure.code.match('InvalidClientTokenId')) {
			console.log('The access key saved in your credentials file is not valid. If you just rotated your access key, please wait 10 seconds before rerunning this command again.');
			return Promise.reject('InvalidAccessKey');
		}
		if(failure.code && failure.code.match('LimitExceeded')) {
			console.log('You already have the maximum number of keys for this user. Rotating requires a free slot, either run cleanup, or pass the force flag');
			return Promise.reject('LimitExceeded');
		}
		console.log(failure);
		return Promise.reject(failure);
	});
};

Mirri.prototype.Cleanup = function(profile) {
	// checks the current access key, deletes the other ones, and then rotates.
	return this.iamClient.listAccessKeys().promise()
	.then(data => {
		if(data.AccessKeyMetadata.length === 1) {
			return null;
		}
		let accessKeyId = data.AccessKeyMetadata.filter(key => key.AccessKeyId !== aws.config.credentials.accessKeyId)[0].AccessKeyId;
		return this.iamClient.deleteAccessKey({AccessKeyId: accessKeyId}).promise();
	});
};

Mirri.prototype.Schedule = function(profile, frequency, useFullPath) {
	let mirrorResolvedPathPromise = new Promise((s, f) => which('mirri', (error, resolvedPath) => error ? f(error) : s(resolvedPath)));
	let cronProviderPomise = new Promise((s, f) => crontab.load((error, cronProvider) => error ? f(error) : s(cronProvider)));
	let nodeResolvedPathPromise = new Promise((s, f) => which('node', (error, resolvedPath) => error ? f(error) : s(resolvedPath)));
	return Promise.all([mirrorResolvedPathPromise, cronProviderPomise, nodeResolvedPathPromise])
	.then(results => {
		let mirriPath = useFullPath ? `${results[2]} ${results[0]}` : 'mirri';
		let cronProvider = results[1];
		let command = `${mirriPath} rotate --force ${profile}`;
		cronProvider.remove({command: command});
		cronProvider.create(command, frequency, 'Managed by Mirri.js');
		return new Promise((s, f) => cronProvider.save((error, result) => error ? f(error) : s(result)));
	});
};
module.exports = Mirri;