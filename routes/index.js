var express = require('express');
var rbxJs = require('roblox-js');
var https = require('https');
var router = express.Router();

var ranks = [5, 10, 20, 30, 40];
var groupId = 1256082;
var apiKey = "1IJBk5TxgeUSHd3NPtBoiN9LbaxMuXi1QkoCLz8HtsyN8O4wng2cP0Ftfp6Z";

function GetEXPFromLevel(level) {
	return level > 1 
	? level * 200 + 500 
	: 0;
}

function GetLevelFromEXP(exp) {
	return exp >= GetEXPFromLevel(2) 
	? Math.floor((exp - 500) / 200) 
	: 1;
}

function updateGroupRankings() {
	console.log("Updating Group " + groupId + " Rankings @ " + new Date());

	var changes = {};
	var playersComplete = 0;

	function errorHandler(error, errorId) {
		result = "ERROR " + errorId + ", " + error;
		console.log(result);
	}

	function setRank(id, name, rnew, rold, rname) {
		console.log("Setting the rank of " + name + " from " + rold + " to " + rnew);
		changes[id] = (rnew > rold ? "Promotion" : "Demotion") + ": " + rold + "=>" + rnew;
			
		rbxJs.setRank({
			group: groupId,
			target: id,
			rank: rnew
		}).then(function() {
			console.log("Successfully ranked " + name);

			if (rnew > rold) {
				console.log("Sending message to " + name + " to congratulate them on their promotion.");

				rbxJs.message({
					recipient: id,
					subject: "[PROMO] The Iron Banner",
					body: "Congratulations " + name + "! You have been promoted to " + rname + "! Please continue to serve us well in duty and be active.\n\nBe sure to message any high ranks if you have questions.",
				}).then(function() {
					console.log("Message successfully sent to " + name);
				}).catch(errorHandler);
			}
		}).catch(errorHandler);
	}

	function noChange(id) {
		console.log("Player " + id + " requires no rank change.");
	}

	function logChangesToDoc() {
		var postData = JSON.stringify(changes);
		var post = https.request({
			hostname: "script.google.com",
			path: "/macros/s/AKfycbxTJ7YjbeHxfEOD8MIcfqXzUvHGRvXcc_tsXOg-ponntqoZEdte/exec",
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Content-Length": Buffer.byteLength(postData)
			}
		});

		post.write(postData);
		post.end();
	}

	rbxJs.getRoles({
		group: groupId
	}).then(function(roles) {

		var highestPromoRank = roles[ranks.length];

		for (var index in roles) {
			roles[index].PromoEXP = GetEXPFromLevel(
				index == 0 ? 0 : ranks[index - 1]
			);
		}

		console.log(roles);

		https.get(
			"https://api.myjson.com/bins/4lahg",

			function(res) {
				res.on('data', function(data) {

					console.log(data);

					data = JSON.parse(data.toString());

					console.log(data);

			  		rbxJs.getPlayers({
						group: groupId
					}).promise.then(function(players) {
						players = players.players;

						var numPlayers = Object.keys(players).length;

						console.log(players);

						for (var playerIndex in players) {
							(function(playerIndex) {
								var userName = playerIndex;
								var userId = parseInt(players[playerIndex]);

								rbxJs.getRankInGroup({
									userId: userId,
									group: groupId
								}).then(function(rank) {
									if (rank <= highestPromoRank.Rank) {
										var exp = data[userId.toString()];

										if (typeof exp == "number") {
											for (var index in roles) {
												var PromoEXP = roles[index].PromoEXP;
												if (typeof PromoEXP == "number") {
													if (Math.min(exp, PromoEXP) == exp) {
														if (exp == PromoEXP && rank != roles[index].Rank) {
															setRank(
																userId, 
																userName, 
																roles[index].Rank, 
																rank,
																roles[index].Name
															);
														} else if (exp != PromoEXP && rank != roles[index - 1].Rank) {
															setRank(
																userId, 
																userName, 
																roles[index - 1].Rank, 
																rank,
																roles[index - 1].Name
															);
														} else {
															noChange(userId);
														}
														break;
													} else if (
														roles[index] === highestPromoRank && 
														highestPromoRank.PromoEXP < exp && 
														highestPromoRank.Rank != rank
													) 
													{
														setRank(
															userId, 
															userName, 
															highestPromoRank.Rank, 
															rank,
															highestPromoRank.Name
														);
														break;
													} else {
														noChange(userId);
													}
												}
											}
										} else if (rank != roles[0].Rank) {
											foundRanking = true;
											setRank(
												userId, 
												userName, 
												roles[0].Rank, 
												rank,
												roles[0].Name
											);
										} else {
											noChange(userId);
										}
									} else {
										console.log(userName + " is exempt from Promotions/Demotions.");
									}

									playersComplete++;

									if (playersComplete == numPlayers) {
										logChangesToDoc();
									}
								}).catch(errorHandler);
							})(playerIndex);
						}
					}).catch(errorHandler);
			  	});
			}
		).on('error', function(e) {
			console.error(e);
		});
	}).catch(errorHandler);
}

function loginToAdministrator(){
	console.log("Logging into IRONTechnologies...");

	rbxJs.login({
	  username: 'irontechnologies',
	  password: 'theironisalie'
	}).then(function(info) {
	    console.log('Permissions Accessed');
	    console.log('Commencing Ranking System & Awaiting Calls from rbx.irontechnologies@gmail.com');

	    router.get('/update', function(req, res) {

	    	if (req.query.apiKey == apiKey) {
				https.get('https://api.myjson.com/bins/20wqi', function(res) {
					console.log('statusCode:', res.statusCode);
					console.log('headers', res.headers);

					res.on('data', function(data){
						var now = new Date();
						var time = JSON.parse(data.toString()).time;

						if (typeof time == "number" && now.getTime() - time >= 3600000) {
							var postData = JSON.stringify({
								"time": now.getTime()
							});

							var post = https.request({
								hostname: "api.myjson.com",
								path: "/bins/20wqi",
								method: "PUT",
								headers: {
									"Content-Type": "application/json",
									"Content-Length": Buffer.byteLength(postData)
								}
							});

							post.write(postData);
							post.end();

							updateGroupRankings();
						} else {
							console.log(time, now.getTime())
						}
					});
				}).on('error', function(e) {
					console.log("Could not retrieve time of last request");
					console.log(e);
				});
	    	} else {
	    		console.log(req.query.apiKey);
	    	}
	    });

	    updateGroupRankings();
	}).catch(function() {
		console.log('Permissions Denied');
	});
}

console.log("Setup Complete.");
loginToAdministrator();

module.exports = router;
