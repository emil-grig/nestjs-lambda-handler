// import { Transform, Type } from 'class-transformer';
// import { IsOptional, IsString, ValidateNested } from 'class-validator';

// class P02 {
//   @IsString()
//   @IsOptional()
//   distributionDeliveryURI?: string;
// }

// class CustomBlock {
//   @ValidateNested({ each: true }) // Validate each item in the array
//   @Transform(({ value }) => value, { toClassOnly: true }) // Map `P02List` in JSON to `p02List`
//   @Type(() => P02) // Transform each item into an AddressDto instance
//   p02List: P02[];
// }

// export class Pub047 {
//   @ValidateNested()
//   @Transform(({ value }) => value.CustomBlock, { toClassOnly: true }) // Map `CustomBlock` to `customBlock`
//   @Type(() => CustomBlock)
//   customBlock: CustomBlock;
// }

import { Expose, Transform, Type } from 'class-transformer';
import { IsOptional, IsString, ValidateNested } from 'class-validator';

class P02 {
  distributionDeliveryURI?: string;
}

class CustomBlock {
  @Expose()
  get p02List() {
    return this.P02List;
  }

  P02List: P02[];
}

export class Pub047 {
  @Expose()
  get customBlock() {
    return this.CustomBlock;
  }

  CustomBlock: CustomBlock;
}
