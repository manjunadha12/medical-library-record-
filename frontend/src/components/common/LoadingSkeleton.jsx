import React from 'react';

export const LoadingSkeleton = ({ type = 'cards', count = 3 }) => {
  if (type === 'table') {
    return (
      <div className="w-full animate-pulse space-y-4">
        <div className="h-10 bg-slate-200/80 rounded-lg w-full"></div>
        {[...Array(count)].map((_, i) => (
          <div key={i} className="h-14 bg-slate-100 rounded-lg w-full"></div>
        ))}
      </div>
    );
  }

  if (type === 'stats') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[...Array(count)].map((_, i) => (
          <div key={i} className="animate-pulse bg-white p-6 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="h-4 bg-slate-200 rounded w-1/2"></div>
            <div className="h-8 bg-slate-200 rounded w-1/3"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="animate-pulse bg-white p-5 rounded-xl border border-slate-200/80 space-y-3">
          <div className="h-5 bg-slate-200 rounded w-3/4"></div>
          <div className="h-4 bg-slate-100 rounded w-1/2"></div>
        </div>
      ))}
    </div>
  );
};
