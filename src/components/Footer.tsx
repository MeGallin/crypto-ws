import React from 'react';
import './Footer.css';

const Footer: React.FC = () => {
  return (
    <footer className="footer-container">
      <div className="footer-content">
        <p>
          &copy; {new Date().getFullYear()} TFX-LIVE. All rights reserved. |
          Developed by{' '}
          <a
            href="https://garyallin.uk"
            target="_blank"
            rel="noopener noreferrer"
          >
            Gary Allin
          </a> | 
          Hosted by <a href="https://trilogywebsolutions.co.uk" target="_blank" rel="noopener noreferrer">Trilogy Web Solutions</a>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
