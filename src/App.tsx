import { PriceWidget } from './components/PriceWidget';
import './App.css';

export default function App() {
  return (
    <div className="app-container">
      <div className="widgets-container">
        <PriceWidget title="BTC-USD" productId="BTC-USD" />
        <PriceWidget title="ETH-USD" productId="ETH-USD" />
        <PriceWidget title="SOL-USD" productId="SOL-USD" />
        <PriceWidget title="ADA-USD" productId="ADA-USD" />
      </div>
    </div>
  );
}
