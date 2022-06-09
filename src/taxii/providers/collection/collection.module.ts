import {Module} from '@nestjs/common';
import {CollectionService} from './collection.service';
import {CollectionRepository} from "./collection.repository";

@Module({
    providers: [CollectionService, CollectionRepository],
    exports: [CollectionService],
})
export class CollectionModule {}
