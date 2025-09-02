import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Order } from '../orders/orders.entity';

export enum UserRole {
  STAFF = 'staff',
  CHEF = 'chef',
  CASHIER = 'cashier',
  ADMIN = 'admin',
}

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  fullName: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.STAFF })
  role: UserRole;

  @Column({ nullable: true })
  profilePicture: string;

  @Column({ nullable: true }) // New column for storing CV file path
  cvPath: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Order, (order) => order.assignedBy)
  assignedOrders: Order[]; // Orders assigned by this user (staff)

  @OneToMany(() => Order, (order) => order.assignedToCook)
  cookingOrders: Order[];
}