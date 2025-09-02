import { IsString, IsNotEmpty, IsNumber, IsArray, ValidateNested, IsPositive, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

class OrderItemDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsPositive()
  quantity: number;

  @IsNumber()
  @IsPositive()
  price: number;
}

export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto) // Transform each item into an instance of OrderItemDto
  items: OrderItemDto[];

  @IsNumber()
  @IsPositive()
  @IsOptional()
  totalPrice: number;

  @IsString()
  @IsOptional()
  customerName: string;

  @IsNumber()
  assignedToId: number; // ID of the chef who will cook the order
}