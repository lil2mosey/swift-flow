
export type UserRole = 'seller' | 'customer';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  firstName?: string;
  lastName?: string;
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
  userId: string; 
  customerName: string;
  customerPhone?: string;
  deliveryLocation?: string;
  sellerId: string;
  items: OrderItem[];
  total: number; 
  totalAmount: number; 
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: any;
  updatedAt: any;
}

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage: string;
  timestamp: any;
  itemId: string;
  itemName: string;
  customerName?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  createdAt: any;
}
