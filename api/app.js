'use strict';

var log4js = require('log4js');
var logger = log4js.getLogger('NID enrollment');
var express = require('express');
var bodyParser = require('body-parser');
var http = require('http');
var util = require('util');
var app = express();
// var expressJWT = require('express-jwt');
// var jwt = require('jsonwebtoken');
// var bearerToken = require('express-bearer-token');
var cors = require('cors');
var path = require('path');
const uuidv4 = require('uuid/v4');

var invokeCC = require('./middleware/invoke.js');
var queryCC = require('./middleware/query.js');

var host = process.env.HOST || 'localhost' ;
var port = process.env.PORT || 6000;

app.options('*', cors());
app.use(cors());

//support parsing of application/json type post data
app.use(bodyParser.json());

//support parsing of application/x-www-form-urlencoded post data
app.use(bodyParser.urlencoded({
	extended: false
}));

// //Set secret variable
// app.set('secret', 'nidenrollmentdryicesolutions');
// app.use(expressJWT({
// 	secret: 'nidenrollmentdryicesolutions'
// }).unless({
//     path: ['/login'],
 
// }));
// app.use(bearerToken());

// app.use(function(req, res, next) {
// 	logger.debug(' ------>>>>>> new request for %s',req.originalUrl);
// 	if (req.originalUrl.indexOf('/login') >= 0) {
// 		return next();
// 	}

// 	var token = req.token;
// 	jwt.verify(token, app.get('secret'), function(err, decoded) {
// 		if (err) {
// 			res.send({
// 				success: false,
// 				message: 'Failed to authenticate token. Make sure to include the ' +
// 					'token returned from /login call in the authorization header ' +
// 					' as a Bearer token'
// 			});
// 			return;
// 		} else {
// 			// add the decoded user name and org name to the request object
// 			// for the downstream code to use
// 			req.username = decoded.username;
// 			logger.debug(util.format('Decoded from JWT token: username - %s', decoded.username));
// 			return next();
// 		}
// 	});
// });


var server = http.createServer(app).listen(port, function() {});
console.log('****************** SERVER STARTED ************************');
console.log('***************  http://%s:%s  ******************',host,port);
server.timeout = 24000;

function getErrorMessage(field) {
	var response = {
		success: false,
		message: field + ' field is missing or Invalid in the request'
	};
	return response;
}

app.post('/api/create-marble', async function(req,res) {
   
    var args = ['m' + leftPad(Date.now() + randStr(5), 19),req.body.color,req.body.size,req.body.owner_id,"United Marbles"];
    if (!args) {
		res.status(400).json(getErrorMessage('\'args\''));
		return;
    }
  
    invokeCC.invokeChaincode('init_marble',args).then(() => {
        res.json({success: true, message: args[0]}); 
    }, (err) => {
        res.status(500).json({success: false, message: err.message});
    });
});

app.post('/api/create-owner', async function(req,res) {   
    var args = ['o' + leftPad(Date.now() + randStr(5), 19),req.body.marble_owner,"United Marbles"];
    if (!args) {
		res.status(400).json(getErrorMessage('\'args\''));
		return;
    }
  
    invokeCC.invokeChaincode('init_owner',args).then(() => {
        res.json({success: true, message: args[0] }); 
    }, (err) => {
        res.status(500).json({success: false, message: err.message});
    });
});

app.post('/api/transfer-marble', async function(req,res) {   
    var args = [req.body.marble_id,req.body.owner_id,"United Marbles"];  
    if (!args) {
		res.status(400).json(getErrorMessage('\'args\''));
		return;
    }
 
    invokeCC.invokeChaincode('set_owner',args).then(() => {
        res.json({success: true, message: args}); 
    }, (err) => {
        res.status(500).json({success: false, message: err.message});
    });
});

app.post('/api/delete-marble', async function(req,res) {   
    var args = [req.body.marble_id,"United Marbles"];  
    if (!args) {
		res.status(400).json(getErrorMessage('\'args\''));
		return;
    }  
    
    invokeCC.invokeChaincode('delete_marble',args).then(() => {
        res.json({success: true, message: args}); 
    }, (err) => {
        res.status(500).json({success: false, message: err.message});
    });
});

app.post('/api/disable-owner', async function(req,res) {   
    var args = [req.body.owner_id,"United Marbles"];  
    if (!args) {
		res.status(400).json(getErrorMessage('\'args\''));
		return;
    }  
    
    invokeCC.invokeChaincode('disable_owner',args).then(() => {
        res.json({success: true, message: args}); 
    }, (err) => {
        res.status(500).json({success: false, message: err.message});
    });
});



app.get('/api/read-all', async function(req,res){
    queryCC.queryChaincode('read_everything',['_ownerindex']).then((result) => {
       
        res.json({success:true, message: JSON.parse(result)})
    }, (err) => {
        res.status(500).json({success:false,message:err.message});
    });
});



function leftPad(str, length) {
    for (var i = str.length; i < length; i++) str = '0' + String(str);
    return str;
}

function randStr(length) {
    var text = '';
    var possible = 'abcdefghijkmnpqrstuvwxyz0123456789ABCDEFGHJKMNPQRSTUVWXYZ';
    for (var i = 0; i < length; i++) text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
}

