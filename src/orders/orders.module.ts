import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { Order } from './orders.entity';
import { AuthModule } from '../auth/auth.module'; // Import AuthModule


@Module({
  imports: [TypeOrmModule.forFeature([Order]), AuthModule], // Import AuthModule here
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}