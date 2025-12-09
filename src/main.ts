import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { NestApplication, NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as express from 'express';
import * as http from 'http';
import * as https from 'https';
import { AppModule } from './app.module';
import { TaxiiConfigModule, TaxiiConfigService } from './config';

/**
 * Starts the Nest.js application
 */
export async function bootstrap() {
  // ** Initialize Express adapter ** //
  const server: express.Express = express();

  // ** Initialize the config module ** //

  // * NOTE: This is a bit weird, but we're going to init a copy of the ConfigModule separately from the core app
  // * so that we can access config parameters before AppModule gets initialized. This is because the AppModule and the
  // * contained StixModule have not been fully converted to DynamicModule's yet, and they depend on the
  // * AppConfigService. The problem is, the AppConfigService is initialized by the core AppModule, so there is an
  // * inherent circular dependency. This is a slight design flaw that can be resolved by converting AppModule to a
  // * *fully* dynamic module. Details on building completely dynamic modules can be read about here:
  // * https://dev.to/nestjs/advanced-nestjs-how-to-build-completely-dynamic-nestjs-modules-1370
  const tempConfigApp: NestApplication = await NestFactory.create(TaxiiConfigModule);
  const tempConfigService: TaxiiConfigService = tempConfigApp.get(TaxiiConfigService);
  // ** Initialize the core TAXII application ** //

  // * NOTE: We're able to influence the behavior of the AppModule by injecting user-definable parameters into the
  // * AppModule.register method, which, consequently, are set by OS environment variables.

  const app: NestApplication = await NestFactory.create(
    AppModule.register(tempConfigService.createAppConnectOptions()),
    // AppModule.register({ useClass: TaxiiConfigService } ),   <--- Long term goal is to refactor the implementation
    //                                                              to be fully dynamic such that we can load the
    //                                                              app like this (w/o instantiating a temporary
    //                                                              config)
    new ExpressAdapter(server),
  );

  // ** Set the API ROOT ** //
  app.setGlobalPrefix(tempConfigService.API_ROOT_PATH, {
    // * NOTE: Per the TAXII 2.1 spec, the Discovery route (GET /taxii2/) must not be prefixed with {api-root}, so we
    // * exclude it from the global prefix
    exclude: [
      {
        path: '/taxii2/',
        method: RequestMethod.GET,
      },
      {
        path: '/health/ping',
        method: RequestMethod.GET,
      },
    ],
  });

  // ** Disable Express default headers ** //
  server.disable('x-powered-by');

  // ** Specify maximum request body size ** //
  app.use(express.json({ limit: tempConfigService.MAX_CONTENT_LENGTH }));
  // NOTE: The default maximum content length is 0 (zero) because POST requests are not supported at this time

  // ** Enable global validation pipe to handle DTO class transformations ** //
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  // ** Initialize Swagger ** //
  initSwagger(app);

  // ** Enable CORS ** //
  if (tempConfigService.CORS_ENABLED) {
    app.enableCors();
  }

  // ** Initialize the Nest application ** //
  await app.init();

  // ** Start the web server ** //
  try {
    // HTTPS (SSL/TLS)
    if (tempConfigService.HTTPS_ENABLED) {
      const httpsOptions = {
        key: tempConfigService.SSL_PRIVATE_KEY,
        cert: tempConfigService.SSL_PUBLIC_KEY,
      };
      console.log(
        `Starting the TAXII server at https://${tempConfigService.APP_ADDRESS}:${tempConfigService.APP_PORT_HTTPS}...`,
      );
      https.createServer(httpsOptions, server).listen(tempConfigService.APP_PORT_HTTPS);
    } else {
      // HTTP (insecure)
      console.log(
        `Starting the TAXII server at http://${tempConfigService.APP_ADDRESS}:${tempConfigService.APP_PORT}...`,
      );
      http.createServer(server).listen(tempConfigService.APP_PORT);
    }
  } catch (err) {
    // Fall back to HTTP (insecure) in case SSL keys cannot be loaded
    console.log('SSL keys not found. Falling back to HTTP (insecure)');
    console.log(
      `Starting the TAXII server at http://${tempConfigService.APP_ADDRESS}:${tempConfigService.APP_PORT}...`,
    );
    http.createServer(server).listen(tempConfigService.APP_PORT);
  }

  console.log(`Bootstrap process completed...cleaning up...`);
  await tempConfigApp.close();
}

function initSwagger(app: NestApplication) {
  // Initialize Swagger
  const details = new DocumentBuilder()
    .setTitle('ATT&CK TAXII 2.1 API Server')
    .setDescription('This is a very important server.')
    .setVersion('1.0')
    .addTag('TAXII 2.1 API', 'API Specification Document', {
      description: 'TAXII Version 2.1 OASIS Standard - 10 June 2021',
      url: 'https://docs.oasis-open.org/cti/taxii/v2.1/os/taxii-v2.1-os.html',
    })
    .build();

  const document = SwaggerModule.createDocument(app, details);
  SwaggerModule.setup('api-docs', app, document);
}

// start the server!
bootstrap();
