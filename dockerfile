FROM node:8-alpine

ENV NODE_ENV production
WORKDIR /app

# Install database dependencies
RUN ["apk", "add", "--update", "python", "make", "g++"]

# Install app dependencies
COPY ["package.json", "package-lock.json", "./"]
RUN ["npm", "install", "--build-from-source"]

# Bundle app source
COPY ["./src/", "./src/"]

EXPOSE ${PORT:-3293}
CMD ["node", "src/main.js"]
