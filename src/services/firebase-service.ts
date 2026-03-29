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
  orderBy,
  getDocs
} from 'firebase/firestore';
import { 
  addDocumentNonBlocking, 
  updateDocumentNonBlocking 
} from '@/firebase';
import { OrderStatus, Product, OrderItem, Order } from '@/lib/types';

/**
 * Service layer for all Firebase Firestore operations.
 */
export const FirebaseService = {
  // --- Orders ---
  
  placeOrder: (db: Firestore, customerId: string, customerName: string, product: Product, quantity: number = 1) => {
    const ordersRef = collection(db, 'orders');
    const orderData = {
      customerId: customerId,
      userId: customerId, 
      customerName: customerName || 'Valued Customer',
      sellerId: product.sellerId || 'system-seller', 
      items: [{ 
        productId: product.id, 
        productName: product.name, 
        quantity: quantity, 
        priceAtOrder: product.price 
      }],
      total: product.price * quantity, 
      totalAmount: product.price * quantity,
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

  requestPayment: (db: Firestore, orderId: string) => {
    const orderRef = doc(db, 'orders', orderId);
    updateDocumentNonBlocking(orderRef, { 
      paymentStatus: 'pending_approval',
      updatedAt: serverTimestamp()
    });
  },

  confirmPayment: async (db: Firestore, order: Order) => {
    const orderRef = doc(db, 'orders', order.id);
    
    updateDocumentNonBlocking(orderRef, { 
      paymentStatus: 'paid', 
      status: 'completed',
      updatedAt: serverTimestamp()
    });

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
    const productsRef = collection(db, 'products');
    const existing = await getDocs(query(productsRef, limit(1)));
    if (!existing.empty) return;

    const inventory = [
      {
        name: "Infinity Bridal Ring Set (925 Silver)",
        sku: "JW-R-INF-SS",
        description: "Elegant 925 Sterling Silver eternity band paired with a brilliant solitaire engagement ring.",
        price: 8800,
        currentStock: 12,
        category: "Rings",
        sellerId: sellerId,
        lowStockThreshold: 5,
        averageDailySales: 0.2,
        leadTimeDays: 7,
        itemType: 'product' as const
      },
      {
        name: "Infinity Bridal Ring Set (14K Gold)",
        sku: "JW-R-INF-YG",
        description: "Timeless 14K Yellow Gold eternity band and solitaire engagement ring set.",
        price: 32000,
        currentStock: 8,
        category: "Rings",
        sellerId: sellerId,
        lowStockThreshold: 3,
        averageDailySales: 0.1,
        leadTimeDays: 14,
        itemType: 'product' as const
      },
      {
        name: "Maasai Beaded Choker (Handcrafted)",
        sku: "JW-N-MAA-BEAD",
        description: "Authentic handcrafted Maasai beadwork in traditional bold patterns.",
        price: 3500,
        currentStock: 15,
        category: "Necklaces",
        sellerId: sellerId,
        lowStockThreshold: 5,
        averageDailySales: 0.5,
        leadTimeDays: 3,
        itemType: 'product' as const
      }
    ];

    for (const item of inventory) {
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
      where('participants', '==', [...participants].sort()),
      orderBy('createdAt', 'asc'),
      limit(100)
    );
  },

  getConversationsQuery: (db: Firestore, userId: string) => {
    return query(
      collection(db, 'messages'),
      where('participants', 'array-contains', userId),
      limit(500)
    );
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
      limit(200)
    );
  }
};
