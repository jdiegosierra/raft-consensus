FROM node:12-alpine

# Create app directory
WORKDIR /usr/nodo

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
#COPY package*.json ./
#EXPOSE 3000
#EXPOSE 3001
EXPOSE ${GRPC_PORT}
#RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
#COPY . .
#RUN mkdir ./logss
#RUN touch ./logss/debug.log
RUN ls
RUN npm install grpc
CMD [ "npm", "run", "start:dev" ]

# TODO: HACER UN VOLUME PARA LA CARPTECA DE DOCS



#Para crear la imagen
#$ docker build -t asf-server/api .

#$ docker run -p 30315:3000 -d asf-server/api

# Get container ID
#$ docker ps

# Print app output
#$ docker logs <container id>

# Kill container

# Remove image