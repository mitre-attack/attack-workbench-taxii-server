import { NestApplication, NestFactory } from "@nestjs/core";
import { TaxiiConfigModule, TaxiiConfigService } from "./config";
import { HydrateModule } from "./hydrate/hydrate.module";
import { HydrateService } from "./hydrate/hydrate.service";

/**
 * Starts the Nest.js application
 */
export async function bootstrap() {
  const tempConfigApp: NestApplication = await NestFactory.create(
    TaxiiConfigModule
  );
  const tempConfigService: TaxiiConfigService =
    tempConfigApp.get(TaxiiConfigService);

  const app: NestApplication = await NestFactory.create(
    HydrateModule.register(tempConfigService.createCollectorConnectOptions())
  );

  // ** Initialize the Nest application ** //
  await app.init();

  // Start the 'get-attack-objects' cron job to pre-populate the TAXII DB (MongoDB) with STIX
  if (tempConfigService.HYDRATE_ON_BOOT) {
    const provider = app.get(HydrateService);
    await provider.hydrate();
  }

  console.log(`Bootstrap process completed...cleaning up...`);
  await tempConfigApp.close();
}

// start the server!
bootstrap();
