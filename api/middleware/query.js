'use strict';
/*
* Copyright IBM Corp All Rights Reserved
*
* SPDX-License-Identifier: Apache-2.0
*/
/*
 * Chaincode query
 */

var Fabric_Client = require('fabric-client');
var path = require('path');
var util = require('util');
var os = require('os');
// var jsonConverter = require('json-style-converter/es5')
// var CouchDB_KVS = require('fabric-client/lib/impl/CouchDBKeyValueStore');
//
var fabric_client = new Fabric_Client();

// setup the fabric network
var channel = fabric_client.newChannel('mychannel');
var peer = fabric_client.newPeer('grpc://localhost:7051');
channel.addPeer(peer);

var member_user = null;
var store_path = "/home/ubuntu/fabric-samples/fabcar/hfc-key-store";
console.log('Store path:'+store_path);
var tx_id = null;


// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
function queryChaincode(funcName, args) {
	return Fabric_Client.newDefaultKeyValueStore({ path: store_path
	}).then((state_store) => {
		// assign the store to the fabric client
		fabric_client.setStateStore(state_store);
		var crypto_suite = Fabric_Client.newCryptoSuite();
		// use the same location for the state store (where the users' certificate are kept)
		// and the crypto store (where the users' keys are kept)
		var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
		crypto_suite.setCryptoKeyStore(crypto_store);
		fabric_client.setCryptoSuite(crypto_suite);

		// get the enrolled user from persistence, this user will sign all requests
		return fabric_client.getUserContext('admin', true);
	}).then((user_from_store) => {
		if (user_from_store && user_from_store.isEnrolled()) {
			console.log(util.format('admin is querying the blockchain'));
			member_user = user_from_store;
		} else {
			throw new Error(util.format('Failed to get data about admin'));
		}

		const request = {
			//targets : --- letting this default to the peers assigned to the channel
			chaincodeId: 'marbles',
			fcn: funcName,
			args: args
		};

		// send the query proposal to the peer
		return channel.queryByChaincode(request);
	}).then((query_responses) => {
		console.log("Query has completed, checking results");
		// query_responses could have more than one  results if there multiple peers were used as targets
		if (query_responses && query_responses.length == 1) {
			if (query_responses[0] instanceof Error) {
				console.error("error from query = ", query_responses[0]);
			} else {
				console.log("Response is ", query_responses[0].toString());
			}
		} else {
			console.log("No payloads were returned from query");
		}
		return query_responses[0].toString();
	}).catch((err) => {
		console.log('Failed to send query due to error: ' + err);
	});
};

module.exports.queryChaincode = queryChaincode;