'use client';

import { 
  collection, 
  doc, 
  query, 
  where, 
  orderBy, 
  limit, 
  Firestore
} from 'firebase/firestore';
import { 
  addDocumentNonBlocking, 
  updateDocumentNonBlocking 
} from '@/firebase';
import { OrderStatus, Product, UserProfile, OrderItem } from '@/lib/types';

/**
 * Service layer for all Firebase Firestore operations.
 */

export const FirebaseService = {
  // --- Orders ---
  
  /**
   * Places a new order from the storefront.
   * @param customerName Passed directly to avoid "Anonymous" during race conditions.
   */
  placeOrder: (db: Firestore, customerId: string, customerName: string, product: Product) => {
    const ordersRef = collection(db, 'orders');
    return addDocumentNonBlocking(ordersRef, {
      customerId: customerId,
      userId: customerId, // Step 4 consistency
      customerName: customerName || 'Valued Customer',
      sellerId: product.sellerId || 'system-seller', 
      items: [{ 
        productId: product.id, 
        productName: product.name, 
        quantity: 1, 
        priceAtOrder: product.price 
      }],
      totalAmount: product.price,
      status: 'pending',
      paymentStatus: 'unpaid',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  },

  addManualOrder: (db: Firestore, sellerId: string, orderDetails: {
    customerName: string;
    customerPhone: string;
    deliveryLocation: string;
    items: OrderItem[];
    totalAmount: number;
    createdAt?: string;
    status?: OrderStatus;
    paymentStatus?: 'unpaid' | 'pending_approval' | 'paid';
  }) => {
    const ordersRef = collection(db, 'orders');
    return addDocumentNonBlocking(ordersRef, {
      sellerId: sellerId,
      customerId: 'manual-dm',
      userId: 'manual-dm',
      customerName: orderDetails.customerName,
      customerPhone: orderDetails.customerPhone,
      deliveryLocation: orderDetails.deliveryLocation,
      totalAmount: orderDetails.totalAmount,
      status: orderDetails.status || 'pending',
      paymentStatus: orderDetails.paymentStatus || 'unpaid',
      items: orderDetails.items,
      createdAt: orderDetails.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  },

  addProduct: (db: Firestore, sellerId: string, productData: Omit<Product, 'id' | 'sellerId'>) => {
    const productsRef = collection(db, 'products');
    return addDocumentNonBlocking(productsRef, {
      ...productData,
      sellerId: sellerId,
      itemType: productData.itemType || 'product',
      isActive: true, 
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  },

  updateOrderStatus: (db: Firestore, orderId: string, status: OrderStatus) => {
    const orderRef = doc(db, 'orders', orderId);
    updateDocumentNonBlocking(orderRef, { 
      status, 
      updatedAt: new Date().toISOString() 
    });
  },

  requestPayment: (db: Firestore, orderId: string) => {
    const orderRef = doc(db, 'orders', orderId);
    updateDocumentNonBlocking(orderRef, { 
      paymentStatus: 'pending_approval',
      updatedAt: new Date().toISOString()
    });
  },

  confirmPayment: (db: Firestore, orderId: string) => {
    const orderRef = doc(db, 'orders', orderId);
    updateDocumentNonBlocking(orderRef, { 
      paymentStatus: 'paid', 
      status: 'completed',
      updatedAt: new Date().toISOString()
    });
  },

  // --- Queries ---

  getSellerOrdersQuery: (db: Firestore) => {
    return query(
      collection(db, 'orders'),
      orderBy('createdAt', 'desc'),
      limit(200)
    );
  },

  getCustomerOrdersQuery: (db: Firestore, customerId: string) => {
    return query(
      collection(db, 'orders'),
      where('customerId', '==', customerId),
      orderBy('createdAt', 'desc'),
      limit(100)
    );
  },

  getProductsQuery: (db: Firestore) => {
    return query(
      collection(db, 'products'), 
      where('isActive', '==', true),
      orderBy('createdAt', 'desc'),
      limit(200)
    );
  }
};
