FROM node:21-alpine3.17

# Create App Directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install Dependencies
COPY package.json .

#RUN npm install
RUN npm install
RUN npm install --save-dev webpack-cli
RUN npm install --save-dev webpack-dev-server@latest
RUN npm install @mui/material @emotion/react @emotion/styled



# Copy app source code
COPY . .


# Build the React app
#RUN npm run build


# Exports
EXPOSE 3000

# Set up a default command
CMD [ "npm", "start" ]