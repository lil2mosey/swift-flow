
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
 * Simplified query to avoid the requirement for composite indexes.
 */
export function useCustomerProducts(maxLimit = 24) {
  const db = useFirestore();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    if (!db) return;

    // We only query by itemType (equality) to avoid needing a composite index for range/sorting
    const q = query(
      collection(db, 'products'),
      where('itemType', '==', 'product'),
      limit(maxLimit * 2) // Fetch a bit more to account for out-of-stock items filtered on client
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const productsData = snapshot.docs
        .map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        })) as Product[];
      
      // Filter by stock level on the client side to bypass index requirements
      const inStockProducts = productsData
        .filter(p => (p.currentStock || 0) > 0)
        .slice(0, maxLimit);

      setProducts(inStockProducts);
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
 * Simplified to avoid index errors on where + orderBy.
 */
export function useCustomerOrders() {
  const db = useFirestore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    if (!db) return;

    // Use a basic query without orderBy to avoid index requirements during prototyping
    const q = query(
      collection(db, 'orders'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      })) as Order[];
      
      // Sort on the client side
      const sortedOrders = [...ordersData].sort((a, b) => {
        const dateA = a.createdAt?.seconds || 0;
        const dateB = b.createdAt?.seconds || 0;
        return dateB - dateA;
      });

      setOrders(sortedOrders);
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
