import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../users/users.entity';

@Entity()
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('json')
  items: { name: string; quantity: number; price: number }[];

  @Column('decimal', { precision: 10, scale: 2 })
  totalPrice: number;

  @Column()
  customerName: string;

  @Column({ default: 'pending' }) // pending, preparing, completed
  status: string;

  @Column({ default: 'unpaid' }) // unpaid, paid
  paymentStatus: string;

  @ManyToOne(() => User, (user) => user.assignedOrders)
  assignedBy: User; // Staff who assigns the order

  @ManyToOne(() => User, (user) => user.cookingOrders)
  assignedToCook: User; // Chef who will cook the order

  @CreateDateColumn()
  createdAt: Date;
}