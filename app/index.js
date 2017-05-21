//external library imports
var Dns = require("dns"); //for connectivity checking
var Url = require("url"); //for url parsing
var Uri = require("urijs"); //for finding urls within message strings
var FeedRead = require("feed-read"); //for rss feed reading
var Console = require("console");

var config;

module.exports = (_config) => {
	config = _config || require("./config.json");

	this.onReady = (bot) => {
		Actions.checkPastMessagesForLinks(bot); //we need to check past messages for links on startup, but also on reconnect because we don't know what has happened during the downtime

		//set the interval function to check the feed
		intervalFunc = () => {
			var callback = (err, articles, feed) => Links.validate(err, articles, (latestLink) => Actions.post(bot, latestLink, feed.roleID));

			Feed.checkFeeds(config.feeds, callback);
		};

		setInterval(() => { intervalFunc(); }, config.pollingInterval);
	};

	this.onMessage = (bot, user, userID, channelID, message) => {
		//contains a link, and is not the latest link from the rss feed
		if (channelID === config.channelID && Links.messageContainsLink(message) && (message !== Links.latestFromFeedlatestFeedLink)) {
			Console.info("Detected posted link in this message: " + message, "Discord.io");

			//extract the url from the string, and cache it
			Uri.withinString(message, function (url) {
				Links.cache(Links.standardise(url));
				return url;
			});
		}

	};

	this.commands = [
		{
			command: config.userCommands.help,
			type: "equals",
			action: (bot, user, userID, channelID, message) => {
				bot.sendMessage({
					to: config.channelID,
					message: "Available commands: " + getValues(config.userCommands).join(", ")
				});
			},
			channelIDs: [config.channelID]
		},
		{
			command: config.developerCommands.logUpload,
			type: "equals",
			action: (bot, user, userID, channelID, message) => {
				bot.uploadFile({
					to: channelID,
					file: config.logFile
				});
			},
			userIDs: config.developers
		},
		{
			command: config.developerCommands.cacheList,
			type: "equals",
			action: (bot, user, userID, channelID, message) => {
				bot.sendMessage({
					to: channelID,
					message: Links.cached.join(", ")
				});
			},
			userIDs: config.developers
		}
	];

	return this;
};

var Actions = {
	post: (bot, link, roleID) => {
		//send a messsage containing the new feed link to our discord channel
		bot.sendMessage({
			to: config.channelID,
			message: ((roleID !== "" && roleID !== undefined) ? "<@&" + roleID + ">" : "") + " " + link
		});
	},
	checkPastMessagesForLinks: (bot) => {
		var limit = 100;
		Console.info("Attempting to check past " + limit + " messages for links");

		//get the last however many messsages from our discord channel
		bot.getMessages({
			channelID: config.channelID,
			limit: limit
		}, function (err, messages) {
			if (err) Console.error("Error fetching discord messages.", err);
			else {
				Console.info("Pulled last " + messages.length + " messages, scanning for links");

				var messageContents = messages.map((x) => { return x.content; }).reverse(); //extract an array of strings from the array of message objects

				for (var messageIdx in messageContents) {
					var message = messageContents[messageIdx];

					if (Links.messageContainsLink(message)) //test if the message contains a url
						//detect the url inside the string, and cache it
						Uri.withinString(message, function (url) {
							Links.cache(url);
							return url;
						});
				}
			}
		});
	},
};

var YouTube = {
	url: {
		share: "http://youtu.be/",
		full: "http://www.youtube.com/watch?v=",
		createFullUrl: function (shareUrl) {
			return shareUrl.replace(YouTube.url.share, YouTube.url.full);
		},
		createShareUrl: function (fullUrl) {
			var shareUrl = fullUrl.replace(YouTube.url.full, YouTube.url.share);

			if (shareUrl.includes("&")) shareUrl = shareUrl.slice(0, fullUrl.indexOf("&"));

			return shareUrl;
		}
	},
};

var Links = {
	standardise: function (link) {
		link = link.replace("https://", "http://"); //cheaty way to get around http and https not matching
		if (config.youtubeMode) link = link.split("&")[0]; //quick way to chop off stuff like &feature=youtube etc
		return link;
	},
	messageContainsLink: function (message) {
		var messageLower = message.toLowerCase();
		return messageLower.includes("http://") || messageLower.includes("https://") || messageLower.includes("www.");
	},
	cached: [],
	latestFeedLink: "",
	cache: function (link) {
		link = Links.standardise(link);

		if (config.youtubeMode) link = YouTube.url.createShareUrl(link);

		//store the new link if not stored already
		if (!Links.isCached(link)) {
			Links.cached.push(link);
			Console.info("Cached URL: " + link);
		}

		if (Links.cached.length > config.numLinksToCache) Links.cached.shift(); //get rid of the first array element if we have reached our cache limit
	},
	isCached: function (link) {
		link = Links.standardise(link);

		if (config.youtubeMode)
			return Links.cached.includes(YouTube.url.createShareUrl(link));

		return Links.cached.includes(link);
	},
	validate: function (err, articles, callback) {
		if (err) Console.error("FEED ERROR: Error reading RSS feed.", err);
		else {
			var latestLink = Links.standardise(articles[0].link);
			if (config.youtubeMode) latestLink = YouTube.url.createShareUrl(latestLink);

			//make sure we don't spam the latest link
			if (latestLink === Links.latestFeedLink)
				return;

			//make sure the latest link hasn't been posted already
			if (!Links.isCached(latestLink)) {
				callback(latestLink);

				Links.cache(latestLink); //make sure the link is cached, so it doesn't get posted again
			}

			Links.latestFeedLink = latestLink; //ensure our latest feed link variable is up to date, so we can track when the feed updates
		}
	}
};

var Feed = {
	checkFeeds: function (feeds, individualCallback) {
		feeds.forEach((feed) => {
			Dns.resolve(Url.parse(feed.url).host, (err) => {
				if (err) Console.error("CONNECTION ERROR: Cannot resolve host.", err);
				else FeedRead(feed.url, (err, articles) => individualCallback(err, articles, feed));
			});
		});
	}
};

var getValues = function (obj) {
	var values = [];
	for (var value in obj)
		if (obj.hasOwnProperty(value))
			values.push(obj[value]);
	return values;
};

var intervalFunc = () => { }; //do nothing by default