// import {IdentifierDto} from "src/common/models/identifier";
// import {IsOptional, IsString, ValidateNested} from "class-validator";
// import {Exclude, Expose, Type} from "class-transformer";
// import {ApiProperty} from "@nestjs/swagger";
// import {SwaggerDocumentation as SWAGGER} from "./stix-bundle.dto.swagger.json";
// import {StixObjectDto} from "../object";
//
//
// /**
//  * A Bundle is a collection of arbitrary STIX Objects grouped together in a single container. A Bundle does not have any
//  * semantic meaning and the objects contained within the Bundle are not considered related by virtue of being in the same
//  * Bundle.
//  *
//  * A STIX Bundle Object is not a STIX Object but makes use of the type and id Common Properties. A Bundle is transient,
//  * and implementations SHOULD NOT assume that other implementations will treat it as a persistent object or keep any
//  * custom properties found on the bundle itself.
//  *
//  * The JSON MTI serialization uses the JSON Object type [RFC8259] when representing bundle.
//  */
// @Exclude()
// export class StixBundleDto {
//
//     constructor(partial: Partial<Object>) {
//         Object.assign(this, partial);
//     }
//
//
//     @ApiProperty({
//         description: SWAGGER.Type.description,
//         required: SWAGGER.Type.required,
//         type: SWAGGER.Type.type
//     })
//     @Expose()
//     @IsString()
//     type: string;
//
//
//     @ApiProperty({
//         description: SWAGGER.Id.description,
//         required: SWAGGER.Id.required,
//         type: SWAGGER.Id.type
//     })
//     @Expose()
//     @ValidateNested()
//     id: IdentifierDto;
//
//
//     @ApiProperty({
//         description: SWAGGER.Objects.description,
//         required: SWAGGER.Objects.required,
//         type: SWAGGER.Objects.type
//     })
//     @IsOptional()
//     @Expose()
//     @Type(() => StixObjectDto)
//     objects?: Array<StixObjectDto>
// }
