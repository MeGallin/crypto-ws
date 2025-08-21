import React, { useState, useEffect } from 'react';
import './PriceWidget.css';
import { usePriceData } from '../services/priceService';

// Utility function for formatting numbers
const formatNumber = (
  value: number | null,
  options?: Intl.NumberFormatOptions,
) => {
  if (value === null || value === undefined) return '—';
  return value.toLocaleString(undefined, {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  });
};

interface StatProps {
  label: string;
  value: number | null;
  formatOptions?: Intl.NumberFormatOptions;
  spreadCategory?: 'narrow' | 'medium' | 'wide' | null;
  className?: string;
}

function Stat({
  label,
  value,
  formatOptions,
  spreadCategory,
  className,
}: StatProps) {
  const classNames = [
    'price-widget-stat',
    className,
    spreadCategory ? `spread-${spreadCategory}` : '',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <div className={classNames}>
      <div className="price-widget-stat-label">{label}</div>
      <div className="price-widget-stat-value">
        {formatNumber(value, formatOptions)}
      </div>
    </div>
  );
}

interface PriceWidgetProps {
  title: string;
  productId: string;
}

export function PriceWidget({ title, productId }: PriceWidgetProps) {
  const data = usePriceData(productId);

  const [previousPrice, setPreviousPrice] = useState<number | null>(null);
  const [priceDirection, setPriceDirection] = useState<
    'up' | 'down' | 'neutral'
  >('neutral');

  useEffect(() => {
    if (data.price !== null && previousPrice !== null) {
      if (data.price > previousPrice) {
        setPriceDirection('up');
      } else if (data.price < previousPrice) {
        setPriceDirection('down');
      }
      // If data.price === previousPrice, we do nothing to priceDirection,
      // so it retains its last 'up' or 'down' state.
    }
    if (data.price !== null) {
      setPreviousPrice(data.price);
    }
  }, [data.price, previousPrice]);

  // Calculate bid-ask spread
  const spread = React.useMemo(() => {
    if (!data.bestAsk || !data.bestBid) return null;

    const midPrice = (data.bestAsk + data.bestBid) / 2;
    if (midPrice === 0) return null; // Avoid division by zero
    const spreadPercentage = ((data.bestAsk - data.bestBid) / midPrice) * 100;

    let category: 'narrow' | 'medium' | 'wide' = 'wide';
    if (spreadPercentage < 0.1) {
      // New threshold for narrow
      category = 'narrow';
    } else if (spreadPercentage < 0.5) {
      // New threshold for medium
      category = 'medium';
    }

    return {
      absolute: data.bestAsk - data.bestBid,
      percentage: spreadPercentage,
      category,
    };
  }, [data.bestAsk, data.bestBid]);

  const change24h = React.useMemo(() => {
    if (data.price == null || data.open24h == null || data.open24h === 0)
      return null;
    const pct = ((data.price - data.open24h) / data.open24h) * 100;
    return pct;
  }, [data.price, data.open24h]);

  // Render a loading state if the price is not yet available
  if (data.price === null) {
    return (
      <div className="price-widget-container">
        <div className="price-widget loading">
          <div className="price-widget-header">
            <h1 className="price-widget-title">{title}</h1>
            <span className={`price-widget-status ${data.status}`}>
              {data.status}
            </span>
          </div>
          <div className="loading-message">Loading price data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="price-widget-container">
      <div className="price-widget">
        <header className="price-widget-header">
          <h1 className="price-widget-title">{title}</h1>
          <span className={`price-widget-status ${data.status}`}>
            {data.status}
          </span>
        </header>

        <main className="price-widget-main">
          <div>
            <div className="price-widget-price-label">Last Price</div>
            <div
              className={`price-widget-price-value ${
                priceDirection === 'up'
                  ? 'price-up'
                  : priceDirection === 'down'
                  ? 'price-down'
                  : ''
              }`}
            >
              {formatNumber(data.price)}
              {priceDirection === 'up' && (
                <span className="price-arrow up">▲</span>
              )}
              {priceDirection === 'down' && (
                <span className="price-arrow down">▼</span>
              )}
            </div>
          </div>

          <div className="price-widget-stats-grid">
            <Stat
              label="BEST BID"
              value={data.bestBid}
              spreadCategory={spread?.category || null}
              className="stat-left-label"
            />
            <Stat
              label="BEST ASK"
              value={data.bestAsk}
              spreadCategory={spread?.category || null}
              className="stat-best-ask"
            />
            <div className="spread-stat-container">
              <div className="spread-stat">
                <div className="spread-stat-label">
                  SPREAD INDICATOR
                  <br />{' '}
                  <span
                    className={
                      spread?.category ? `spread-${spread.category}` : ''
                    }
                  >
                    {spread?.category
                      ? `${
                          spread.category.charAt(0).toUpperCase() +
                          spread.category.slice(1)
                        }`
                      : ''}
                  </span>
                </div>
                <div className="spread-stat-content">
                  <div className="spread-indicator">
                    <div
                      className={`spread-indicator-bar ${
                        spread ? `spread-${spread.category}` : ''
                      }`}
                      style={{
                        width: spread
                          ? `${Math.max(
                              10, // Minimum width
                              100 - (spread.percentage / 0.5) * 100, // Inverted percentage
                            )}%`
                          : '10%',
                      }}
                    />
                  </div>
                  <div className="spread-stat-value">
                    {spread?.absolute != null
                      ? `${spread.absolute.toFixed(2)}`
                      : '—'}
                  </div>
                </div>
              </div>
            </div>
            <Stat label="24H HIGH" value={data.high24h} className="stat-left-label" />
            <Stat
              label="24H LOW"
              value={data.low24h}
              className="stat-right-label"
            />
            <Stat
              label="24H OPEN"
              value={data.open24h}
              className="stat-left-label"
            />
            <Stat
              label="24H VOL"
              value={data.volume24h}
              formatOptions={{
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }}
              className="stat-right-label"
            />
          </div>

          <div className="price-widget-change">
            <div className="price-widget-change-label">24h Change</div>
            <div
              className={`price-widget-change-value ${
                change24h != null && change24h >= 0 ? 'positive' : 'negative'
              }`}
            >
              {change24h != null ? `${change24h.toFixed(2)}%` : '—'}
            </div>
          </div>
        </main>

        <footer className="price-widget-footer">
          Data: Coinbase Exchange WebSocket (public market data)
        </footer>
      </div>
    </div>
  );
}
