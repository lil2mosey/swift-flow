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

    // Batch fetch existing items by SKU to ensure idempotent parallel sync
    const existingSnapshot = await getDocs(productsRef);
    const existingSkus = new Set(existingSnapshot.docs.map(doc => doc.data().sku));

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
      // --- Raw Materials (Seller Only, Detailed Jewelry Workshop Stock) ---
      {
        name: "24K Fine Gold Casting Grain",
        sku: "RM-GOLD-24K-GR",
        description: "Pure 24K gold grains for high-purity casting and custom alloying.",
        price: 9500,
        currentStock: 150,
        category: "Precious Metals",
        sellerId: sellerId,
        lowStockThreshold: 50,
        averageDailySales: 0,
        leadTimeDays: 5,
        itemType: 'material' as const
      },
      {
        name: "Sterling Silver Square Wire (1.5mm)",
        sku: "RM-SILV-WIRE-SQ15",
        description: "Half-hard sterling silver square wire, perfect for structural jewelry elements.",
        price: 180,
        currentStock: 200,
        category: "Precious Metals",
        sellerId: sellerId,
        lowStockThreshold: 40,
        averageDailySales: 0,
        leadTimeDays: 3,
        itemType: 'material' as const
      },
      {
        name: "18K Yellow Gold Bezel Wire (3mm)",
        sku: "RM-GOLD-BEZEL-18K",
        description: "Dead-soft 18K gold wire specifically for creating premium gemstone bezels.",
        price: 4500,
        currentStock: 25,
        category: "Precious Metals",
        sellerId: sellerId,
        lowStockThreshold: 10,
        averageDailySales: 0,
        leadTimeDays: 7,
        itemType: 'material' as const
      },
      {
        name: "Natural Blue Sapphire (4mm Round Cut)",
        sku: "RM-GEM-SAP-4RD",
        description: "AA Grade natural faceted blue sapphire for high-end solitaire and accent settings.",
        price: 8500,
        currentStock: 20,
        category: "Gemstones",
        sellerId: sellerId,
        lowStockThreshold: 5,
        averageDailySales: 0,
        leadTimeDays: 14,
        itemType: 'material' as const
      },
      {
        name: "Kenyan Emerald (5mm Trillion Cut)",
        sku: "RM-GEM-EME-5TR",
        description: "Vibrant ethically sourced Kenyan emerald with a unique trillion cut profile.",
        price: 12000,
        currentStock: 8,
        category: "Gemstones",
        sellerId: sellerId,
        lowStockThreshold: 3,
        averageDailySales: 0,
        leadTimeDays: 20,
        itemType: 'material' as const
      },
      {
        name: "14K Gold Solder (Hard - 2DWT)",
        sku: "RM-SOLD-GOLD-H",
        description: "Professional high-temperature 14K gold solder for durable jewelry joins.",
        price: 2800,
        currentStock: 15,
        category: "Soldering Supplies",
        sellerId: sellerId,
        lowStockThreshold: 5,
        averageDailySales: 0,
        leadTimeDays: 5,
        itemType: 'material' as const
      },
      {
        name: "Sterling Silver Paste Solder",
        sku: "RM-SOLD-SILV-PST",
        description: "Convenient paste solder with flux included for intricate sterling silver assemblies.",
        price: 650,
        currentStock: 30,
        category: "Soldering Supplies",
        sellerId: sellerId,
        lowStockThreshold: 10,
        averageDailySales: 0,
        leadTimeDays: 4,
        itemType: 'material' as const
      },
      {
        name: "Professional White Diamond Polishing Compound",
        sku: "RM-SUP-POL-WHT",
        description: "High-grade finishing compound for achieving a mirror-like high-luster on precious metals.",
        price: 1200,
        currentStock: 12,
        category: "Workshop Supplies",
        sellerId: sellerId,
        lowStockThreshold: 4,
        averageDailySales: 0,
        leadTimeDays: 10,
        itemType: 'material' as const
      },
      {
        name: "Borax Flux (Cone & Dish Set)",
        sku: "RM-SUP-FLX-BRX",
        description: "Traditional borax cone for preparing high-purity flux during precision soldering.",
        price: 450,
        currentStock: 50,
        category: "Workshop Supplies",
        sellerId: sellerId,
        lowStockThreshold: 15,
        averageDailySales: 0,
        leadTimeDays: 5,
        itemType: 'material' as const
      },
      {
        name: "Ethically Sourced Kenyan Brass Sheet (1mm)",
        sku: "RM-MET-BRS-10",
        description: "High-quality Kenyan brass sheet for Savannah collection bracelets and accessories.",
        price: 85,
        currentStock: 500,
        category: "Base Metals",
        sellerId: sellerId,
        lowStockThreshold: 100,
        averageDailySales: 0,
        leadTimeDays: 3,
        itemType: 'material' as const
      }
    ];

    // Filter missing items and add them in parallel for maximum speed
    const missingItems = inventory.filter(item => !existingSkus.has(item.sku));
    
    if (missingItems.length > 0) {
      await Promise.all(missingItems.map(item => FirebaseService.addProduct(db, sellerId, item)));
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

  getProductsQuery: (db: Firestore, sellerId?: string) => {
    if (sellerId) {
      return query(collection(db, 'products'), where('sellerId', '==', sellerId), limit(200));
    }
    return query(collection(db, 'products'), limit(200));
  }
};
