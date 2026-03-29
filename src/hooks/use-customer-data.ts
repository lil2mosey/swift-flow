
'use client';

import { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { 
  collection, 
  query, 
  where,
  limit, 
  onSnapshot,
} from 'firebase/firestore';
import { Product, Order } from '@/lib/types';

/**
 * Real-time hook for fetching products that are in stock and classified as finished goods.
 */
export function useCustomerProducts(maxLimit = 24) {
  const db = useFirestore();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    if (!db) return;

    // Filter products that are "Finished Goods" (product) and have stock > 0
    // Note: This query may require a composite index (itemType, currentStock) in production
    const q = query(
      collection(db, 'products'),
      where('itemType', '==', 'product'),
      where('currentStock', '>', 0),
      limit(maxLimit)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const productsData = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      })) as Product[];
      setProducts(productsData);
      setIsLoading(false);
      setError(null);
    }, (err) => {
      console.error('Error in useCustomerProducts listener:', err);
      setError(err);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [db, maxLimit]);

  return { products, isLoading, error, hasMore: false, loadMore: () => {} };
}

/**
 * Real-time hook for fetching customer orders history.
 */
export function useCustomerOrders() {
  const db = useFirestore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    if (!db) return;

    const q = query(
      collection(db, 'orders'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      })) as Order[];
      setOrders(ordersData);
      setIsLoading(false);
      setError(null);
    }, (err) => {
      setError(err);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [db]);

  return { orders, isLoading, error };
}
