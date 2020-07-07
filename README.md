![Build status](https://github.com/benjihiggins/discord-rss-fetcher/workflows/Build%20%2B%20test/badge.svg?branch=master)

# Discord RSS fetcher
A Discord bot to post the latest articles from an RSS feed into a channel, optionally mentioning a role when posting.

## Features
- Multiple feeds per server
- Commands to configure feeds in different channels
- Optional role to be mentioned when a feed article is posted
- Detects if a user "beats me to it" by posting the URL before the bot can (useful for slow feeds)
- Specific handling for YouTube links, detects both long and short YouTube URLs

## Use cases
- You want to stay up to date with an RSS feed
- You want your Discord server to be notified of events via an RSS feed

## Community instance
A community member, [Oliver4888](https://github.com/oliver4888), is kindly offering public hosts of my Discord bots for other community members. If you are interested in using this community-provided instance, you can find more at https://bots.ol48.uk/.  
Please note that I cannot personally verify or take responsibility for the integrity of a community-provided bot instance.

## Getting started
RSS Fetcher needs to be deployed before you can invite it to your Discord server. Please see [my written deployment guide](https://benjihiggins.github.io/discord-deployment) or [video tutorial](https://www.youtube.com/watch?v=DjQayKgcjGM) which can guide you through deployment even if you are a beginner.  
Once you have deployed RSS Fetcher then return here to follow the Discord setup instructions below.  

This button can be used for following the Heroku deployment steps.

[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/benjihiggins/discord-rss-fetcher)

## Discord Setup

Follow these instructions once you have deployed the RSS Fetcher and added it to your Discord server.
Use `@RSS Fetcher help` to view available commands.

**Admin only**
These commands require administrator permission in the Discord server.
- `@RSS Fetcher add-feed <url> <#channel> [@role]` to add a new feed
- `@RSS Fetcher view-feeds` to view configured feeds for this server
- `@RSS Fetcher remove-feed <feed-id>` to remove a feed by it's ID (found using the `view-feeds` command)

Example:
`@RSS Fetcher add-feed http://lorem-rss.herokuapp.com/feed?unit=second&interval=30 #rss-posts @subscribers`

## Permissions
The bot requires certain permissions, which you are prompted for on the invite screen.
Each permission has a reason for being required, explained below.

| Permission           | Reason                                                              |
|----------------------|---------------------------------------------------------------------|
| Read messages        | Detect when you use commands                                        |
| Send messages        | Respond when you use commands; post new RSS links                   |
| Read message history | Check if any new RSS links have been posted during downtime         |
| Embed links          | Responses to 'help' requests use message embeds for nice formatting |

## Troubleshooting

- Test RSS Fetcher's ability to reply by using the version command `@RSS Fetcher version`
- Double check that RSS Fetcher has both *read* and *write* permissions in the channel you're using
- Make sure you're actually mentioning the bot and *not the role with the same name*
- Make sure you have the 'Administrator' permission if you're trying to use an admin command
- Double check that you've given RSS Fetcher all the necessary [permissions](#permissions)
- If you want RSS Fetcher to mention a role when it posts a new feed, make sure this role is mentionable
- Make sure your RSS feed is valid by testing it on an RSS feed validator website
- If you delete a channel and recreate it with the same name, you will need to delete and re-create the feed also

## Built With
- [Node.js](https://nodejs.org/en/) - *Runtime*
- [discord.js](https://github.com/discordjs/discord.js) - *Discord library*
- [disharmony](https://github.com/benjihiggins/disharmony) - *Bot framework*
- [rss-parser](https://github.com/bobby-brennan/rss-parser) - *RSS parsing library*

## Versioning
[SemVer](http://semver.org/) is used for versioning; view available versions on the [tags page](https://github.com/your/project/tags)

## License
This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details
