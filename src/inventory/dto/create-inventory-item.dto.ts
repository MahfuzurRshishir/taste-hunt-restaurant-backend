import { IsString, IsNotEmpty, MinLength, IsOptional, IsNumber} from 'class-validator';


export class CreateInventoryItemDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsNumber()
    @IsNotEmpty()
    @MinLength(0)
    quantity: number;

    @IsString()
    @IsNotEmpty()

    unit: string;

    @IsOptional() 
    @IsString()
    description?: string;
  }