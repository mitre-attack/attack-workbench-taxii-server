// import {StixObjectDto} from "../stix";
import {Exclude} from "class-transformer";
import {ApiProperty} from "@nestjs/swagger";
import {SwaggerDocumentation as SWAGGER} from "./envelope.dto.swagger.json";
import {StixObjectPropertiesInterface} from "../../../../../stix/dto/interfaces/stix-object-properties.interface";

/**
 * This class represents LinkedNode<Array<StixObjectDto>>. Its only purpose is to feed Swagger. There are no
 * underlying/mechanical dependencies on this class. Swagger reports this DTO/schema rather than LinkedNode<T>.
 *
 * LinkedNode<T> is a generic data structure that is used by both the ManifestService and EnvelopeService to serve
 * manifest resources and envelope resources, respectively. It was impractical to implement a solution that properly
 * serializes the response body AND reports the proper schema to Swagger because LinkedNode reflects both the envelope
 * resource and the manifest resource. To simplify things, instead:
 *  - EnvelopeService returns instances of LinkedNode<Array<StixObjectDto>> (i.e., envelope resources)
 *  - Controller methods that return envelope resources are annotated with @ApiResponse({ type: EnvelopeDto })
 *  - ManifestService returns instances of LinkedNode<Array<ManifestRecordDto>>
 *  - Controller methods that return manifest resources are annotated with @ApiResponse({ type: ManifestDto }
 *
 *  There are no mechanical relationships (i.e. polymorphism, inheritance) forcing consistency between EnvelopeDto,
 *  ManifestDto, and LinkedNode. Therefore, it is possible for someone to modify LinkedNode in a way that changes the
 *  response schema/body properties, and simultaneously forget to make the corresponding modifications to EnvelopeDto
 *  and/or ManifestDto to reflect the new schema, effectively resulting in a reporting fallacy in Swagger; a user may see
 *  in Swagger that method "GetEnvelope" (for example) returns an instance of EnvelopeDto, but in reality the method
 *  actually returns a different schema altogether.
 */
@Exclude()
export class EnvelopeDto {

    @ApiProperty({
        description: SWAGGER.Objects.description,
        type: SWAGGER.Objects.type,
        required: SWAGGER.Objects.required,
        name: "objects"
    })
    objects: StixObjectPropertiesInterface[];

    @ApiProperty({
        description: SWAGGER.More.description,
        type: SWAGGER.More.type,
        required: SWAGGER.More.required
    })
    more: boolean;

    @ApiProperty({
        description: SWAGGER.Next.description,
        type: SWAGGER.Next.type,
        required: SWAGGER.Next.required
    })
    next: string;
}