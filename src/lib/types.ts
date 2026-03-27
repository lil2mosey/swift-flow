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
  sellerId?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
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
  userId: string; // Matches field in security rules
  customerName: string;
  customerPhone?: string;
  deliveryLocation?: string;
  sellerId: string;
  items: OrderItem[];
  total: number; // Matches field in security rules validation
  totalAmount: number; // Keep for backward compatibility in UI
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: any;
  updatedAt: any;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string; // Updated to match rules
  text?: string; // Keep for backward compatibility
  createdAt: any;
}
