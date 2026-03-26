
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

  /** Adds a new inventory item (Product or Raw Material) */
  addProduct: (db: Firestore, productData: Omit<Product, 'id'>) => {
    const productsRef = collection(db, 'products');
    return addDocumentNonBlocking(productsRef, {
      ...productData,
      itemType: productData.itemType || 'product',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  },

  /** 
   * Professional Seeder for Raw Materials
   * Maps exactly to the Item Name, SKU, Location, Stock, Value headers.
   */
  seedRawMaterials: async (db: Firestore) => {
    const materialsRef = collection(db, 'products');
    const existing = await getDocs(query(materialsRef, where('itemType', '==', 'material'), limit(1)));
    
    if (!existing.empty) {
      return { success: false, message: 'Raw materials already exist in database.' };
    }

    const rawMaterials = [
      { name: '925 Sterling Silver Grain', sku: 'MET-SIL-01', category: 'Metals', location: 'Shelf A-101', currentStock: 500, price: 4500, itemType: 'material', supplier: 'Nairobi Metals', description: 'High purity silver casting grain' },
      { name: '18K Gold Wire', sku: 'MET-GLD-02', category: 'Metals', location: 'Safe-A1', currentStock: 50, price: 12000, itemType: 'material', supplier: 'Mombasa Bullion', description: 'Dead soft gold wire for wrapping' },
      { name: 'Rose Gold Sheet', sku: 'MET-RGD-03', category: 'Metals', location: 'Safe-B1', currentStock: 100, price: 15000, itemType: 'material', supplier: 'Eldoret Refiners', description: '0.50mm thickness rose gold sheet' },
      { name: 'Stainless Steel Clasps', sku: 'FIND-SS-04', category: 'Findings', location: 'Drawer-1', currentStock: 200, price: 800, itemType: 'material', supplier: 'Global Supplies', description: 'Hypoallergenic steel clasps' },
      { name: 'Lobster Clasps - Silver', sku: 'FIND-LOB-05', category: 'Findings', location: 'Drawer-1', currentStock: 150, price: 1200, itemType: 'material', supplier: 'Artisan Hub', description: 'Sterling silver lobster claw clasps' },
      { name: 'Jump Rings 4mm', sku: 'FIND-JMP-06', category: 'Findings', location: 'Drawer-2', currentStock: 500, price: 500, itemType: 'material', supplier: 'Artisan Hub', description: 'Open jump rings for assembly' },
      { name: 'Cubic Zirconia 5mm', sku: 'GEM-ZIR-07', category: 'Gemstones', location: 'Box-C2', currentStock: 100, price: 2500, itemType: 'material', supplier: 'Jewel Mart', description: 'Round cut clear CZ stones' },
      { name: 'Freshwater Pearls AAA', sku: 'GEM-PRL-08', category: 'Gemstones', location: 'Box-C1', currentStock: 50, price: 3500, itemType: 'material', supplier: 'Lamu Pearl Co.', description: 'Grade AAA white freshwater pearls' },
      { name: 'Natural Onyx Cabochons', sku: 'GEM-ONY-09', category: 'Gemstones', location: 'Box-C3', currentStock: 30, price: 4200, itemType: 'material', supplier: 'Stone Depot', description: '8mm round natural onyx' },
      { name: 'Silk Thread Spools', sku: 'SUP-THR-10', category: 'Supplies', location: 'Shelf B-201', currentStock: 10, price: 1500, itemType: 'material', supplier: 'Tailor Supplies', description: 'High strength silk thread' },
      { name: 'Jewelry Polishing Cloths', sku: 'SUP-CLT-11', category: 'Supplies', location: 'Shelf B-202', currentStock: 20, price: 1800, itemType: 'material', supplier: 'Clean Jeweler', description: 'Two-stage polishing cloths' },
      { name: 'Silver Solder Paste', sku: 'SUP-SLD-12', category: 'Supplies', location: 'Shelf A-102', currentStock: 5, price: 2200, itemType: 'material', supplier: 'Nairobi Metals', description: 'Medium temperature silver solder' },
      { name: 'Earring Backs - Silver', sku: 'FIND-EAR-13', category: 'Findings', location: 'Drawer-3', currentStock: 300, price: 1000, itemType: 'material', supplier: 'Artisan Hub', description: 'Butterfly style earring backs' },
      { name: 'Beaded Wire - 0.5mm', sku: 'FIND-WIR-14', category: 'Findings', location: 'Shelf B-203', currentStock: 5, price: 1300, itemType: 'material', supplier: 'Wire Craft', description: 'Flexible nylon coated wire' },
      { name: 'Jewelry Glue - E6000', sku: 'SUP-GLU-15', category: 'Supplies', location: 'Shelf B-204', currentStock: 8, price: 900, itemType: 'material', supplier: 'Adhesives Ltd', description: 'Industrial strength jewelry adhesive' },
    ];

    for (const item of rawMaterials) {
      addDocumentNonBlocking(materialsRef, {
        ...item,
        averageDailySales: 0,
        leadTimeDays: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    return { success: true, message: `Successfully seeded ${rawMaterials.length} raw materials.` };
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
    return query(collection(db, 'products'), limit(200));
  }
};
