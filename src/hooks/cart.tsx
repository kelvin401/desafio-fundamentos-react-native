import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const product = await AsyncStorage.getItem('@GoMarket:Product');

      if (product) {
        setProducts(JSON.parse(product));
      }
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      const incrementProduct = products.map(product =>
        product.id === id
          ? {
              ...product,
              quantity: product.quantity + 1,
            }
          : product,
      );

      setProducts(incrementProduct);

      AsyncStorage.setItem(
        '@GoMarket:Product',
        JSON.stringify(incrementProduct),
      );
    },
    [products],
  );

  const addToCart = useCallback(
    async product => {
      const productIndex = products.findIndex(p => p.id === product.id);

      if (productIndex > -1) {
        increment(product.id);
      } else {
        const updateProduct = [...products, { ...product, quantity: 1 }];
        setProducts(updateProduct);
        AsyncStorage.setItem(
          '@GoMarket:Product',
          JSON.stringify(updateProduct),
        );
      }
    },
    [products, increment],
  );

  const decrement = useCallback(
    async id => {
      const decrementProduct = products.map(product =>
        product.id === id
          ? {
              ...product,
              quantity: product.quantity - 1,
            }
          : product,
      );

      const updateProducts = decrementProduct.filter(p => p.quantity !== 0);

      setProducts(updateProducts);

      AsyncStorage.setItem('@GoMarket:Product', JSON.stringify(updateProducts));
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
