import {Test} from "@nestjs/testing";
import {TaxiiLoggerModule} from "src/common/logger/taxii-logger.module";
import {CacheModule} from "@nestjs/common";
import {StixModule} from "src/stix/stix.module";
import {ObjectRepository} from "./object.repository";
import {TaxiiConfigModule} from "src/config";

it("can create an instance of ObjectRepository", async () => {
   const module = await Test.createTestingModule({
       imports: [
           TaxiiLoggerModule,
           TaxiiConfigModule,
           CacheModule.register({
               isGlobal: true,
               ttl: 600,
           }),
           StixModule.register({
               useType: "workbench",
               workbench: {
                   authorization: "fake-api-key",
               },
           }),
       ],
       providers: [ObjectRepository]
   }).compile();

   const objectRepository = module.get(ObjectRepository);
   expect(objectRepository).toBeDefined();
});