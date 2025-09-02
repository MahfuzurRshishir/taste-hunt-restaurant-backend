import { Controller, Get, Post, Patch, Body, Param, UseGuards, Req, Delete, Put} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { UpdateInventoryQuantityDto } from './dto/update-inventory-quantity.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserRole } from 'src/users/users.entity';

@Controller('inventory')
@UseGuards(JwtAuthGuard)
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  @Get('items')
  async getInventory(@Req() req: any) {
    return this.inventoryService.getInventory(req.user);
  }
  @Post('addItem')
  async createInventoryItem(@Body() createInventoryItemDto: CreateInventoryItemDto, @Req() req: any) {
    return this.inventoryService.createInventoryItem(createInventoryItemDto, req.user);   //this line of code is actual logic,,turned off for testing

  }

  @Patch('/quantity/:id')
  async updateInventoryQuantity(@Param('id') id: number, @Body() updateInventoryQuantityDto: UpdateInventoryQuantityDto, @Req() req: any) {
    return this.inventoryService.updateInventoryQuantity(id, updateInventoryQuantityDto, req.user);
  }

  @Delete('delete/:id')
  async deleteInventoryItem(@Param('id') id: number, @Req() req: any) {
    return this.inventoryService.deleteInventoryItem(id, req.user);
  }

  @Get('item/:id')
  async getInventoryItem(@Param('id') id: number, @Req() req: any) {
    return this.inventoryService.getInventoryItem(id, req.user);
  }

  @Put('update/:id')
  async updateInventoryItem(@Param('id') id: number, @Body() updateInventoryItemDto: CreateInventoryItemDto, @Req() req: any) {
    return this.inventoryService.updateInventoryItem(id, updateInventoryItemDto, req.user);
  }
}