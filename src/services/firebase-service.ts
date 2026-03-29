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
  getDocs,
  setDoc,
  orderBy
} from 'firebase/firestore';
import { 
  addDocumentNonBlocking, 
  updateDocumentNonBlocking 
} from '@/firebase';
import { OrderStatus, Product, OrderItem, Order } from '@/lib/types';

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

    const newConvRef = doc(convsRef);
    await setDoc(newConvRef, {
      participants,
      itemId: item.id,
      itemName: item.name,
      customerName: customerName,
      lastMessage: 'Inquiry started',
      status: 'unreplied',
      timestamp: serverTimestamp(),
    });

    return newConvRef.id;
  },

  findOrCreateGeneralConversation: async (db: Firestore, customerId: string, sellerId: string, customerName: string) => {
    const convsRef = collection(db, 'conversations');
    const participants = [customerId, sellerId].sort();
    
    const q = query(
      convsRef, 
      where('participants', '==', participants),
      where('itemId', '==', 'general'),
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return snapshot.docs[0].id;
    }

    const newConvRef = doc(convsRef);
    await setDoc(newConvRef, {
      participants,
      itemId: 'general',
      itemName: 'General Inquiry',
      customerName: customerName,
      lastMessage: 'Customer started a general chat',
      status: 'unreplied',
      timestamp: serverTimestamp(),
    });

    return newConvRef.id;
  },

  sendChatMessage: async (db: Firestore, convId: string, senderId: string, senderName: string, text: string, isSeller?: boolean) => {
    const messagesRef = collection(db, 'conversations', convId, 'messages');
    const convRef = doc(db, 'conversations', convId);

    const newStatus = isSeller ? 'replied' : 'unreplied';

    addDocumentNonBlocking(messagesRef, {
      senderId,
      senderName, 
      text,
      createdAt: serverTimestamp()
    });

    updateDocumentNonBlocking(convRef, {
      lastMessage: text,
      status: newStatus,
      timestamp: serverTimestamp()
    });
  },

  getInquiriesQuery: (db: Firestore, userId: string) => {
    return query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', userId),
      limit(100)
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
      // --- Finished Goods (Visible to Customer Shop) ---
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
        sku: "JW-R-INF-14K",
        description: "Premium 14K Yellow Gold variant of our signature bridal collection.",
        price: 32000,
        currentStock: 3,
        category: "Rings",
        sellerId: sellerId,
        lowStockThreshold: 2,
        averageDailySales: 0.05,
        leadTimeDays: 14,
        itemType: 'product' as const
      },
      {
        name: "Maasai Beaded Choker (Traditional Red)",
        sku: "JW-N-MAA-RED",
        description: "Authentic handcrafted Maasai beatwork in traditional bold red patterns.",
        price: 3500,
        currentStock: 15,
        category: "Necklaces",
        sellerId: sellerId,
        lowStockThreshold: 5,
        averageDailySales: 0.5,
        leadTimeDays: 3,
        itemType: 'product' as const
      },
      {
        name: "Savannah Hand-Hammered Brass Cuff",
        sku: "JW-B-SAV-BRS",
        description: "Brushed brass cuff featuring hand-hammered textures inspired by the Kenyan savannah.",
        price: 2800,
        currentStock: 20,
        category: "Bracelets",
        sellerId: sellerId,
        lowStockThreshold: 8,
        averageDailySales: 0.3,
        leadTimeDays: 4,
        itemType: 'product' as const
      },
      // --- Raw Materials (Seller Only, Detailed Workshop Stock) ---
      {
        name: "14K Gold Wire (0.5mm Round)",
        sku: "RM-GOLD-WIRE-05",
        description: "High-quality 14K Yellow Gold wire for custom jewelry fabrication and repairs.",
        price: 1200,
        currentStock: 50,
        category: "Precious Metals",
        sellerId: sellerId,
        lowStockThreshold: 10,
        averageDailySales: 0,
        leadTimeDays: 5,
        itemType: 'material' as const
      },
      {
        name: "Sterling Silver Sheet (0.8mm)",
        sku: "RM-SILV-SHEET-08",
        description: "Dead-soft sterling silver sheet, ideal for sawing, stamping, and bezel backplates.",
        price: 450,
        currentStock: 25,
        category: "Precious Metals",
        sellerId: sellerId,
        lowStockThreshold: 5,
        averageDailySales: 0,
        leadTimeDays: 7,
        itemType: 'material' as const
      },
      {
        name: "14K Gold Solder (Hard)",
        sku: "RM-GOLD-SOLD-H",
        description: "High-temperature gold solder for strong structural joins in 14K gold pieces.",
        price: 1800,
        currentStock: 10,
        category: "Soldering",
        sellerId: sellerId,
        lowStockThreshold: 3,
        averageDailySales: 0,
        leadTimeDays: 10,
        itemType: 'material' as const
      },
      {
        name: "Natural Blue Sapphire (5mm Round)",
        sku: "RM-GEMS-SAPPH-5",
        description: "Eye-clean natural blue sapphire, faceted round cut for premium solitaire settings.",
        price: 15000,
        currentStock: 5,
        category: "Gemstones",
        sellerId: sellerId,
        lowStockThreshold: 2,
        averageDailySales: 0,
        leadTimeDays: 20,
        itemType: 'material' as const
      },
      {
        name: "Fine Silver Bezel Wire (3mm)",
        sku: "RM-SILV-BEZEL-3",
        description: "Dead-soft fine silver wire specifically for creating professional gemstone bezels.",
        price: 320,
        currentStock: 40,
        category: "Findings",
        sellerId: sellerId,
        lowStockThreshold: 8,
        averageDailySales: 0,
        leadTimeDays: 5,
        itemType: 'material' as const
      },
      {
        name: "Jewelry Polishing Rouge (Red)",
        sku: "RM-SUPP-ROUGE-R",
        description: "Professional grade red rouge polishing compound for final high-luster finish.",
        price: 850,
        currentStock: 8,
        category: "Workshop Supplies",
        sellerId: sellerId,
        lowStockThreshold: 2,
        averageDailySales: 0,
        leadTimeDays: 14,
        itemType: 'material' as const
      },
      {
        name: "Ethically Sourced Kenyan Brass Bars",
        sku: "RM-MET-BRS-KEN",
        description: "Premium casting brass sourced locally, perfect for Savannah collection cuffs.",
        price: 150,
        currentStock: 100,
        category: "Base Metals",
        sellerId: sellerId,
        lowStockThreshold: 20,
        averageDailySales: 0,
        leadTimeDays: 7,
        itemType: 'material' as const
      }
    ];

    for (const item of inventory) {
      await FirebaseService.addProduct(db, sellerId, item);
    }
  },

  getSellerOrdersQuery: (db: Firestore) => {
    return query(collection(db, 'orders'), limit(200));
  },

  getCustomerOrdersQuery: (db: Firestore, customerId: string) => {
    return query(
      collection(db, 'orders'),
      where('customerId', '==', customerId),
      limit(100)
    );
  },

  getProductsQuery: (db: Firestore) => {
    return query(collection(db, 'products'), limit(200));
  }
};
