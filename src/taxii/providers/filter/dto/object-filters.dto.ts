import {MatchDto} from "src/common/models/match/match.dto";
import {Type} from "class-transformer";


export interface ObjectFiltersOptions {
    collectionId?: string;
    objectId?: string;
    addedAfter?: string;
    limit?: number;
    match?: MatchDto;
}


export class ObjectFiltersDto {

    /**
     * Refers to the identifier of the Collection being requested
     */
    @Type(() => String)
    collectionId?: string;


    /**
     * TODO add description
     */
    @Type(() => String)
    objectId?: string;


    /**
     * A single timestamp that filters objects to only include those objects added after the specified timestamp. The
     * value of this parameter is a timestamp.
     */
    // @Type(() => TimestampDto)
    @Type(() => String)
    addedAfter?: string;


    /**
     * A single integer value that indicates the maximum number of objects that the client would like to receive in a
     * single response.
     *
     * Refers to the pagination count, i.e. the number of objects that should be returned to the user
     * e.g. ?limit=...
     */
    @Type(() => Number)
    limit?: number;


    /**
     * Refers to object fields/attributes: [id, type, version, spec_version]
     * e.g. ?match[id]=...
     *      ?match[type]=...
     *      ?match[version]=...
     *      ?match[spec_version]=...
     */
    @Type(() => MatchDto)
    match?: MatchDto;


    /**
     * If match[version] was passed, then we need to retrieve all versions of the object so the resultant array can
     * be filtered by match[version]. This is because filtering occurs after the objects are retrieved from the repo.
     * So, if we were to only retrieve the latest object from the repo, and the user wants a specific version, then
     * we run the risk of the latest object not matching the specified match[version] query parameter. This is why
     * we need to get ALL available versions for the given object in the event that match[version] is specified; the
     * matching object will be searched for by the FilterService after retrieval from the object repo.
     *
     * TL;DR
     *  - If match[version] is passed, then getAllVersions will be true, thus making the stixObjectRepo return all
     *    versions of the object.
     *  - If match[version] is not passed, then getAllVersions will be false, thus making the stixObjectRepo return
     *    only the latest version of the object.
     */
    versions: boolean;


    /**
     * Default constructor
     * @param options
     */
    constructor(options?: ObjectFiltersOptions) {
        Object.assign(this, options);
        this.versions = !!this.match;  // see JSDoc description for `versions` above
    }

}