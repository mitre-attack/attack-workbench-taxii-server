# First, we tell Docker to use an official Node.js image available in the public stix.
# We specify the 12.13 version of Node and choose an Alpine image. Alpine images are lighter, but using them can have
# unexpected behavior.
# Since we are using the multi-stage build feature, we are also using the AS statement to name the image development.
# The name here can be anything; it is only to reference the image later on.
FROM node:current-alpine3.14 AS development

# Set the working directory within the container to /app. After setting WORKDIR, each command Docker executes (defined
# in the RUN statement) will be executed in the specified context.
WORKDIR /app

# First, we copy only package.json and package-lock.json (if it exists). Then we run, in the WORKDIR context, the npm
# install command. Once it finishes, we copy the rest of our application’s files into the Docker container.
COPY package*.json ./

# Here we install only devDependencies due to the container being used as a “builder” that takes all the necessary tools
# to build the application and later send a clean /dist folder to the production image.
RUN npm install --only=development

COPY . .

# Finally, we make sure the app is built in the /dist folder. Since our application uses TypeScript and other build-time
# dependencies, we have to execute this command in the development image.
RUN npm run build

# By using the FROM statement again, we are telling Docker that it should create a new, fresh image without any
# connection to the previous one. This time we are naming it production.
# Thanks to the multi-stage build feature, we can keep our final image (here called production) as slim as possible by
# keeping all the unnecessary bloat in the development image.
FROM node:current-alpine3.14 AS production

ARG TAXII_ENV=dev.local
ENV TAXII_ENV=${TAXII_ENV}

WORKDIR /app

COPY package*.json ./

# Now this part is exactly the same as the one above, but this time, we are making sure that we install only
# dependencies defined in dependencies in package.json by using the --only=production argument. This way we don’t install
# packages such as TypeScript that would cause our final image to increase in size.
RUN npm install --only=production

# Install PM2 globally
RUN npm install pm2 -g

# Copy over the PM2 configuration file. We will need this to start the container.
COPY ecosystem.config.js .

# Here we copy the built /dist folder from the development image. This way we are only getting the /dist directory,
# without the devDependencies, installed in our final image.
COPY --from=development /app/dist ./dist

# Copy .env file and optional SSL keys (public-certificate.pem + private-key.pem) to image
COPY config/ config/
RUN cp config/*pem dist/config/ | true

# Here we define the default command to execute when the image is run.
CMD ["npm", "run", "start:prod"]