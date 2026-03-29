
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
  getDocs,
  setDoc,
  Timestamp
} from 'firebase/firestore';
import { 
  addDocumentNonBlocking, 
  updateDocumentNonBlocking 
} from '@/firebase';
import { OrderStatus, Product, OrderItem, Order, Conversation } from '@/lib/types';

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

  // --- Conversations & Inquiries ---

  findOrCreateConversation: async (db: Firestore, customerId: string, sellerId: string, item: Product, customerName: string) => {
    const convsRef = collection(db, 'conversations');
    const participants = [customerId, sellerId].sort();
    
    // Check if contextual conversation already exists for this specific item
    const q = query(
      convsRef, 
      where('participants', '==', participants),
      where('itemId', '==', item.id),
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return snapshot.docs[0].id;
    }

    // Create new conversation
    const newConvRef = doc(convsRef);
    await setDoc(newConvRef, {
      participants,
      itemId: item.id,
      itemName: item.name,
      customerName: customerName,
      lastMessage: 'Inquiry started',
      timestamp: serverTimestamp(),
    });

    return newConvRef.id;
  },

  sendChatMessage: (db: Firestore, convId: string, senderId: string, text: string) => {
    const messagesRef = collection(db, 'conversations', convId, 'messages');
    const convRef = doc(db, 'conversations', convId);

    // Add message to sub-collection
    addDocumentNonBlocking(messagesRef, {
      senderId,
      text,
      createdAt: serverTimestamp()
    });

    // Update conversation metadata
    updateDocumentNonBlocking(convRef, {
      lastMessage: text,
      timestamp: serverTimestamp()
    });
  },

  getInquiriesQuery: (db: Firestore, userId: string) => {
    return query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', userId),
      orderBy('timestamp', 'desc'),
      limit(50)
    );
  },

  getChatMessagesQuery: (db: Firestore, convId: string) => {
    return query(
      collection(db, 'conversations', convId, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(100)
    );
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
        name: "Pure Gold Eternity Band (18K)",
        sku: "JW-R-PURE-18K",
        description: "Solid 18K gold band, perfectly polished for a lifetime of wear.",
        price: 45000,
        currentStock: 5,
        category: "Rings",
        sellerId: sellerId,
        lowStockThreshold: 2,
        averageDailySales: 0.05,
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
