import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';

interface BrandSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function BrandSelector({ value, onChange }: BrandSelectorProps) {
  const [query, setQuery] = useState('');
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchBrands();
    
    // Close dropdown when clicking outside
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (value) {
      setQuery(value);
    }
  }, [value]);

  const fetchBrands = async () => {
    try {
      const { data, error } = await supabase
        .from('brands')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      setBrands(data || []);
    } catch (error) {
      console.error('Error fetching brands:', error);
    }
  };

  const handleCreateBrand = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('brands')
        .insert({ name: query.trim() })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Unique violation
           // Brand already exists, just select it
           onChange(query.trim());
           setIsOpen(false);
        } else {
          throw error;
        }
      } else if (data) {
        setBrands([...brands, data].sort((a, b) => a.name.localeCompare(b.name)));
        onChange(data.name);
        setIsOpen(false);
      }
    } catch (error) {
      console.error('Error creating brand:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBrands = query === ''
    ? brands
    : brands.filter((brand) =>
        brand.name.toLowerCase().includes(query.toLowerCase())
      );

  return (
    <div className="relative" ref={wrapperRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
      <div className="relative">
        <input
          type="text"
          className="w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
          placeholder="Select or type a brand..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
        <button
          type="button"
          className="absolute inset-y-0 right-0 flex items-center px-2 text-gray-400 hover:text-gray-600"
          onClick={() => setIsOpen(!isOpen)}
        >
          <ChevronsUpDown className="h-4 w-4" />
        </button>
      </div>

      {isOpen && (
        <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
          {filteredBrands.length === 0 && query !== '' && (
            <li
              className="relative cursor-pointer select-none py-2 pl-3 pr-9 text-indigo-600 hover:bg-indigo-50"
              onClick={handleCreateBrand}
            >
              <div className="flex items-center">
                <Plus className="mr-2 h-4 w-4" />
                Add "{query}"
              </div>
            </li>
          )}

          {filteredBrands.map((brand) => (
            <li
              key={brand.id}
              className={`relative cursor-pointer select-none py-2 pl-3 pr-9 ${
                brand.name === value ? 'bg-indigo-600 text-white' : 'text-gray-900 hover:bg-indigo-50'
              }`}
              onClick={() => {
                onChange(brand.name);
                setQuery(brand.name);
                setIsOpen(false);
              }}
            >
              <span className={`block truncate ${brand.name === value ? 'font-semibold' : 'font-normal'}`}>
                {brand.name}
              </span>
              {brand.name === value && (
                <span className={`absolute inset-y-0 right-0 flex items-center pr-4 ${
                  brand.name === value ? 'text-white' : 'text-indigo-600'
                }`}>
                  <Check className="h-4 w-4" />
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
