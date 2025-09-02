import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inventory } from './inventory.entity';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { UpdateInventoryQuantityDto } from './dto/update-inventory-quantity.dto';
import { UserRole } from '../users/users.entity';

@Injectable()
export class InventoryService {
  constructor(@InjectRepository(Inventory) private inventoryRepo: Repository<Inventory>) {}

  async getInventory(user: any) {
    // All roles can view inventory
    return this.inventoryRepo.find();
  }

  // async createInventoryItem(createInventoryItemDto: CreateInventoryItemDto, user: any) {
  //   if (user.role !== UserRole.STAFF) {
  //     throw new ForbiddenException('Only staff can add inventory items');
  //   }

  //   const inventoryItem = this.inventoryRepo.create(createInventoryItemDto);
  //   return this.inventoryRepo.save(inventoryItem);
  // }

    async createInventoryItem(createInventoryItemDto: CreateInventoryItemDto, staff=UserRole.STAFF) {
    if (staff !== UserRole.STAFF) {
      throw new ForbiddenException('Only staff can add inventory items');
    }

    const inventoryItem = this.inventoryRepo.create(createInventoryItemDto);
    return this.inventoryRepo.save(inventoryItem);
  }

  // async updateInventoryQuantity(id: number, updateInventoryQuantityDto: UpdateInventoryQuantityDto, user: any) {
  //   if (user.role !== UserRole.CHEF) {
  //     throw new ForbiddenException('Only chefs can update inventory quantities');
  //   }

  //   const inventoryItem = await this.inventoryRepo.findOne({ where: { id } });
  //   if (!inventoryItem) {
  //     throw new NotFoundException('Inventory item not found');
  //   }

  //   inventoryItem.quantity += updateInventoryQuantityDto.quantity;
  //   return this.inventoryRepo.save(inventoryItem);
  // }

    async updateInventoryQuantity(id: number, updateInventoryQuantityDto: UpdateInventoryQuantityDto, chef=UserRole.CHEF) {
    if (chef !== UserRole.CHEF) {
      throw new ForbiddenException('Only chefs can update inventory quantities');
    }

    const inventoryItem = await this.inventoryRepo.findOne({ where: { id } });
    if (!inventoryItem) {
      throw new NotFoundException('Inventory item not found');
    }
    console.log(inventoryItem.quantity, updateInventoryQuantityDto.quantity);
    if( inventoryItem.quantity + updateInventoryQuantityDto.quantity < 0) {
      throw new ForbiddenException('Insufficient inventory quantity');
    }

    inventoryItem.quantity += updateInventoryQuantityDto.quantity;
    return this.inventoryRepo.save(inventoryItem);
  }

  // async deleteInventoryItem(id: number, user: any) {
  //   if (user.role !== UserRole.STAFF) {
  //     throw new ForbiddenException('Only staff can delete inventory items');
  //   }

  //   const inventoryItem = await this.inventoryRepo.findOne({ where: { id } });
  //   if (!inventoryItem) {
  //     throw new NotFoundException('Inventory item not found');
  //   }

  //   return this.inventoryRepo.remove(inventoryItem);
  // }

  async deleteInventoryItem(id: number,  staff=UserRole.STAFF) {
    if (staff !== UserRole.STAFF) {
      throw new ForbiddenException('Only staff can delete inventory items');
    }

    const inventoryItem = await this.inventoryRepo.findOne({ where: { id } });
    if (!inventoryItem) {
      throw new NotFoundException('Inventory item not found');
    }

    return this.inventoryRepo.remove(inventoryItem);
  }


  async getInventoryItem(id: number, user: any) {
    // All roles can view inventory items
    const inventoryItem = await this.inventoryRepo.findOne({ where: { id } });
    if (!inventoryItem) {
      throw new NotFoundException('Inventory item not found');
    }
    return inventoryItem;
  }

  async updateInventoryItem(id: number, updateInventoryItemDto: CreateInventoryItemDto, user: any) {
    // if (user.role !== UserRole.STAFF) {
    //   throw new ForbiddenException('Only staff can update inventory items');
    // }

    const inventoryItem = await this.inventoryRepo.findOne({ where: { id } });
    if (!inventoryItem) {
      throw new NotFoundException('Inventory item not found');
    }

    Object.assign(inventoryItem, updateInventoryItemDto);
    return this.inventoryRepo.save(inventoryItem);
  }
}