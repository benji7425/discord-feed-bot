// @ts-ignore
const Config = require("../config.json");

const { promisify } = require("util");
const Core = require("../../core");
const DiscordUtil = require("../../core").util;
const GetUrls = require("get-urls");
const Url = require("url");
const HtmlToText = require("html-to-text");

// @ts-ignore
const readFeed = url => promisify(require("rss-parser").parseURL)(url);
const resolveDns = promisify(require("dns").resolve);

module.exports = class FeedData extends Core.BaseEmbeddedData {
    constructor() {
        super();

        this.feedID = "";
        this.url = "";
        this.channelID = "";
        this.roleID = "";
        this.cachedLinks = [];
        this.maxCacheSize = 100;

        // @ts-ignore
        this.schema({
            feedID: String,
            url: String,
            channelID: String,
            roleID: String,
            cachedLinks: [String],
            maxCacheSize: Number
        });
    }

    cache(...elements) {
        const newArticles = elements
            .map(el => normaliseUrlForCache(el))
            .filter(el => !this._isCached(el));

        Array.prototype.push.apply(this.cachedLinks, newArticles);

        this.cachedLinks.splice(0, this.cachedLinks.length - this.maxCacheSize); //seeing as new links come in at the end of the array, we need to remove the old links from the beginning

        return elements.length > 0;
    }

    updatePastPostedLinks(guild) {
        const channel = guild.channels.get(this.channelID);

        if (!channel)
            return Promise.reject("Channel not found!");

        return new Promise((resolve, reject) => {
            channel.fetchMessages({ limit: 100 })
                .then(messages => {
          /* we want to push the links in oldest first, but discord.js returns messages newest first, so we need to reverse them
           * discord.js returns a map, and maps don't have .reverse methods, hence needing to spread the elements into an array first */
                    [...messages.values()].reverse().forEach(m => this.cache(...GetUrls(m.content)));
                    resolve();
                })
                .catch(reject);
        });
    }

    fetchLatest(guild) {
        const dnsPromise = resolveDns(Url.parse(this.url).host).then(() => this._doFetchRSS(guild));

        dnsPromise.catch(err => DiscordUtil.dateDebugError("Connection error: Can't resolve host", err.message || err));

        return dnsPromise;
    }

    toString() {
        const blacklist = ["cachedLinks", "maxCacheSize"];
        return `\`\`\`JavaScript\n ${JSON.stringify(this, (k, v) => !blacklist.find(x => x === k) ? v : undefined, "\t")} \`\`\``;
    }

    _isCached(url) {
        return this.cachedLinks.indexOf(normaliseUrlForCache(url)) > -1;
    }

    _doFetchRSS(guild) {
        const feedPromise = readFeed(this.url).then(parsed => this._processLatestArticle(guild, parsed.feed.entries));

        feedPromise.catch(err => DiscordUtil.dateDebugError([`Error reading feed ${this.url}`, err]));

        return feedPromise;
    }

    _processLatestArticle(guild, entries) {
        if (entries.length === 0 || !entries[0].link)
            return false;

        if (this._isCached(entries[0].link))
            return false;

        this.cache(entries[0].link);

        const channel = guild.channels.get(this.channelID),
            role = guild.roles.get(this.roleID);

        channel.send((role || "") + formatPost(entries[0]))
            .catch(err => DiscordUtil.dateDebugError(`Error posting in ${channel.id}: ${err.message || err}`));

        return true;
    }
};

function formatPost(article) {
    let message = "";
    let link = "";
    let title = "";

    if (article.title) title = `\n**${article.title}**`;
    if (article.link) link = `\n\n${normaliseUrlForDiscord(article.link)}`;

    message += title;

    if (article.content) {
        let maxLen = Config.charLimit - title.length - link.length - 4;
        let sanitized = HtmlToText.fromString(article.content);
        message += sanitized.length > maxLen ? `\n${sanitized.substr(0, maxLen)}...` : `\n${sanitized}`;
    }

    message += link;

    return message;
}

function normaliseUrlForDiscord(url) {
    const parsedUrl = Url.parse(url);
    if (parsedUrl.host && parsedUrl.host.includes("youtube.com"))
        url = normaliseYouTubeUrl(url, parsedUrl);

    return url;
}

function normaliseYouTubeUrl(origUrl, parsedUrl) {
    const videoIDParam = parsedUrl.query ? parsedUrl.query.split("&").find(x => x.startsWith("v=")) : null;
    if (!videoIDParam)
        return origUrl;
    const videoID = videoIDParam.substring(videoIDParam.indexOf("=") + 1, videoIDParam.length);
    return `http://youtu.be/${videoID}`
}

function normaliseUrlForCache(url) {
    return normaliseUrlForDiscord(url).replace(/^((https?:\/\/)?(www.)?)/, "");
}
