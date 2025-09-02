import { IsString, IsIn, IsNotEmpty, IsNumber } from 'class-validator';

export class UpdatePaymentStatusDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['paid', 'unpaid'], { message: 'Payment status must be either "paid" or "unpaid"' })
  paymentStatus: string; // paid, unpaid

    @IsNotEmpty()
    @IsNumber()
    id: number;
}