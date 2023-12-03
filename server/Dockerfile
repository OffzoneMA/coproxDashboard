# Assuming you're using a Node.js base image
FROM node:14.16-alpine

RUN apk --no-cache add --virtual builds-deps build-base python

# Create App Directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install Dependencies
COPY package.json .
#COPY package-lock.json /usr/src/app/


# Install other dependencies
RUN npm install

# Copy app source code
COPY . .

# Exports
EXPOSE 8081

# Set up a default command
CMD ["npm", "run", "dev"]