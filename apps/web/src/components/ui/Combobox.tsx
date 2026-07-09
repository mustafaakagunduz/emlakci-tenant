import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface ComboboxProps {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  onSelectOption?: (option: string) => void;
  options: string[];
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  loading?: boolean;
  emptyMessage?: string;
}

export function Combobox({
  id,
  label,
  value,
  onChange,
  onSelectOption,
  options,
  placeholder,
  disabled,
  error,
  loading,
  emptyMessage,
}: ComboboxProps) {
  const { t } = useTranslation('common');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [options]);

  function selectOption(option: string) {
    onChange(option);
    onSelectOption?.(option);
    setIsOpen(false);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        return;
      }
      setHighlightedIndex((i) => Math.min(i + 1, options.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightedIndex((i) => Math.max(i - 1, 0));
    } else if (event.key === 'Enter') {
      if (isOpen && options[highlightedIndex] !== undefined) {
        event.preventDefault();
        selectOption(options[highlightedIndex]);
      }
    } else if (event.key === 'Escape') {
      setIsOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label htmlFor={id} className="mb-1 block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        id={id}
        type="text"
        autoComplete="off"
        disabled={disabled}
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100"
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      {isOpen && !disabled && (
        <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-md border border-gray-200 bg-white text-sm shadow-lg">
          {loading && <li className="px-3 py-2 text-gray-400">{t('loading')}</li>}
          {!loading && options.length === 0 && (
            <li className="px-3 py-2 text-gray-400">{emptyMessage ?? t('noResults')}</li>
          )}
          {!loading &&
            options.map((option, index) => (
              <li
                key={option}
                onMouseDown={(e) => {
                  e.preventDefault();
                  selectOption(option);
                }}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`cursor-pointer px-3 py-2 ${
                  index === highlightedIndex ? 'bg-gray-100' : ''
                }`}
              >
                {option}
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
