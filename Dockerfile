FROM node:14

RUN apt update && apt install -y sqlite3

WORKDIR /usr/src/app

COPY ./package.json .

RUN yarn

COPY ./ ./

RUN yarn db:migrate

CMD ["yarn", "start"]