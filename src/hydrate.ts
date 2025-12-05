import { NestApplication, NestFactory } from "@nestjs/core";
import { TaxiiConfigModule, TaxiiConfigService } from "./config";
import { HydrateModule } from "./hydrate/hydrate.module";
import { HydrateService } from "./hydrate/hydrate.service";

/**
 * Starts the Nest.js application
 */
export async function bootstrap() {
  const tempConfigApp: NestApplication =
    await NestFactory.create(TaxiiConfigModule);
  const tempConfigService: TaxiiConfigService =
    tempConfigApp.get(TaxiiConfigService);

  const app: NestApplication = await NestFactory.create(
    HydrateModule.register(tempConfigService.createHydrateConnectOptions()),
  );

  // ** Initialize the Nest application ** //
  await app.init();

  console.log(`Bootstrap process completed...cleaning up...`);
  await tempConfigApp.close();
}

// start the server!
bootstrap();
