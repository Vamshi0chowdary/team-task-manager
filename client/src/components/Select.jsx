import { useEffect, useMemo, useRef, useState } from 'react';

const optionText = (option) => {
  if (typeof option?.props?.children === 'string') {
    return option.props.children;
  }

  if (Array.isArray(option?.props?.children)) {
    return option.props.children.flat().map((item) => (typeof item === 'string' ? item : '')).join('');
  }

  return String(option?.props?.children ?? option?.props?.value ?? '');
};

const optionIcon = (label) => {
  if (label.includes('Done') || label === 'DONE') return '✅';
  if (label.includes('In Progress') || label === 'IN_PROGRESS') return '🔄';
  if (label.includes('To Do') || label === 'TODO') return '📋';
  if (label.includes('High') || label === 'HIGH') return '🔴';
  if (label.includes('Medium') || label === 'MEDIUM') return '🟡';
  if (label.includes('Low') || label === 'LOW') return '🟢';
  if (label.includes('Unassigned')) return '↔️';
  return '•';
};

export default function Select({ className = '', style = {}, children, value, onChange, name, disabled = false, id }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  const options = useMemo(
    () =>
      children
        ? Array.from(Array.isArray(children) ? children : [children])
            .filter((child) => child && child.props && child.props.value !== undefined)
            .map((child) => ({
              value: child.props.value,
              label: optionText(child),
            }))
        : [],
    [children]
  );

  const selected = options.find((option) => String(option.value) === String(value)) || options[0] || { label: '', value: '' };

  useEffect(() => {
    const handleDocumentClick = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleDocumentClick);
    return () => document.removeEventListener('mousedown', handleDocumentClick);
  }, []);

  const emitChange = (nextValue) => {
    if (!onChange) return;

    onChange({
      target: {
        name,
        value: nextValue,
      },
    });
  };

  const baseClass =
    'w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 font-medium transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 hover:border-slate-300';

  return (
    <div ref={rootRef} className="relative w-full" id={id}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((state) => !state)}
        className={`${baseClass} flex items-center justify-between gap-3 text-left disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
        style={style}
      >
        <span className="min-w-0 flex items-center gap-2 truncate">
          <span className="text-base leading-none">{optionIcon(selected.label || '')}</span>
          <span className="truncate">{selected.label || 'Select an option'}</span>
        </span>
        <span className={`text-slate-500 transition ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {open && !disabled ? (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="max-h-64 overflow-auto p-1">
            {options.map((option) => {
              const isSelected = String(option.value) === String(value);
              return (
                <button
                  key={String(option.value)}
                  type="button"
                  onClick={() => {
                    emitChange(option.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                    isSelected ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-2 truncate">
                    <span className="text-base leading-none">{optionIcon(option.label)}</span>
                    <span className="truncate font-medium">{option.label}</span>
                  </span>
                  {isSelected ? <span className="text-blue-600">✓</span> : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
