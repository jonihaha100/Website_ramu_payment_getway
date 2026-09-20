import { mockOrders } from "./mockOrders";
import { coffees } from "./coffees";

export type NotificationType = 'ORDER' | 'PRODUCT' | 'B2B_SAMPLE';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  date: string;
  isRead: boolean;
  link?: string;
}

export function getNotifications(): AppNotification[] {
  const notifications: AppNotification[] = [];

  // 1. Generate Order Notifications (Pending orders)
  const pendingOrders = mockOrders.filter(o => o.status === 'Pending');
  pendingOrders.forEach(order => {
    notifications.push({
      id: `notif-order-${order.id}`,
      type: 'ORDER',
      title: 'New Order Received',
      message: `Order ${order.id} from ${order.customerName} is pending.`,
      date: order.date,
      isRead: false,
      link: '/admin/orders'
    });
  });

  // 2. Generate Product Notifications (Low Stock < 20)
  const lowStockCoffees = coffees.filter(c => c.stock < 20);
  lowStockCoffees.forEach(coffee => {
    notifications.push({
      id: `notif-stock-${coffee.id}`,
      type: 'PRODUCT',
      title: 'Low Stock Alert',
      message: `${coffee.name} is running low on stock (${coffee.stock} left).`,
      date: new Date().toISOString(), // Use current time for stock alerts
      isRead: false,
      link: '/admin/products'
    });
  });

  // 3. Add Mock B2B Sample Requests
  notifications.push({
    id: 'notif-b2b-1',
    type: 'B2B_SAMPLE',
    title: 'New B2B Sample Request',
    message: 'Senja Kopi requested a sample box.',
    date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    isRead: false,
  });

  notifications.push({
    id: 'notif-b2b-2',
    type: 'B2B_SAMPLE',
    title: 'New B2B Sample Request',
    message: 'Kopitagram wants to try Toraja Anaerobic.',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    isRead: true, // Mark one as read for visual testing
  });

  // Sort by date descending
  return notifications.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
