FROM node as builder
RUN mkdir /workspace
WORKDIR /workspace
COPY package.json ./
COPY tslint.json ./
COPY tsconfig.build.json ./
COPY tsconfig.json ./
RUN npm install
#RUN npm run test
COPY src ./src
RUN npm run build
FROM node
COPY --from=builder /workspace/dist /app
WORKDIR /app
COPY package.json /app
RUN npm i --only=prod
CMD node main.js
