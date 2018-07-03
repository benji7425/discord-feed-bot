#!/bin/sh
# create token.json file
echo "\"${BOT_TOKEN}\"" > /usr/src/app/token.json
# start discord-bot-rss-feed
npm start
