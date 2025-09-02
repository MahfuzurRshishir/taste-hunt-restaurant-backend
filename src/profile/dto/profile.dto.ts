import { IsString, IsEmail, IsOptional, MinLength, IsNumber } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  fullName?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @MinLength(6)
  @IsOptional()
  password?: string;

  @IsNumber()
  @IsOptional()
  id: number; 


  @IsString()
  @IsOptional()
  profilePicture?: string;
}
