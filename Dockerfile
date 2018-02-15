FROM quay.io/ukhomeofficedigital/nodejs-base:v8

COPY .npmrc /app/.npmrc
COPY package.json /app/package.json
COPY package-lock.json /app/package-lock.json
RUN npm install --production --no-optional
COPY . /app

RUN rm /app/.npmrc

USER nodejs

CMD node index.js
