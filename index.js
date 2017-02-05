'use strict';

var aws = require('aws-sdk');

function Mirri(iamClient) {
	this.iamClient = iamClient;
}
Mirri.prototype.rotate = function(profileName) {
	//rotate profile
	
};
module.exports = Mirri;