import { IsString, IsEmail, IsNotEmpty, MinLength, IsOptional} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  
  @IsOptional()
  @IsString()
  role?: string;
}
