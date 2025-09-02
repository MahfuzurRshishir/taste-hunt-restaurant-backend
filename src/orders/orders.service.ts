import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Order } from './orders.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';
import { User } from '../users/users.entity';
import { UserRole } from '../users/users.entity';
import * as PDFDocument from 'pdfkit';




@Injectable()
export class OrdersService {
  constructor(@InjectRepository(Order) private orderRepo: Repository<Order>) { }

  async createOrder(createOrderDto: CreateOrderDto, user: any) {
    const assignedToCook = await this.orderRepo.manager.findOne(User, { where: { id: createOrderDto.assignedToId, role: UserRole.CHEF } });
    if (!assignedToCook) {
      throw new NotFoundException('Chef not found');
    }

    const assignedBy = await this.orderRepo.manager.findOne(User, { where: { id: user.id, role: UserRole.STAFF } });
    if (!assignedBy) {
      throw new NotFoundException('Staff not found');
    }
    // Calculate totalPrice if not provided
    const totalPrice =
      createOrderDto.totalPrice ??
      createOrderDto.items.reduce(
        (sum, item) => sum + item.quantity * item.price,
        0,
      );


    // Set default customerName if not provided
    const customerName = createOrderDto.customerName || 'Guest';

    // Create the order
    const order = this.orderRepo.create({
      ...createOrderDto,
      totalPrice,
      customerName,
      assignedBy,
      assignedToCook,
    });
    console.log('Order created:', order);

    return this.orderRepo.save(order);
  }

  async getOrders(user: any) {
    if (user.role === 'cashier') {
      // Cashier can view all orders with full details
      return this.orderRepo.find({ relations: ['assignedBy', 'assignedToCook'] });
    } else if (user.role === 'chef') {
      // Chef can view only orders assigned to them
      return this.orderRepo.find({
        where: { assignedToCook: { id: user.id } },
        relations: ['assignedToCook'],
      });
    } else if (user.role === 'staff') {
      // Staff can view only orders they assigned
      return this.orderRepo.find({
        where: { assignedBy: { id: user.id } },
        relations: ['assignedBy'],
      });
    } else {
      throw new ForbiddenException('You are not allowed to view these orders');
    }
  }

  async updateOrderStatus(updateOrderStatusDto: UpdateOrderStatusDto, user: any) {
    const orderId = updateOrderStatusDto.id; // Assuming the DTO has an 'id' field for the order ID

    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    if (user.role !== 'chef') {
      throw new ForbiddenException('You are not allowed to update the order status');
    }
    order.status = updateOrderStatusDto.status;
    const saveOrder = this.orderRepo.save(order);
    return { "message": "Order status updated successfully", "status": order.status };
  }

  async updatePaymentStatus(updatePaymentStatusDto: UpdatePaymentStatusDto, user: any) {
    const orderId = updatePaymentStatusDto.id; // Assuming the DTO has an 'id' field for the order ID
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    if (user.role !== 'cashier') {
      throw new ForbiddenException('You are not allowed to update the payment status');
    }
    order.paymentStatus = updatePaymentStatusDto.paymentStatus;
    const savePayment = this.orderRepo.save(order);
    return { "message": "Payment status updated successfully", "paymentStatus": order.paymentStatus };
  }

