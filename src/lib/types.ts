export type UserRole = 'seller' | 'customer';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currentStock: number;
  sku: string;
  imageUrl?: string;
  category: string;
  averageDailySales: number;
  leadTimeDays: number;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  priceAtOrder: number;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'paid';

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  sellerId: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: any;
  updatedAt: any;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  createdAt: any;
}
