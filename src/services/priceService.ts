export interface PriceData {
  price: number | null;
  bestBid: number | null;
  bestAsk: number | null;
  open24h: number | null;
  high24h: number | null;
  low24h: number | null;
  volume24h: number | null;
  status: 'connecting' | 'live' | 'reconnecting' | 'offline';
  lastUpdate: number;
}

export interface PriceService {
  subscribe: (productId: string, callback: (data: PriceData) => void) => void;
  unsubscribe: (productId: string) => void;
  getConnectionStatus: () => 'connecting' | 'live' | 'reconnecting' | 'offline';
}

class PriceServiceImpl implements PriceService {
  private ws: WebSocket | null = null;
  private retries = 0;
  private timer: number | null = null;
  private subscribers = new Map<string, Set<(data: PriceData) => void>>();
  private priceData = new Map<string, PriceData>();
  private endpoint = 'wss://ws-feed.exchange.coinbase.com';

  constructor() {
    this.connect();
  }

  private connect() {
    this.updateStatus('connecting');

    const ws = new WebSocket(this.endpoint);
    this.ws = ws;

    ws.onopen = () => {
      try {
        this.sendSubscriptions();
        this.updateStatus('live');
        this.retries = 0;
      } catch (error) {
        console.error('Error sending subscription message:', error);
      }
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'ticker' && this.subscribers.has(msg.product_id)) {
          const data: PriceData = {
            price: msg.price ? Number(msg.price) : null,
            bestBid: msg.best_bid ? Number(msg.best_bid) : null,
            bestAsk: msg.best_ask ? Number(msg.best_ask) : null,
            open24h: msg.open_24h ? Number(msg.open_24h) : null,
            high24h: msg.high_24h ? Number(msg.high_24h) : null,
            low24h: msg.low_24h ? Number(msg.low_24h) : null,
            volume24h: msg.volume_24h ? Number(msg.volume_24h) : null,
            status: this.getConnectionStatus(),
            lastUpdate: Date.now(),
          };

          this.priceData.set(msg.product_id, data);
          this.notifySubscribers(msg.product_id, data);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = () => this.scheduleReconnect();
    ws.onerror = () => {
      try {
        ws.close();
      } catch (error) {
        console.error('Error closing WebSocket:', error);
      }
    };
  }

  private sendSubscriptions() {
    const productIds = Array.from(this.subscribers.keys());
    if (productIds.length > 0) {
      const subscribeMsg = JSON.stringify({
        type: 'subscribe',
        product_ids: productIds,
        channels: ['ticker'],
      });
      this.ws?.send(subscribeMsg);
    }
  }

  private scheduleReconnect() {
    this.updateStatus('reconnecting');
    const base = 500;
    const max = 10_000;
    const attempt = Math.min(this.retries + 1, 8);
    this.retries = attempt;
    const delay =
      Math.min(max, base * 2 ** attempt) + Math.floor(Math.random() * 250);

    if (this.timer) window.clearTimeout(this.timer);
    this.timer = window.setTimeout(() => this.connect(), delay);
  }

  private updateStatus(
    status: 'connecting' | 'live' | 'reconnecting' | 'offline',
  ) {
    // Update status for all subscribed products
    this.priceData.forEach((data, productId) => {
      data.status = status;
      this.notifySubscribers(productId, data);
    });
  }

  private notifySubscribers(productId: string, data: PriceData) {
    const callbacks = this.subscribers.get(productId);
    if (callbacks) {
      callbacks.forEach((callback) => callback(data));
    }
  }

  subscribe(productId: string, callback: (data: PriceData) => void): void {
    if (!this.subscribers.has(productId)) {
      this.subscribers.set(productId, new Set());
    }
    this.subscribers.get(productId)!.add(callback);

    // If we already have data for this product, send it immediately
    const existingData = this.priceData.get(productId);
    if (existingData) {
      callback(existingData);
    }

    // If WebSocket is already open, send subscription for this new product
    if (this.ws?.readyState === WebSocket.OPEN) {
      const subscribeMsg = JSON.stringify({
        type: 'subscribe',
        product_ids: [productId],
        channels: ['ticker'],
      });
      this.ws?.send(subscribeMsg);
    }
  }

  unsubscribe(productId: string): void {
    const callbacks = this.subscribers.get(productId);
    if (callbacks) {
      callbacks.clear();
      if (callbacks.size === 0) {
        this.subscribers.delete(productId);
      }
    }
  }

  getConnectionStatus(): 'connecting' | 'live' | 'reconnecting' | 'offline' {
    if (this.ws?.readyState === WebSocket.OPEN) return 'live';
    if (this.ws?.readyState === WebSocket.CONNECTING) return 'connecting';
    if (this.ws?.readyState === WebSocket.CLOSING) return 'reconnecting';
    return 'offline';
  }
}

// Create a singleton instance
export const priceService = new PriceServiceImpl();

import React from 'react';

// React hook for using the price service
export function usePriceData(productId: string) {
  const [data, setData] = React.useState<PriceData>({
    price: null,
    bestBid: null,
    bestAsk: null,
    open24h: null,
    high24h: null,
    low24h: null,
    volume24h: null,
    status: 'connecting',
    lastUpdate: 0,
  });

  React.useEffect(() => {
    const callback = (newData: PriceData) => {
      setData(newData);
    };

    priceService.subscribe(productId, callback);

    return () => {
      priceService.unsubscribe(productId);
    };
  }, [productId]);

  return data;
}
