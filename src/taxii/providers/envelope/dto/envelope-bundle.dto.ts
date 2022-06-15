import { PaginationBundleInterface } from "src/taxii/providers/pagination/interfaces/pagination-bundle.interface";
import { EnvelopeDto } from "./envelope.dto";
import { Type } from "class-transformer";
import { ObjectFiltersDto } from "src/taxii/providers/filter/dto";
import { IdentifierDto } from "src/common/models/identifier";
import { StixObjectPropertiesInterface } from "src/stix/dto/interfaces/stix-object-properties.interface";

export class EnvelopeBundleDto
  implements PaginationBundleInterface<EnvelopeDto>
{
  id: string;

  size: number;

  @Type(() => EnvelopeDto)
  pages: EnvelopeDto[];

  meta: ObjectFiltersDto;

  constructor(id?: string, meta?: ObjectFiltersDto, pages?: EnvelopeDto[]) {
    this.id = id ? id : new IdentifierDto().toString(); // default to random UUID
    this.meta = meta;
    this.pages = pages ? pages : [];
    this.size = pages ? pages.length : 0;
  }

  findAll(): EnvelopeDto[] {
    return this.pages;
  }

  findOne(id: string): EnvelopeDto {
    for (let i = 0; i < this.pages.length; i++) {
      if (id === this.pages[i].id) {
        return this.pages[i];
      }
    }
    return undefined;
  }

  findAfter(addedAfter: string): EnvelopeDto {
    /**
     * Scenario 1 - added_after is used as a pagination mechanism
     * Iterate through the envelopes and check the last object in each envelope. If the last object's created
     * property matches $added_after, then we should return the next envelope.
     */
    for (let i = 0; i < this.pages.length; i++) {
      let curEnvelope: EnvelopeDto = this.pages[i];
      let curOldestObjectInEnvelope =
        curEnvelope.items[curEnvelope.items.length - 1].created;
      if (curOldestObjectInEnvelope == addedAfter) {
        /** If the date matches the supplied added_after query parameter, then try to serve the *next*
                 envelope after this one, because the user wants all objects after the specified added_after date **/
        if (curEnvelope.more) {
          /** Make sure we're not about to serve a null envelope because we've already reached the end
                     of the bundle **/
          return this.pages[i + 1];
        }
      }
    }
  }

  // pop(): EnvelopeDto {
  //     const envelope: EnvelopeDto = this.pages[0];  // pop the first envelope in the list
  //     this.pages = this.pages.slice(1); // update envelope count
  //     return envelope;
  // }

  push(objects: StixObjectPropertiesInterface[], delimiter?: number) {
    if (delimiter) {
      /**
       * The for-loop will slice up the array of STIX objects based on the delimiter and pass each slice to
       * the envelopeChain. The envelopeChain is a singly linked list, so each call to push() will result in a new
       * LinkedNode that ge5ts pushed onto the envelopeChain/linked list.
       */
      for (let i = 0; i <= objects.length - 1; i += delimiter) {
        /**
         * Get the next subset of STIX objects ready. They will be stored in a new envelope and pushed onto the
         * the 'objects' array. Set more=false and next=undefined because it will be the last envelope in the list
         */
        let stop: number = i + delimiter;
        let newEnvelope: EnvelopeDto = new EnvelopeDto({
          id: new IdentifierDto().toString(),
          more: false,
          next: undefined,
          items: objects.slice(i, stop),
        });
        if (this.pages.length > 0) {
          // If this is not the first envelope in the bundle, update prev before pushing the new envelope
          this.pages[this.pages.length - 1].more = true;
          this.pages[this.pages.length - 1].next = newEnvelope.id;
        }
        this.pages.push(newEnvelope);
        this.size++;
      }
    } else {
      // Just push all objects to one Envelope. No pagination required.
      const newEnvelope: EnvelopeDto = new EnvelopeDto({
        id: new IdentifierDto().toString(),
        more: false,
        next: undefined,
        items: objects,
      });

      // if this is not the first envelope in the bundle...
      if (this.pages.length > 0) {
        // Before pushing the new page onto the list of pages, update the last page to point to the new page
        this.pages[this.pages.length - 1].more = true;
        this.pages[this.pages.length - 1].next = newEnvelope.id;
      }
      this.pages.push(newEnvelope);
      this.size++;
    }
  }

  toString() {
    return JSON.stringify(this);
  }
}