  // Generate a PDF receipt for the order
  async generateReceipt(orderId: number): Promise<Buffer> {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['assignedBy', 'assignedToCook'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const totalPrice = Number(order.totalPrice);


    // Create a new PDF document
    const doc = new PDFDocument();
    const buffers: Buffer[] = [];

    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => { });

    // Add receipt content
    doc.fontSize(25).text('Taste Hunt Restaurant', { align: 'center' });
    doc.fontSize(20).text('Order Receipt', { align: 'center' });
    doc.fontSize(15).text(`Date: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown();

    doc.fontSize(14).text(`Order ID: ${order.id}`);
    doc.text(`Customer Name: ${order.customerName || 'Guest'}`);
    doc.moveDown();

    if (!Array.isArray(order.items)) {
      throw new Error('Order items are not valid');
    }

    doc.text('Items:', { underline: true });
    order.items.forEach((item, index) => {
      doc.text(
        `${index + 1}. ${item.name} - Quantity: ${item.quantity}, Price: $${item.price.toFixed(2)} , Total: $${(item.quantity * item.price).toFixed(2)}`,
      );
    });
    doc.moveDown();

    doc.text(`Payment Status: ${order.paymentStatus}`);
    doc.text(`Total Price: $${totalPrice.toFixed(2)}`);

    doc.end();

    // Return the PDF as a buffer
    return new Promise((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(buffers)));
    });
  }


  async generateReport(range: string, user: any): Promise<Buffer> {
    // Calculate the date range based on the input
    const now = new Date();
    let startDate: Date;

    switch (range) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        break;
      case '15days':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 15);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case '6months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        throw new Error('Invalid range');
    }

    // Fetch orders based on the user's role
    let orders;
    if (user.role === 'cashier') {
      orders = await this.orderRepo.find({
        where: { createdAt: Between(startDate, now) },
        relations: ['assignedBy', 'assignedToCook'],
      });
    } else if (user.role === 'chef') {
      orders = await this.orderRepo.find({
        where: { createdAt: Between(startDate, now), assignedToCook: { id: user.id } },
        relations: ['assignedToCook'],
      });
    }

    if (!orders || orders.length === 0) {
      throw new Error('No orders found for the specified range');
    }

    // Create a new PDF document
    const doc = new PDFDocument();
    const buffers: Buffer[] = [];

    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => { });

    // Add report content
    doc.fontSize(25).text('Taste Hunt Restaurant', { align: 'center' });
    doc.fontSize(20).text('Order Report', { align: 'center' });
    doc.fontSize(15).text(`Date Range: ${startDate.toLocaleDateString()} - ${now.toLocaleDateString()}`, { align: 'center' });
    doc.moveDown();

    let totalRevenue = 0;

    orders.forEach((order, index) => {
      doc.fontSize(14).text(`Order ${index + 1}:`);
      doc.text(`Order ID: ${order.id}`);
      doc.text(`Customer Name: ${order.customerName || 'Guest'}`);
      doc.text(`Payment Status: ${order.paymentStatus}`);
      doc.text(`Total Price: $${Number(order.totalPrice).toFixed(2)}`);
      doc.moveDown();

      totalRevenue += Number(order.totalPrice);
    });

    if (user.role === 'cashier') {
      doc.fontSize(16).text(`Total Revenue: $${totalRevenue.toFixed(2)}`, { align: 'right' });
    }

    doc.end();

    // Return the PDF as a buffer
    return new Promise((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(buffers)));
    });
  }

  async getOrderQuantityByTime(user: any) {
    if (user.role !== 'admin') {
      throw new ForbiddenException('You are not allowed to access order quantity by time');
    }

    const now = new Date();

    // Helper functions for grouping
    const getDayLabel = (date: Date) => {
      const hour = date.getHours();
      if (hour < 6) return '00:00';
      if (hour < 12) return '06:00';
      if (hour < 18) return '12:00';
      if (hour < 24) return '18:00';
      return '24:00';
    };
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const getWeekLabel = (date: Date) => weekDays[date.getDay()];
    const getMonthWeekLabel = (date: Date) => {
      const day = date.getDate();
      if (day <= 7) return 'W1';
      if (day <= 14) return 'W2';
      if (day <= 21) return 'W3';
      return 'W4';
    };
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Fetch all orders for the last year (for all ranges)
    const yearStart = new Date(now.getFullYear() - 1, 0, 1);
    const orders = await this.orderRepo.find({
      where: {
        createdAt: Between(yearStart, now),
      },
    });

    // Prepare buckets
    const dayBuckets = { '00:00': 0, '06:00': 0, '12:00': 0, '18:00': 0, '24:00': 0 };
    const weekBuckets = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
    const monthBuckets = { W1: 0, W2: 0, W3: 0, W4: 0 };
    const sixMonthLabels: string[] = [];
    const sixMonthBuckets: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const monthIdx = (now.getMonth() - i + 12) % 12;
      const label = months[monthIdx];
      sixMonthLabels.push(label);
      sixMonthBuckets[label] = 0;
    }
    const yearBuckets: Record<string, number> = {};
    yearBuckets[`${now.getFullYear() - 1}`] = 0;
    yearBuckets[`${now.getFullYear()}`] = 0;

    // Fill buckets
    orders.forEach(order => {
      const created = new Date(order.createdAt);

      // Day (today only)
      if (
        created.getFullYear() === now.getFullYear() &&
        created.getMonth() === now.getMonth() &&
        created.getDate() === now.getDate()
      ) {
        const label = getDayLabel(created);
        dayBuckets[label]++;
      }

      // Week (this week only)
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      if (created >= startOfWeek && created <= now) {
        const label = getWeekLabel(created);
        weekBuckets[label]++;
      }

      // Month (this month only)
      if (
        created.getFullYear() === now.getFullYear() &&
        created.getMonth() === now.getMonth()
      ) {
        const label = getMonthWeekLabel(created);
        monthBuckets[label]++;
      }

      // 6 months
      const sixMonthStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      if (created >= sixMonthStart && created <= now) {
        const label = months[created.getMonth()];
        if (sixMonthBuckets[label] !== undefined) sixMonthBuckets[label]++;
      }

      // Year (last year and this year)
      const yearLabel = `${created.getFullYear()}`;
      if (yearBuckets[yearLabel] !== undefined) yearBuckets[yearLabel]++;
    });

    // Format result
    return {
      day: Object.entries(dayBuckets).map(([label, count]) => ({ label, count })),
      week: weekDays.slice(1).concat('Sun').map(label => ({ label, count: weekBuckets[label] })),
      month: Object.entries(monthBuckets).map(([label, count]) => ({ label, count })),
      '6month': sixMonthLabels.map(label => ({ label, count: sixMonthBuckets[label] })),
      year: Object.entries(yearBuckets).map(([label, count]) => ({ label, count })),
    };
  }


  async getTopItemsByTime(user: any) {
    if (user.role !== 'admin') {
      throw new ForbiddenException('You are not allowed to access this resource');
    }

    const now = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Helper: get start dates for each range
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(todayStart.getDate() - todayStart.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const sixMonthStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const yearStart = new Date(now.getFullYear() - 1, 0, 1);

    // Fetch all orders for the last year
    const orders = await this.orderRepo.find({
      where: { createdAt: Between(yearStart, now) },
    });

    // Helper to count items in a date range
    function countItems(start: Date, end: Date) {
      const itemMap: Record<string, number> = {};
      orders.forEach(order => {
        const created = new Date(order.createdAt);
        if (created >= start && created <= end) {
          let items: { name: string; quantity: number }[] = [];
          try {
            items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
          } catch {
            // skip invalid
          }
          items.forEach(item => {
            if (!item.name || !item.quantity) return;
            itemMap[item.name] = (itemMap[item.name] || 0) + Number(item.quantity);
          });
        }
      });
      // Convert to array and sort by quantity desc
      return Object.entries(itemMap)
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10); // top 10, adjust as needed
    }

    return {
      today: countItems(todayStart, now),
      week: countItems(weekStart, now),
      month: countItems(monthStart, now),
      '6months': countItems(sixMonthStart, now),
      year: countItems(yearStart, now),
    };
  }

async getDashboardStats(user: any) {
  if (user.role !== 'admin') {
    throw new ForbiddenException('You are not allowed to access this resource');
  }

  const now = new Date();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Helper: get start dates for each range
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  // Week starts on Monday
  const weekStart = new Date(todayStart);
  weekStart.setDate(todayStart.getDate() - ((todayStart.getDay() + 6) % 7));
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const sixMonthStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const yearStart = new Date(now.getFullYear() - 1, 0, 1);

  // Fetch all orders for the last year
  const orders = await this.orderRepo.find({
    where: { createdAt: Between(yearStart, now) },
  });

  // TODAY: 5 time slots (00:00, 06:00, 12:00, 18:00, 24:00)
  const todayLabels = ["00:00", "06:00", "12:00", "18:00", "24:00"];
  const todayRanges = [
    [0, 6],   // 00:00 - 05:59
    [6, 12],  // 06:00 - 11:59
    [12, 18], // 12:00 - 17:59
    [18, 24], // 18:00 - 23:59
    [24, 24], // 24:00 (edge, will always be 0)
  ];
  const todayPoints = todayLabels.map((label, idx) => {
    const [startHour, endHour] = todayRanges[idx];
    const slotStart = new Date(todayStart);
    slotStart.setHours(startHour, 0, 0, 0);
    const slotEnd = new Date(todayStart);
    slotEnd.setHours(endHour === 24 ? 23 : endHour - 1, 59, 59, 999);
    const slotOrders = orders.filter(o => {
      const d = new Date(o.createdAt);
      return d >= slotStart && d <= slotEnd && d >= todayStart && d <= now;
    });
    const customers = slotOrders.length;
    let products = 0, revenue = 0;
    slotOrders.forEach(o => {
      let items: { quantity?: number }[] = [];
      try {
        items = typeof o.items === 'string' ? JSON.parse(o.items) : o.items;
      } catch { }
      products += items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
      revenue += Number(o.totalPrice || 0);
    });
    return { label, customers, products, revenue };
  });
  const todayStats = {
    customers: todayPoints.reduce((sum, p) => sum + p.customers, 0),
    products: todayPoints.reduce((sum, p) => sum + p.products, 0),
    revenue: todayPoints.reduce((sum, p) => sum + p.revenue, 0),
  };

  // WEEK: Mon-Sun (Monday as start of week)
  const weekLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const weekPoints = weekLabels.map((label, idx) => {
    const slotStart = new Date(weekStart);
    slotStart.setDate(weekStart.getDate() + idx);
    slotStart.setHours(0, 0, 0, 0);
    const slotEnd = new Date(slotStart);
    slotEnd.setHours(23, 59, 59, 999);
    const slotOrders = orders.filter(o => {
      const d = new Date(o.createdAt);
      return d >= slotStart && d <= slotEnd && d <= now;
    });
    const customers = slotOrders.length;
    let products = 0, revenue = 0;
    slotOrders.forEach(o => {
      let items: { quantity?: number }[] = [];
      try {
        items = typeof o.items === 'string' ? JSON.parse(o.items) : o.items;
      } catch { }
      products += items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
      revenue += Number(o.totalPrice || 0);
    });
    return { label, customers, products, revenue };
  });
  const weekStats = {
    customers: weekPoints.reduce((sum, p) => sum + p.customers, 0),
    products: weekPoints.reduce((sum, p) => sum + p.products, 0),
    revenue: weekPoints.reduce((sum, p) => sum + p.revenue, 0),
  };

  // MONTH: 4 weeks (W1-W4), last week covers till end of month
  const monthLabels = ["W1", "W2", "W3", "W4"];
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const monthPoints = monthLabels.map((label, idx) => {
    const slotStart = new Date(monthStart);
    slotStart.setDate(1 + idx * 7);
    slotStart.setHours(0, 0, 0, 0);
    const slotEnd = new Date(monthStart);
    slotEnd.setDate(idx === 3 ? lastDayOfMonth : (idx + 1) * 7);
    slotEnd.setHours(23, 59, 59, 999);
    const slotOrders = orders.filter(o => {
      const d = new Date(o.createdAt);
      return d >= slotStart && d <= slotEnd && d.getMonth() === now.getMonth() && d <= now;
    });
    const customers = slotOrders.length;
    let products = 0, revenue = 0;
    slotOrders.forEach(o => {
      let items: { quantity?: number }[] = [];
      try {
        items = typeof o.items === 'string' ? JSON.parse(o.items) : o.items;
      } catch { }
      products += items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
      revenue += Number(o.totalPrice || 0);
    });
    return { label, customers, products, revenue };
  });
  const monthStats = {
    customers: monthPoints.reduce((sum, p) => sum + p.customers, 0),
    products: monthPoints.reduce((sum, p) => sum + p.products, 0),
    revenue: monthPoints.reduce((sum, p) => sum + p.revenue, 0),
  };

  // 6 MONTHS: last 6 months, labels are month names
  const sixMonthLabels: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const monthIdx = (now.getMonth() - i + 12) % 12;
    sixMonthLabels.push(months[monthIdx]);
  }
  const sixMonthPoints = sixMonthLabels.map((label, idx) => {
    const monthIdx = now.getMonth() - 5 + idx;
    const year = monthIdx < 0 ? now.getFullYear() - 1 : now.getFullYear();
    const realMonthIdx = (monthIdx + 12) % 12;
    const slotStart = new Date(year, realMonthIdx, 1, 0, 0, 0, 0);
    const slotEnd = new Date(year, realMonthIdx + 1, 0, 23, 59, 59, 999);
    const slotOrders = orders.filter(o => {
      const d = new Date(o.createdAt);
      return d >= slotStart && d <= slotEnd && d <= now;
    });
    const customers = slotOrders.length;
    let products = 0, revenue = 0;
    slotOrders.forEach(o => {
      let items: { quantity?: number }[] = [];
      try {
        items = typeof o.items === 'string' ? JSON.parse(o.items) : o.items;
      } catch { }
      products += items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
      revenue += Number(o.totalPrice || 0);
    });
    return { label, customers, products, revenue };
  });
  const sixMonthStats = {
    customers: sixMonthPoints.reduce((sum, p) => sum + p.customers, 0),
    products: sixMonthPoints.reduce((sum, p) => sum + p.products, 0),
    revenue: sixMonthPoints.reduce((sum, p) => sum + p.revenue, 0),
  };

  // YEAR: last 2 years, labels are years
  const yearLabels = [`${now.getFullYear() - 1}`, `${now.getFullYear()}`];
  const yearPoints = yearLabels.map((label, idx) => {
    const yearNum = Number(label);
    const slotStart = new Date(yearNum, 0, 1, 0, 0, 0, 0);
    const slotEnd = new Date(yearNum, 11, 31, 23, 59, 59, 999);
    const slotOrders = orders.filter(o => {
      const d = new Date(o.createdAt);
      return d >= slotStart && d <= slotEnd && d <= now;
    });
    const customers = slotOrders.length;
    let products = 0, revenue = 0;
    slotOrders.forEach(o => {
      let items: { quantity?: number }[] = [];
      try {
        items = typeof o.items === 'string' ? JSON.parse(o.items) : o.items;
      } catch { }
      products += items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
      revenue += Number(o.totalPrice || 0);
    });
    return { label, customers, products, revenue };
  });
  const yearStats = {
    customers: yearPoints.reduce((sum, p) => sum + p.customers, 0),
    products: yearPoints.reduce((sum, p) => sum + p.products, 0),
    revenue: yearPoints.reduce((sum, p) => sum + p.revenue, 0),
  };

  return {
    today: {
      stats: todayStats,
      points: todayPoints,
    },
    week: {
      stats: weekStats,
      points: weekPoints,
    },
    month: {
      stats: monthStats,
      points: monthPoints,
    },
    "6months": {
      stats: sixMonthStats,
      points: sixMonthPoints,
    },
    year: {
      stats: yearStats,
      points: yearPoints,
    },
  };
}

async getOrderSummary(user: any) {
  if (user.role !== 'admin') {
    throw new ForbiddenException('You are not allowed to access this resource');
  }

  const orders = await this.orderRepo.find();

  const totalOrders = orders.length;
  // Use a Set to count unique customer names (ignoring case and trimming)
  const customerSet = new Set<string>();
  let totalRevenue = 0;

  orders.forEach(order => {
    if (order.customerName) {
      customerSet.add(order.customerName.trim().toLowerCase());
    }
    totalRevenue += Number(order.totalPrice) || 0;
  });

  return {
    totalOrders,
    totalCustomers: customerSet.size,
    totalRevenue,
  };
}




}