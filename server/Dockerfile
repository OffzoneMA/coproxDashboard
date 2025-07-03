# Assuming you're using a Node.js base image
FROM node:21-alpine3.17


# Create App Directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install Dependencies
COPY package.json .
#COPY package-lock.json /usr/src/app/


# Install other dependencies
RUN npm install
RUN npm install cors
RUN npm install @datadog/browser-logs

# Copy app source code
COPY . .

# Exports
EXPOSE 8081

# Set up a default command
CMD ["npm", "run", "dev"]