# use "node:alpine" as Base Image https://hub.docker.com/_/node/
FROM node:alpine

# Install dependencies
RUN apk update
RUN apk add git

# Copy Application into Container
WORKDIR /usr/src/app
COPY . .

# Install Node packages
RUN npm install
WORKDIR /usr/src/app/core
RUN npm install
WORKDIR /usr/src/app


# Volume guilds-data
RUN mkdir -p /usr/src/app/guilds-data
VOLUME "/usr/src/app/guilds-data"

# Environment variable for token.json
ENV BOT_TOKEN "your-token-goes-here"

# Entrypoint
ENTRYPOINT /usr/src/app/docker-entrypoint.sh
