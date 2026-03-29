'use client';

import { 
  collection, 
  doc, 
  query, 
  where, 
  limit, 
  Firestore,
  serverTimestamp
} from 'firebase/firestore';
import { 
  addDocumentNonBlocking, 
  updateDocumentNonBlocking 
} from '@/firebase';
import { OrderStatus, Product, OrderItem } from '@/lib/types';

/**
 * Service layer for all Firebase Firestore operations.
 * Queries are kept simple (no orderBy) to avoid index requirements during rapid prototyping.
 */

export const FirebaseService = {
  // --- Orders ---
  
  placeOrder: (db: Firestore, customerId: string, customerName: string, product: Product) => {
    const ordersRef = collection(db, 'orders');
    const orderData = {
      customerId: customerId,
      userId: customerId, 
      customerName: customerName || 'Valued Customer',
      sellerId: product.sellerId || 'system-seller', 
      items: [{ 
        productId: product.id, 
        productName: product.name, 
        quantity: 1, 
        priceAtOrder: product.price 
      }],
      total: product.price, 
      totalAmount: product.price,
      status: 'pending',
      paymentStatus: 'unpaid',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    return addDocumentNonBlocking(ordersRef, orderData);
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
      userId: sellerId, 
      customerId: 'manual-dm',
      customerName: orderDetails.customerName,
      customerPhone: orderDetails.customerPhone,
      deliveryLocation: orderDetails.deliveryLocation,
      total: orderDetails.totalAmount, 
      totalAmount: orderDetails.totalAmount,
      status: orderDetails.status || 'pending',
      paymentStatus: orderDetails.paymentStatus || 'unpaid',
      items: orderDetails.items,
      createdAt: orderDetails.createdAt || serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  },

  addProduct: (db: Firestore, sellerId: string, productData: Omit<Product, 'id' | 'sellerId'>) => {
    const productsRef = collection(db, 'products');
    return addDocumentNonBlocking(productsRef, {
      ...productData,
      sellerId: sellerId,
      itemType: productData.itemType || 'product',
      isActive: true, 
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  },

  seedJewelryCatalog: async (db: Firestore, sellerId: string) => {
    const jewelryItems = [
      {
        name: "Eternity Diamond Band",
        sku: "JW-R-001",
        description: "Handcrafted 24K gold band set with premium VVS diamonds.",
        price: 125000,
        currentStock: 5,
        category: "Rings",
        imageUrl: "https://picsum.photos/seed/ring1/600/600",
        lowStockThreshold: 2,
        criticalThreshold: 1,
        averageDailySales: 0.1,
        leadTimeDays: 14,
        itemType: 'product' as const
      },
      {
        name: "Midnight Sapphire Pendant",
        sku: "JW-N-002",
        description: "Elegant deep blue sapphire surrounded by a halo of white gold.",
        price: 48000,
        currentStock: 12,
        category: "Necklaces",
        imageUrl: "https://picsum.photos/seed/neck1/600/600",
        lowStockThreshold: 5,
        criticalThreshold: 2,
        averageDailySales: 0.3,
        leadTimeDays: 10,
        itemType: 'product' as const
      },
      {
        name: "Pearl Essence Drop Earrings",
        sku: "JW-E-003",
        description: "Lustrous freshwater pearls on 18K rose gold settings.",
        price: 18500,
        currentStock: 25,
        category: "Earrings",
        imageUrl: "https://picsum.photos/seed/ear1/600/600",
        lowStockThreshold: 10,
        criticalThreshold: 5,
        averageDailySales: 0.8,
        leadTimeDays: 7,
        itemType: 'product' as const
      },
      {
        name: "Rose Gold Tennis Bracelet",
        sku: "JW-B-004",
        description: "Continuous sparkle with perfectly matched pink-hued diamonds.",
        price: 75000,
        currentStock: 8,
        category: "Bracelets",
        imageUrl: "https://picsum.photos/seed/brac1/600/600",
        lowStockThreshold: 3,
        criticalThreshold: 1,
        averageDailySales: 0.2,
        leadTimeDays: 12,
        itemType: 'product' as const
      },
      {
        name: "Vintage Emerald Studs",
        sku: "JW-E-005",
        description: "Deep green Colombian emeralds in a classic vintage square cut.",
        price: 55000,
        currentStock: 4,
        category: "Earrings",
        imageUrl: "https://picsum.photos/seed/ear2/600/600",
        lowStockThreshold: 2,
        criticalThreshold: 1,
        averageDailySales: 0.1,
        leadTimeDays: 20,
        itemType: 'product' as const
      }
    ];

    for (const item of jewelryItems) {
      await FirebaseService.addProduct(db, sellerId, item);
    }
  },

  updateOrderStatus: (db: Firestore, orderId: string, status: OrderStatus) => {
    const orderRef = doc(db, 'orders', orderId);
    updateDocumentNonBlocking(orderRef, { 
      status, 
      updatedAt: serverTimestamp() 
    });
  },

  requestPayment: (db: Firestore, orderId: string) => {
    const orderRef = doc(db, 'orders', orderId);
    updateDocumentNonBlocking(orderRef, { 
      paymentStatus: 'pending_approval',
      updatedAt: serverTimestamp()
    });
  },

  confirmPayment: (db: Firestore, orderId: string) => {
    const orderRef = doc(db, 'orders', orderId);
    updateDocumentNonBlocking(orderRef, { 
      paymentStatus: 'paid', 
      status: 'completed',
      updatedAt: serverTimestamp()
    });
  },

  // --- Messages ---

  sendMessage: (db: Firestore, senderId: string, receiverId: string, content: string, senderName: string) => {
    const messagesRef = collection(db, 'messages');
    return addDocumentNonBlocking(messagesRef, {
      senderId,
      receiverId,
      content,
      senderName,
      participants: [senderId, receiverId].sort(),
      createdAt: serverTimestamp()
    });
  },

  getMessagesQuery: (db: Firestore, participants: string[]) => {
    return query(
      collection(db, 'messages'),
      where('participants', '==', participants.sort()),
      limit(100)
    );
  },

  // For sellers to find all customers they've chatted with
  getConversationsQuery: (db: Firestore, sellerId: string) => {
    return query(
      collection(db, 'messages'),
      where('participants', 'array-contains', sellerId),
      limit(500)
    );
  },

  // --- Queries ---

  getSellerOrdersQuery: (db: Firestore) => {
    return query(
      collection(db, 'orders'),
      limit(200)
    );
  },

  getCustomerOrdersQuery: (db: Firestore, customerId: string) => {
    // For "access everything" requested by user, we can return all orders or specific customer orders
    return query(
      collection(db, 'orders'),
      where('customerId', '==', customerId),
      limit(100)
    );
  },

  getProductsQuery: (db: Firestore) => {
    return query(
      collection(db, 'products'), 
      limit(200)
    );
  }
};
