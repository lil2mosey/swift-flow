'use client';

import { 
  collection, 
  doc, 
  query, 
  where, 
  orderBy, 
  limit, 
  Timestamp,
  Firestore,
  CollectionReference
} from 'firebase/firestore';
import { 
  addDocumentNonBlocking, 
  updateDocumentNonBlocking 
} from '@/firebase';
import { Order, OrderStatus, Product, UserProfile } from '@/lib/types';

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
      sellerId: 'system-seller', // In a multi-seller app, this would be product.sellerId
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
  addManualOrder: (db: Firestore, sellerId: string) => {
    const ordersRef = collection(db, 'orders');
    return addDocumentNonBlocking(ordersRef, {
      sellerId: sellerId,
      customerId: 'manual-dm',
      customerName: 'Instagram DM Customer',
      totalAmount: 500,
      status: 'pending',
      paymentStatus: 'unpaid',
      items: [{ productName: 'Manual Entry Item', quantity: 1, priceAtOrder: 500 }],
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

  /** Query for seller's orders */
  getSellerOrdersQuery: (db: Firestore, sellerId: string) => {
    return query(
      collection(db, 'orders'),
      where('sellerId', '==', sellerId),
      orderBy('createdAt', 'desc'),
      limit(20)
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
    return query(collection(db, 'products'), limit(12));
  }
};
