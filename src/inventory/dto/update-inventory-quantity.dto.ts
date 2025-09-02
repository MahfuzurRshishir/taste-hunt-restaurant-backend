import {  IsNotEmpty, MinLength, IsNumber} from 'class-validator';

export class UpdateInventoryQuantityDto {
    @IsNumber()
    @IsNotEmpty()
    id: number;

    @IsNumber()
    @IsNotEmpty()
    @MinLength(0)
    quantity: number;
  }