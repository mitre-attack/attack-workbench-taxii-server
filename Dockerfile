FROM node:22-alpine AS development

# Set the working directory within the container to /app. After setting WORKDIR, each command Docker executes (defined
# in the RUN statement) will be executed in the specified context.
WORKDIR /app

# First, we copy only package.json and package-lock.json (if it exists). Then we run, in the WORKDIR context, the npm
# install command. Once it finishes, we copy the rest of our application’s files into the Docker container.
COPY package*.json ./

RUN npm ci

COPY . .

EXPOSE 8000

CMD ["sh", "-c", "npm run build && exec ./node_modules/.bin/pm2-runtime ecosystem.config.js"]

# Finally, we make sure the app is built in the /dist folder. Since our application uses TypeScript and other build-time
# dependencies, we have to execute this command in a build image derived from the development image.
FROM development AS build

RUN npm run build

# By using the FROM statement again, we are telling Docker that it should create a new, fresh image without any
# connection to the previous one. This time we are naming it production.
# Thanks to the multi-stage build feature, we can keep our final image (here called production) as slim as possible by
# keeping all the unnecessary bloat in the development image.
FROM node:22-alpine AS production

# Define build arguments
ARG VERSION=dev
ARG BUILDTIME=unknown
ARG REVISION=unknown

# Set version as environment variable for runtime access
ENV APP_VERSION=$VERSION \
    GIT_COMMIT=$REVISION \
    BUILD_DATE=$BUILDTIME

ARG TAXII_ENV=dev.local
ENV TAXII_ENV=${TAXII_ENV}

# Set Docker labels
LABEL org.opencontainers.image.title="ATT&CK Workbench TAXII Server" \
    org.opencontainers.image.description="This Docker image contains the TAXII 2.1 integration of the ATT&CK Workbench, an application for exploring, creating, annotating, and sharing extensions of the MITRE ATT&CK® knowledge base." \
    org.opencontainers.image.source="https://github.com/mitre-attack/attack-workbench-taxii-server" \
    org.opencontainers.image.documentation="https://github.com/mitre-attack/attack-workbench-taxii-server/README.md" \
    org.opencontainers.image.url="https://ghcr.io/mitre-attack/attack-workbench-taxii-server" \
    org.opencontainers.image.vendor="The MITRE Corporation" \
    org.opencontainers.image.licenses="Apache-2.0" \
    org.opencontainers.image.authors="MITRE ATT&CK<attack@mitre.org>" \
    org.opencontainers.image.version="${VERSION}" \
    org.opencontainers.image.created="${BUILDTIME}" \
    org.opencontainers.image.revision="${REVISION}" \
    maintainer="MITRE ATT&CK<attack@mitre.org>"

WORKDIR /app

COPY package*.json ./

# Install the locked runtime dependencies, including PM2.
RUN npm ci --omit=dev

# Copy over the PM2 configuration file. We will need this to start the container.
COPY ecosystem.config.js .

# Here we copy the built /dist folder from the development image. This way we are only getting the /dist directory,
# without the devDependencies, installed in our final image.
COPY --from=build /app/dist ./dist

# Copy .env file and optional SSL keys (public-certificate.pem + private-key.pem) to image
RUN mkdir config
RUN cp config/*pem dist/config/ | true

# Here we define the default command to execute when the image is run.
CMD ["./node_modules/.bin/pm2-runtime", "ecosystem.config.js"]
