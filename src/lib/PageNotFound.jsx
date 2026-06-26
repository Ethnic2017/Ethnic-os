import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function PageNotFound() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="font-display text-8xl text-[#C9A96E] mb-4">404</h1>
        <p className="text-[#8A8A8A] text-lg mb-8">This page doesn't exist.</p>
        <Link
          to={createPageUrl('PublicHome')}
          className="inline-flex items-center px-6 py-3 bg-[#C9A96E] text-[#0A0A0A] rounded-full font-medium hover:bg-[#E0CBA8] transition-all text-sm tracking-wider uppercase"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}