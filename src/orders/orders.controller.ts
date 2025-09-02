import { Controller, Post, Get, Patch, Body, Param, Query, UseGuards, Req, ForbiddenException, Res } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Response } from 'express';


@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private ordersService: OrdersService) { }

  @Post('createNew')
  async createOrder(@Body() createOrderDto: CreateOrderDto, @Req() req: any) {
    return this.ordersService.createOrder(createOrderDto, req.user);
  }

  @Get()
  async getOrders(@Req() req: any) {
    const loggedInUser = req.user;
    console.log('Logged in user:', loggedInUser);
    return this.ordersService.getOrders(loggedInUser);
  }

  @Patch('status')
  async updateOrderStatus(@Body() updateOrderStatusDto: UpdateOrderStatusDto, @Req() req: any) {
    return this.ordersService.updateOrderStatus(updateOrderStatusDto, req.user);
  }

  @Patch('payment')
  async updatePaymentStatus(@Body() updatePaymentStatusDto: UpdatePaymentStatusDto, @Req() req: any) {
    return this.ordersService.updatePaymentStatus(updatePaymentStatusDto, req.user);
  }

  @Get('receipt')
  async downloadReceipt(@Body() updatePaymentStatus, @Res() res: Response, @Req() req: any) {
    const user = req.user;

    // Ensure only cashiers can download receipts
    if (user.role !== 'admin') {
      throw new ForbiddenException('You are not allowed to download receipts');
    }

    const receipt = await this.ordersService.generateReceipt(updatePaymentStatus.id);

    // Set headers for file download
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=order-receipt-${updatePaymentStatus.id}.pdf`,
    });

    // Send the receipt as a PDF
    res.send(receipt);
  }

  @Get('report')
  async downloadReport(
    @Query('range') range: string, // e.g., 'day', 'week', 'month', etc.
    @Res() res: Response,
    @Req() req: any,
  ) {
    const user = req.user;

    // Ensure only cashiers and chefs can download reports
    if (user.role !== 'cashier' && user.role !== 'chef') {
      throw new ForbiddenException('You are not allowed to download reports');
    }

    const report = await this.ordersService.generateReport(range, user);

    // Set headers for file download
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=order-report-${range}.pdf`,
    });

    // Send the report as a PDF
    res.send(report);
  }

  @Get('quantity-by-time')
  async getOrderQuantityByTime(@Req() req) {
    // req.user should be set by your auth middleware/guard
    return this.ordersService.getOrderQuantityByTime(req.user);
  }

  @Get('top-items-by-time')
  async getTopItemsByTime(@Req() req) {
    return this.ordersService.getTopItemsByTime(req.user);
  }

  @Get('dashboard-stats')
  async getDashboardStats(@Req() req) {
    return this.ordersService.getDashboardStats(req.user);
  }

  @Get('summary')
async getOrderSummary(@Req() req) {
  return this.ordersService.getOrderSummary(req.user);
}





}