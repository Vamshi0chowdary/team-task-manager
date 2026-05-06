import React from 'react';

const defaultArrow = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23475569' d='M6 9L1 4h10z'/%3E%3C/svg%3E`;

export default function Select({ className = '', style = {}, children, ...props }) {
  const baseClass =
    'w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition appearance-none cursor-pointer hover:border-slate-300';

  const mergedStyle = {
    backgroundImage: `url("${defaultArrow}")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
    paddingRight: '36px',
    ...style,
  };

  return (
    <select className={`${baseClass} ${className}`} style={mergedStyle} {...props}>
      {children}
    </select>
  );
}
