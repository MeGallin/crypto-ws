import { config } from '../config';
import React from 'react';

export interface PriceData {
  price: number | null;
  bestBid: number | null;
  bestAsk: number | null;
  open24h: number | null;
  high24h: number | null;
  low24h: number | null;
  volume24h: number | null;
  status: 'connecting' | 'live' | 'reconnecting' | 'offline' | 'error';
  lastUpdate: number;
  errorMessage?: string;
}

export interface PriceService {
  subscribe: (productId: string, callback: (data: PriceData) => void) => void;
  unsubscribe: (productId: string) => void;
  getConnectionStatus: () => 'connecting' | 'live' | 'reconnecting' | 'offline' | 'error';
}

class PriceServiceImpl implements PriceService {
  private ws: WebSocket | null = null;
  private retries = 0;
  private timer: number | null = null;
  private subscribers = new Map<string, Set<(data: PriceData) => void>>();
  private priceData = new Map<string, PriceData>();
  private endpoint: string;

  constructor() {
    this.endpoint = config.webSocketUrl;
    this.connect();
  }

  private connect() {
    this.updateStatus('connecting');
    console.log('Connecting to WebSocket...');

    const ws = new WebSocket(this.endpoint);
    this.ws = ws;

    ws.onopen = () => {
      try {
        console.log('WebSocket connection opened.');
        this.sendSubscriptions();
        this.updateStatus('live');
        this.retries = 0;
      } catch (error) {
        console.error('Error sending subscription message:', error);
        this.updateStatus('error', 'Failed to subscribe');
      }
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg.type === 'error') {
          console.error('Coinbase API Error:', msg.message);
          this.updateStatus('error', msg.message);
          return;
        }

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

    ws.onclose = (event) => {
      console.log('WebSocket connection closed:', event.code, event.reason);
      if (event.code !== 1000) { // 1000 is normal closure
        this.scheduleReconnect();
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.updateStatus('error', 'WebSocket connection error');
      try {
        ws.close();
      } catch (closeError) {
        console.error('Error closing WebSocket:', closeError);
      }
    };
  }

  private sendSubscriptions() {
    const productIds = Array.from(this.subscribers.keys());
    if (productIds.length > 0) {
      console.log('Subscribing to products:', productIds);
      const subscribeMsg = JSON.stringify({
        type: 'subscribe',
        product_ids: productIds,
        channels: ['ticker'],
      });
      this.ws?.send(subscribeMsg);
    }
  }

  private scheduleReconnect() {
    if (this.retries >= 5) {
        this.updateStatus('offline', 'Failed to reconnect after multiple attempts');
        return;
    }
    this.updateStatus('reconnecting');
    const base = 1000;
    const max = 30000;
    const attempt = this.retries + 1;
    this.retries = attempt;
    const delay =
      Math.min(max, base * 2 ** attempt) + Math.floor(Math.random() * 1000);

    console.log(`Reconnecting in ${delay}ms (attempt ${attempt})...`);
    if (this.timer) window.clearTimeout(this.timer);
    this.timer = window.setTimeout(() => this.connect(), delay);
  }

  private updateStatus(
    status: 'connecting' | 'live' | 'reconnecting' | 'offline' | 'error',
    errorMessage?: string
  ) {
    this.priceData.forEach((data, productId) => {
      data.status = status;
      data.errorMessage = errorMessage;
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

    const existingData = this.priceData.get(productId);
    if (existingData) {
      callback(existingData);
    }

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

  getConnectionStatus(): 'connecting' | 'live' | 'reconnecting' | 'offline' | 'error' {
    if (this.ws?.readyState === WebSocket.OPEN) return 'live';
    if (this.ws?.readyState === WebSocket.CONNECTING) return 'connecting';
    if (this.ws?.readyState === WebSocket.CLOSING) return 'reconnecting';
    return 'offline';
  }
}

export const priceService = new PriceServiceImpl();



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
