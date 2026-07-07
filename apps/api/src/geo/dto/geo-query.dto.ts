import { IsOptional, IsString } from 'class-validator';

export class ProvincesQueryDto {
  @IsOptional()
  @IsString()
  q?: string;
}

export class DistrictsQueryDto {
  @IsString()
  province!: string;

  @IsOptional()
  @IsString()
  q?: string;
}

export class NeighborhoodsQueryDto {
  @IsString()
  province!: string;

  @IsString()
  district!: string;

  @IsOptional()
  @IsString()
  q?: string;
}

export class ForwardGeocodeQueryDto {
  @IsString()
  province!: string;

  @IsString()
  district!: string;

  @IsOptional()
  @IsString()
  neighborhood?: string;

  @IsOptional()
  @IsString()
  street?: string;
}

export class StreetsQueryDto {
  @IsString()
  province!: string;

  @IsString()
  district!: string;

  @IsString()
  neighborhood!: string;

  @IsOptional()
  @IsString()
  q?: string;
}
