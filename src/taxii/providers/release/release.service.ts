import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TaxiiNotFoundException } from 'src/common/exceptions';
import { TaxiiLoggerService as Logger } from 'src/common/logger';
import {
  ReleasePointerDocument,
  ReleasePointerEntity,
  TaxiiCollectionDocument,
  TaxiiCollectionEntity,
} from 'src/hydrate/schema';

export interface ReleaseSummary {
  version: string;
  modified: Date;
}

/**
 * Provides the release dimension of the TAXII surface: which ATT&CK releases are hydrated (each
 * exposed as a pinned API root, e.g. api/v21/attack-19.1) and which release the latest-tracking
 * default API root currently points at.
 */
@Injectable()
export class ReleaseService {
  constructor(
    private readonly logger: Logger,
    @InjectModel(TaxiiCollectionEntity.name)
    private collectionModel: Model<TaxiiCollectionDocument>,
    @InjectModel(ReleasePointerEntity.name)
    private releasePointerModel: Model<ReleasePointerDocument>,
  ) {
    this.logger.setContext(ReleaseService.name);
  }

  /**
   * Lists every fully hydrated release, ordered oldest to newest by publication timestamp.
   * Releases are deduplicated across collections (e.g. Enterprise 19.1 and Mobile 19.1 are the
   * same release).
   */
  async listReleases(): Promise<ReleaseSummary[]> {
    const releases: Array<{ _id: string; modified: Date }> = await this.collectionModel.aggregate([
      {
        $group: {
          _id: '$_meta.release.version',
          modified: { $max: '$_meta.release.modified' },
        },
      },
      { $sort: { modified: 1 } },
    ]);

    return releases.map((release) => ({ version: release._id, modified: release.modified }));
  }

  /**
   * Returns true if at least one collection has a fully hydrated release with the specified
   * version. Backs the 404 handling for unknown pinned API roots.
   */
  async releaseExists(version: string): Promise<boolean> {
    const exists = await this.collectionModel.exists({ '_meta.release.version': version }).exec();
    return exists != null;
  }

  /**
   * Resolves the latest release version of the specified collection. Used by the default
   * (latest-tracking) API root to scope queries to a single release.
   */
  async resolveLatestVersion(collectionId: string): Promise<string> {
    const pointer = await this.releasePointerModel.findOne({ collectionId }).exec();

    if (!pointer) {
      throw new TaxiiNotFoundException({
        title: 'Collection Not Found',
        description: `Collection ID '${collectionId}' not available in database`,
      });
    }

    return pointer.version;
  }

  /**
   * Returns the latest-release pointer of every collection. Used by the default API root to list
   * collections at their latest versions.
   */
  async getLatestPointers(): Promise<ReleasePointerEntity[]> {
    return await this.releasePointerModel.find().exec();
  }
}
