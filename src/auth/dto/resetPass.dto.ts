import { IsString, IsNumber, MinLength, MaxLength } from 'class-validator';

export class ResetPassDto {
  @IsString()
  @MinLength(6)
  @MaxLength(20)
  newPassword: string;

  @IsNumber()
  otp: number;
}