# TFX Live - Real-Time Crypto Price Tracker

TFX Live is a modern, responsive, and real-time cryptocurrency price tracking application. It provides a clean dashboard interface to monitor the prices and market data for various cryptocurrency pairs. The application is built with a focus on performance and providing up-to-the-second market information through a live WebSocket connection.

## Features

- **Real-Time Price Updates**: Live price data streamed directly from the Coinbase Exchange.
- **Multi-Currency Dashboard**: View price widgets for multiple cryptocurrencies simultaneously (BTC, ETH, SOL, ADA).
- **Detailed Market Insights**: Each widget displays:
    - Last traded price
    - Best bid and ask
    - 24-hour high, low, open, and volume
    - 24-hour price change percentage
- **Bid-Ask Spread Visualization**: A dynamic indicator bar shows the current spread, color-coded to represent market liquidity (narrow, medium, wide).
- **Connection Status**: Each widget displays its connection status (Live, Connecting, Reconnecting, Offline).
- **Responsive Design**: The layout is optimized for a seamless experience across desktops, tablets, and mobile devices.
- **Robust Connectivity**: The application automatically attempts to reconnect to the data source if the connection is lost, using an exponential backoff strategy.

## Tech Stack

This project is a client-side application built with the following technologies:

- **Framework**: [React](https://reactjs.org/) (v18+)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: CSS with responsive media queries. No external CSS frameworks are used.

## API Used

The application streams its data from the **Coinbase Exchange WebSocket API**.

- **Endpoint**: `wss://ws-feed.exchange.coinbase.com`
- **Channel**: The application subscribes to the `ticker` channel, which provides real-time price updates for specified product IDs.

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

You will need [Node.js](https://nodejs.org/) (version 18.x or higher) and [npm](https://www.npmjs.com/) installed on your machine.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    ```
2.  **Navigate to the client directory:**
    ```bash
    cd client
    ```
3.  **Install the dependencies:**
    ```bash
    npm install
    ```

### Running the Application

Once the dependencies are installed, you can run the development server:

```bash
npm run dev
```

This will start the Vite development server, and you can view the application by navigating to `http://localhost:5173` (or the port specified in your terminal) in your web browser.

## Project Structure

The `src` directory contains the core of the application:

```
src/
├── assets/           # Static assets like images and SVGs
├── components/       # Reusable React components
│   ├── PriceWidget.tsx # The main component for displaying crypto data
│   └── PriceWidget.css # Styles for the PriceWidget
├── services/         # Application services (e.g., data fetching)
│   └── priceService.ts # Manages WebSocket connection and data flow
├── App.tsx           # Main application component (layout)
├── App.css           # Styles for the main App component
├── main.tsx          # Application entry point
└── index.css         # Global styles and CSS resets
```

## Recent Enhancements

This section highlights the significant improvements and refactoring efforts undertaken to enhance the application's user experience and maintainability.

### Visual Price Feedback

-   **Dynamic Price Coloring**: The "Last Price" display now provides immediate visual feedback, turning green when the price increases and red when it decreases.
-   **Directional Arrows**: Small, persistent up (▲) or down (▼) arrows are displayed next to the "Last Price" to clearly indicate the direction of the most recent price change.

### Enhanced Bid-Ask Spread Indicator

-   **Intuitive Bar Visualization**: The bid-ask spread indicator bar has been re-engineered to offer a more intuitive visual representation of market liquidity. A wider, green bar now signifies a tight (favorable) spread, while a narrower, red bar indicates a wider (less favorable) spread.
-   **Refined Categorization**: The thresholds for "Narrow," "Medium," and "Wide" spread categories have been adjusted to better reflect typical cryptocurrency market conditions, ensuring more accurate visual cues.
-   **Informative Labeling**: The "SPREAD" label now dynamically includes its current category (e.g., "SPREAD (Narrow)"), with the category text colored to match the bar's status for enhanced clarity.
-   **Improved Layout**: The layout of the spread indicator bar and its corresponding numerical value has been optimized for better visibility and centered alignment.

### Comprehensive CSS Refactoring

-   **Centralized Color Variables**: All hardcoded color values across the application's stylesheets (`App.css`, `Footer.css`, `PriceWidget.css`) have been replaced with a centralized system of CSS variables defined in `:root` within `index.css`.
-   **Color Consolidation**: Similar shades of colors (especially greens, reds, grays, and blues) have been consolidated using base RGB variables, allowing for easy modification of color palettes by simply adjusting the base RGB values and their alpha channels. This significantly reduces redundancy and improves maintainability.

### UI Alignment Improvements

-   **Consistent Label Alignment**: Labels for "BEST BID", "24H HIGH", and "24H OPEN" have been precisely aligned to enhance the overall visual consistency and readability of the price widgets.