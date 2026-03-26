export type UserRole = 'seller' | 'customer';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  createdAt: string;
  updatedAt: string;
}

export type InventoryItemType = 'product' | 'material';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  cost?: number;
  currentStock: number;
  sku: string;
  imageUrl?: string;
  category: string;
  location?: string;
  supplier?: string;
  lowStockThreshold?: number;
  criticalThreshold?: number;
  averageDailySales: number;
  leadTimeDays: number;
  itemType?: InventoryItemType;
}

export interface OrderItem {
  productId?: string;
  productName: string;
  quantity: number;
  priceAtOrder: number;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'pending_approval' | 'paid';

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  deliveryLocation?: string;
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
