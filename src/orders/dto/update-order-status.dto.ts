import { IsString, IsIn, IsNotEmpty, IsNumber } from 'class-validator';

export class UpdateOrderStatusDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['preparing', 'completed'], { message: 'Status must be either "preparing" or "completed"' })
  status: string; // preparing, completed


  
  @IsNotEmpty()
  @IsNumber()
  id: number; // ID of the order to be updated
}