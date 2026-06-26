import React from 'react';

const LOGO_URL = '/logo.png';

export default function EthnicLogo({ size = 40, showText = false, className = '' }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img
        src={LOGO_URL}
        alt="Ethnic Community"
        style={{ width: size, height: size, objectFit: 'contain' }}
      />
      {showText && (
        <span className="font-display tracking-[0.3em] uppercase text-[#F5F0EB]">
          Ethnic
        </span>
      )}
    </div>
  );
}