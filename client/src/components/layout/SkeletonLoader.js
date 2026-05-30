import React from 'react';
import './SkeletonLoader.css';

export const SkeletonText = ({ lines = 1 }) => (
  <div className="skeleton-container">
    {Array(lines).fill(0).map((_, i) => (
      <div key={i} className={`skeleton skeleton-text ${i === lines - 1 && lines > 1 ? 'short' : ''}`}></div>
    ))}
  </div>
);

export const SkeletonCard = () => (
  <div className="skeleton-card">
    <div className="skeleton-header">
      <div className="skeleton skeleton-avatar"></div>
      <div className="skeleton-header-content">
        <div className="skeleton skeleton-title" style={{ marginBottom: '8px' }}></div>
        <div className="skeleton skeleton-text short"></div>
      </div>
    </div>
    <SkeletonText lines={3} />
  </div>
);

export const SkeletonList = ({ count = 3 }) => (
  <>
    {Array(count).fill(0).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </>
);
