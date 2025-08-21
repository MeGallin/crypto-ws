import React from 'react';
import './PriceWidget.css';
import { usePriceData } from '../services/priceService';

interface StatProps {
  label: string;
  value: number | null;
  format?: (v: number) => string;
  spreadCategory?: 'narrow' | 'medium' | 'wide' | null;
  className?: string;
}

function Stat({ label, value, format, spreadCategory, className }: StatProps) {
  return (
    <div
      className={`price-widget-stat ${
        spreadCategory ? `spread-${spreadCategory}` : ''
      } ${className || ''}`}
    >
      <div className="price-widget-stat-label">{label}</div>
      <div className="price-widget-stat-value">
        {value != null
          ? format
            ? format(value)
            : value.toLocaleString(undefined, {
                style: 'decimal',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
          : '—'}
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

  // Calculate bid-ask spread
  const spread = React.useMemo(() => {
    if (!data.bestAsk || !data.bestBid) return null;

    const midPrice = (data.bestAsk + data.bestBid) / 2;
    const spreadPercentage = ((data.bestAsk - data.bestBid) / midPrice) * 100;

    let category: 'narrow' | 'medium' | 'wide' = 'wide';
    if (spreadPercentage < 0.01) {
      category = 'narrow';
    } else if (spreadPercentage < 0.2) {
      category = 'medium';
    }

    return {
      absolute: data.bestAsk - data.bestBid,
      percentage: spreadPercentage,
      category,
    };
  }, [data.bestAsk, data.bestBid]);

  const change24h = React.useMemo(() => {
    if (data.price == null || data.open24h == null) return null;
    const pct = ((data.price - data.open24h) / data.open24h) * 100;
    return pct;
  }, [data.price, data.open24h]);

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
            <div className="price-widget-price-value">
              {data.price != null
                ? data.price.toLocaleString(undefined, {
                    style: 'decimal',
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                : '—'}
            </div>
          </div>

          <div className="price-widget-stats-grid">
            <Stat
              label="BEST BID"
              value={data.bestBid}
              spreadCategory={spread?.category || null}
            />
            <Stat
              label="BEST ASK"
              value={data.bestAsk}
              spreadCategory={spread?.category || null}
              className="stat-best-ask"
            />
            <div className="spread-stat-container">
              <div className="spread-stat">
                <div className="spread-stat-label">SPREAD</div>
                <div className="spread-stat-content">
                  <div className="spread-indicator">
                    <div
                      className={`spread-indicator-bar ${
                        spread ? `spread-${spread.category}` : ''
                      }`}
                      style={{
                        width: spread
                          ? `${Math.min(
                              100,
                              Math.max(10, spread.absolute * 1000),
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
            <Stat label="24H HIGH" value={data.high24h} />
            <Stat
              label="24H LOW"
              value={data.low24h}
              className="stat-right-label"
            />
            <Stat label="24H OPEN" value={data.open24h} />
            <Stat
              label="24H VOL"
              value={data.volume24h}
              format={(v) =>
                v.toLocaleString(undefined, {
                  style: 'decimal',
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })
              }
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
