FROM node:8-alpine

ENV NODE_ENV production
WORKDIR /app

# Install app dependencies
COPY package.json .
RUN npm install

# Bundle app source
COPY src ./src

EXPOSE ${PORT:-3000}
CMD [ "npm", "start" ]
