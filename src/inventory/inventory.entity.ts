import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export enum Status {
  
  CASHIER = 'cashier',
}

@Entity()
export class Inventory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column('int')
  quantity: number;

  @Column()
  unit: string; // e.g., kg, liters, pieces

  @Column({ nullable: true })
  description: string;


}