'use client';

import { 
  collection, 
  doc, 
  query, 
  where, 
  limit, 
  Firestore,
  serverTimestamp,
  increment,
  writeBatch
} from 'firebase/firestore';
import { 
  addDocumentNonBlocking, 
  updateDocumentNonBlocking 
} from '@/firebase';
import { OrderStatus, Product, OrderItem, Order } from '@/lib/types';

/**
 * Service layer for all Firebase Firestore operations.
 * Enhanced with robust inventory synchronization.
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
    createdAt?: any;
    status?: OrderStatus;
    paymentStatus?: 'unpaid' | 'pending_approval' | 'paid';
    customerId?: string;
  }) => {
    const ordersRef = collection(db, 'orders');
    return addDocumentNonBlocking(ordersRef, {
      sellerId: sellerId,
      userId: orderDetails.customerId || sellerId, 
      customerId: orderDetails.customerId || 'manual-dm',
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

  confirmPayment: async (db: Firestore, order: Order) => {
    const orderRef = doc(db, 'orders', order.id);
    
    // 1. Update order status to paid and completed
    updateDocumentNonBlocking(orderRef, { 
      paymentStatus: 'paid', 
      status: 'completed',
      updatedAt: serverTimestamp()
    });

    // 2. Reduce inventory stock for each item in the order
    if (order.items && order.items.length > 0) {
      order.items.forEach(item => {
        if (item.productId) {
          const productRef = doc(db, 'products', item.productId);
          updateDocumentNonBlocking(productRef, {
            currentStock: increment(-item.quantity),
            updatedAt: serverTimestamp()
          });
        }
      });
    }
  },

  // --- Products & Inventory ---

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

  seedKenyaJewelry: async (db: Firestore, sellerId: string) => {
    // Inventory (Finished Goods)
    const inventory = [
      {
        name: "Infinity Bridal Ring Set (925 Silver)",
        sku: "JW-R-INF",
        description: "Elegant 925 Sterling Silver eternity band paired with a brilliant solitaire engagement ring.",
        price: 8800,
        currentStock: 8,
        category: "Rings",
        imageUrl: "https://picsum.photos/seed/ring1/600/600",
        lowStockThreshold: 3,
        criticalThreshold: 1,
        averageDailySales: 0.2,
        leadTimeDays: 7,
        itemType: 'product' as const
      },
      {
        name: "Handcrafted Maasai Beaded Choker",
        sku: "JW-N-MAA",
        description: "Authentic Kenyan Maasai beadwork. Intricate patterns representing strength and unity.",
        price: 3500,
        currentStock: 15,
        category: "Necklaces",
        imageUrl: "https://picsum.photos/seed/neck1/600/600",
        lowStockThreshold: 5,
        criticalThreshold: 2,
        averageDailySales: 0.5,
        leadTimeDays: 3,
        itemType: 'product' as const
      },
      {
        name: "Pure Gold Men's Wedding Band (10K)",
        sku: "JW-R-GLD",
        description: "Classic polished 10K yellow gold band. Durable and timeless for the modern gentleman.",
        price: 48000,
        currentStock: 4,
        category: "Rings",
        imageUrl: "https://picsum.photos/seed/goldband/600/600",
        lowStockThreshold: 2,
        criticalThreshold: 1,
        averageDailySales: 0.1,
        leadTimeDays: 14,
        itemType: 'product' as const
      },
      {
        name: "Hammered Brass Statement Earrings",
        sku: "JW-E-BRS",
        description: "Bold, lightweight earrings handcrafted from recycled brass. A unique fashion statement.",
        price: 1800,
        currentStock: 20,
        category: "Earrings",
        imageUrl: "https://picsum.photos/seed/ear1/600/600",
        lowStockThreshold: 10,
        criticalThreshold: 5,
        averageDailySales: 1.2,
        leadTimeDays: 5,
        itemType: 'product' as const
      },
      {
        name: "Raw Rose Quartz Stacking Ring",
        sku: "JW-R-ROSE",
        description: "Natural rose quartz stone set on a minimal silver band. Promotes love and healing.",
        price: 6000,
        currentStock: 3,
        category: "Rings",
        imageUrl: "https://picsum.photos/seed/rose/600/600",
        lowStockThreshold: 5,
        criticalThreshold: 2,
        averageDailySales: 0.4,
        leadTimeDays: 10,
        itemType: 'product' as const
      }
    ];

    // Raw Materials
    const materials = [
      {
        name: "925 Sterling Silver Grain",
        sku: "MET-SIL-01",
        description: "Premium silver casting grain for jewelry production.",
        price: 150,
        currentStock: 500,
        category: "Metals",
        location: "Safe-A1",
        itemType: 'material' as const,
        averageDailySales: 0,
        leadTimeDays: 10
      },
      {
        name: "18K Yellow Gold Wire (1.0mm)",
        sku: "MET-GLD-18K",
        description: "Half-hard gold wire for jewelry wrapping.",
        price: 6500,
        currentStock: 45,
        category: "Metals",
        itemType: 'material' as const,
        averageDailySales: 0,
        leadTimeDays: 14
      },
      {
        name: "Loose Round Amethyst (6mm)",
        sku: "GEM-AMY-06",
        description: "Vibrant purple amethyst gemstones.",
        price: 450,
        currentStock: 60,
        category: "Stones",
        location: "Drawer-B2",
        itemType: 'material' as const,
        averageDailySales: 0,
        leadTimeDays: 20
      }
    ];

    for (const item of inventory) {
      await FirebaseService.addProduct(db, sellerId, item);
    }
    for (const item of materials) {
      await FirebaseService.addProduct(db, sellerId, item);
    }
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
