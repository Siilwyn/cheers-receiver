FROM node:8-alpine

# Define app directory
WORKDIR /app

# Install app dependencies
COPY package.json .
RUN npm install --production

# Bundle app source
COPY src ./src

EXPOSE ${PORT:-3000}
CMD [ "npm", "start" ]
