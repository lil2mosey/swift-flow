
'use client';

import { 
  collection, 
  doc, 
  query, 
  where, 
  orderBy, 
  limit, 
  Firestore,
  getDocs
} from 'firebase/firestore';
import { 
  addDocumentNonBlocking, 
  updateDocumentNonBlocking 
} from '@/firebase';
import { OrderStatus, Product, UserProfile, OrderItem, Order } from '@/lib/types';

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
      sellerId: 'system-seller', 
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
    createdAt?: string;
    status?: OrderStatus;
    paymentStatus?: 'unpaid' | 'paid';
  }) => {
    const ordersRef = collection(db, 'orders');
    return addDocumentNonBlocking(ordersRef, {
      sellerId: sellerId,
      customerId: 'manual-dm',
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

  // --- Seeding Logic ---

  /** Seeds the database with jewelry items and mock orders */
  seedDatabase: async (db: Firestore, sellerId: string) => {
    // 1. Check if products already exist to avoid duplicates
    const productSnap = await getDocs(query(collection(db, 'products'), limit(1)));
    if (!productSnap.empty) {
      throw new Error("Products collection already contains data. Seeding aborted to prevent duplicates.");
    }

    const jewelryItems = [
      { name: "Amani Moon Pendant", category: "Necklaces", price: 2200, material: "925 Sterling Silver", stone: "Zircon" },
      { name: "Infinity Band", category: "Rings", price: 1500, material: "18K Gold Plated", stone: "None" },
      { name: "Lulu Pearl Drops", category: "Earrings", price: 1800, material: "925 Sterling Silver", stone: "Freshwater Pearl" },
      { name: "Celestial Choker", category: "Necklaces", price: 2800, material: "Rose Gold", stone: "Zircon" },
      { name: "Onyx Statement Ring", category: "Rings", price: 3200, material: "Stainless Steel", stone: "Onyx" },
      { name: "Hoop Dreams", category: "Earrings", price: 950, material: "Stainless Steel", stone: "None" },
      { name: "Tennis Bracelet", category: "Bracelets", price: 4500, material: "18K Gold Plated", stone: "Zircon" },
      { name: "Minimalist Bangle", category: "Bracelets", price: 1200, material: "925 Sterling Silver", stone: "None" },
      { name: "Freshwater Charm", category: "Bracelets", price: 1600, material: "Rose Gold", stone: "Freshwater Pearl" },
      { name: "Midnight Studs", category: "Earrings", price: 800, material: "Stainless Steel", stone: "Onyx" },
      { name: "Gold Signet Ring", category: "Rings", price: 2100, material: "18K Gold Plated", stone: "None" },
      { name: "Silver Curb Chain", category: "Necklaces", price: 3500, material: "925 Sterling Silver", stone: "None" },
      { name: "Zircon Halo Ring", category: "Rings", price: 3800, material: "Rose Gold", stone: "Zircon" },
      { name: "Vintage Locket", category: "Necklaces", price: 1900, material: "Stainless Steel", stone: "None" },
      { name: "Pearl Threaders", category: "Earrings", price: 1400, material: "925 Sterling Silver", stone: "Freshwater Pearl" },
    ];

    // Seed Products
    for (const item of jewelryItems) {
      const stock = Math.floor(Math.random() * 30);
      FirebaseService.addProduct(db, {
        name: item.name,
        sku: `${item.category.slice(0, 1)}${Math.floor(100 + Math.random() * 900)}`,
        description: `Handcrafted ${item.name} made from ${item.material}. Features ${item.stone} detailing.`,
        price: item.price,
        cost: Math.floor(item.price * 0.4),
        currentStock: stock,
        location: "Warehouse A",
        category: item.category,
        supplier: "Musaa Global",
        lowStockThreshold: 5,
        criticalThreshold: 2,
        averageDailySales: Number((Math.random() * 2).toFixed(1)),
        leadTimeDays: 7,
      });
    }

    // Seed Orders (8 mock orders)
    const customers = ["Anita J.", "Kevin O.", "Sarah M.", "David K.", "Brenda W.", "John D.", "Mary P.", "Alice R."];
    const statuses: OrderStatus[] = ['pending', 'processing', 'completed'];

    for (let i = 0; i < 8; i++) {
      const amount = Math.floor(800 + Math.random() * 3700);
      const daysAgo = Math.floor(Math.random() * 7);
      const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
      const status = statuses[Math.floor(Math.random() * statuses.length)];

      FirebaseService.addManualOrder(db, sellerId, {
        customerName: customers[i],
        customerPhone: `07${Math.floor(10000000 + Math.random() * 90000000)}`,
        deliveryLocation: "Nairobi, Kenya",
        totalAmount: amount,
        status: status,
        paymentStatus: status === 'completed' ? 'paid' : 'unpaid',
        items: [{
          productName: "Jewelry Item",
          quantity: 1,
          priceAtOrder: amount
        }],
        createdAt: createdAt
      });
    }
  },

  // --- Queries ---

  /** Query for seller's orders. */
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
