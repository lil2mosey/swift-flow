'use client';

import { useState, useEffect, useCallback } from 'react';
import { useFirestore, useUser } from '@/firebase';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  getDocs, 
  startAfter,
  DocumentData,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { measurePerformance } from '@/lib/performance';
import { Product, Order } from '@/lib/types';

/**
 * Optimized hook for fetching products with pagination and performance monitoring.
 * Query simplified to remove isActive filter to ensure seeded data appears without needing composite indexes.
 */
export function useCustomerProducts(pageSize = 12) {
  const db = useFirestore();
  const { user } = useUser();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const fetchProducts = useCallback(async (isNextPage = false) => {
    if (!db || !user) return;
    
    try {
      if (!isNextPage) setIsLoading(true);

      const result = await measurePerformance('Fetch Products', async () => {
        let q = query(
          collection(db, 'products'),
          orderBy('createdAt', 'desc'),
          limit(pageSize)
        );

        if (isNextPage && lastDoc) {
          q = query(q, startAfter(lastDoc));
        }

        const snapshot = await getDocs(q);
        const productsData = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        })) as Product[];
        
        return {
          products: productsData,
          lastSnapshot: snapshot.docs[snapshot.docs.length - 1]
        };
      });

      if (isNextPage) {
        setProducts(prev => [...prev, ...result.products]);
      } else {
        setProducts(result.products);
      }
      
      setLastDoc(result.lastSnapshot || null);
      setHasMore(result.products.length === pageSize);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching products:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [db, user, pageSize, lastDoc]);

  useEffect(() => {
    if (user && db) {
      fetchProducts();
    }
  }, [user, db, fetchProducts]); 

  return { products, isLoading, error, hasMore, loadMore: () => fetchProducts(true) };
}

/**
 * Optimized hook for fetching customer orders history.
 */
export function useCustomerOrders() {
  const db = useFirestore();
  const { user } = useUser();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    if (!db || !user?.uid) {
      if (!user) setIsLoading(false);
      return;
    }

    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        const result = await measurePerformance('Fetch Customer Orders', async () => {
          const q = query(
            collection(db, 'orders'),
            orderBy('createdAt', 'desc'),
            limit(50)
          );

          const snapshot = await getDocs(q);
          return snapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data() 
          })) as Order[];
        });
        
        setOrders(result);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching customer orders:', err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [db, user]);

  return { orders, isLoading, error };
}