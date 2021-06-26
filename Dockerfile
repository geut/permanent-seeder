FROM node:12-alpine

WORKDIR /home/node

RUN apk add --no-cache libtool autoconf automake make gcc g++ libsodium libc6-compat python
COPY --chown=node ./package* /home/node/

RUN npm install && \
    npm cache clean --force

COPY --chown=node . /home/node/
COPY --chown=node ./packages/dashboard/.env.example /home/node/packages/dashboard/.env

RUN npm run bootstrap && npm run build

RUN apk delete libtool autoconf automake make gcc g++ libsodium libc6-compat python

USER node

WORKDIR /home/node/packages/cli
RUN /home/node/packages/cli/bin/run config:init
CMD /home/node/packages/cli/bin/run start && /home/node/packages/cli/bin/run logs --live
