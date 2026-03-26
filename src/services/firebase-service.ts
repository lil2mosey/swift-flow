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
 * Decouples business logic from UI components.
 */

export const FirebaseService = {
  // --- Orders ---
  
  /** Places a new order from a customer */
  placeOrder: (db: Firestore, customerId: string, profile: UserProfile | null, product: Product) => {
    const ordersRef = collection(db, 'orders');
    return addDocumentNonBlocking(ordersRef, {
      customerId: customerId,
      customerName: profile?.fullName || 'Anonymous Customer',
      sellerId: 'system-seller', // Shared ID for the store admin
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

  /** Manually adds an order (e.g., from Instagram DM) */
  addManualOrder: (db: Firestore, sellerId: string, orderDetails: {
    customerName: string;
    customerPhone: string;
    deliveryLocation: string;
    items: OrderItem[];
    totalAmount: number;
  }) => {
    const ordersRef = collection(db, 'orders');
    return addDocumentNonBlocking(ordersRef, {
      sellerId: sellerId,
      customerId: 'manual-dm',
      customerName: orderDetails.customerName,
      customerPhone: orderDetails.customerPhone,
      deliveryLocation: orderDetails.deliveryLocation,
      totalAmount: orderDetails.totalAmount,
      status: 'pending',
      paymentStatus: 'unpaid',
      items: orderDetails.items,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  },

  /** Adds a new product to the inventory */
  addProduct: (db: Firestore, productData: Omit<Product, 'id'>) => {
    const productsRef = collection(db, 'products');
    return addDocumentNonBlocking(productsRef, {
      ...productData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  },

  /** Updates the fulfillment status of an order */
  updateOrderStatus: (db: Firestore, orderId: string, status: OrderStatus) => {
    const orderRef = doc(db, 'orders', orderId);
    updateDocumentNonBlocking(orderRef, { 
      status, 
      updatedAt: new Date().toISOString() 
    });
  },

  /** Marks an order as paid and completed */
  processPayment: (db: Firestore, orderId: string) => {
    const orderRef = doc(db, 'orders', orderId);
    updateDocumentNonBlocking(orderRef, { 
      paymentStatus: 'paid', 
      status: 'completed',
      updatedAt: new Date().toISOString()
    });
  },

  // --- Queries ---

  /** 
   * Query for seller's orders. 
   * For the SwiftFlow prototype, we allow sellers to see all orders in the shared pool.
   */
  getSellerOrdersQuery: (db: Firestore, sellerId: string) => {
    return query(
      collection(db, 'orders'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
  },

  /** Query for customer's orders */
  getCustomerOrdersQuery: (db: Firestore, customerId: string) => {
    return query(
      collection(db, 'orders'),
      where('customerId', '==', customerId),
      orderBy('createdAt', 'desc')
    );
  },

  /** Query for product catalog */
  getProductsQuery: (db: Firestore) => {
    return query(collection(db, 'products'), limit(100));
  }
};
