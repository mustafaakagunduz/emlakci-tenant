import { IsNotEmpty, IsString } from 'class-validator';

export class CreatePhotoDto {
  @IsString()
  @IsNotEmpty()
  cloudinaryPublicId!: string;

  @IsString()
  @IsNotEmpty()
  url!: string;
}
