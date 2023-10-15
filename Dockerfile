FROM node:18

LABEL version="1.0"
LABEL description="Base docker image for the City Science demo API."
LABEL maintainer = ["kdoykov99@gmail.com"] 

WORKDIR /usr/app
COPY ./ /usr/app

RUN yarn global add node-gyp
RUN yarn install --frozen-lockfile
COPY . .

EXPOSE 4000

CMD ["node","api/src/index.js"]