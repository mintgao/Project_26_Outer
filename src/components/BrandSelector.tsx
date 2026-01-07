import { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Check, ChevronsUpDown, Plus, Search, AlertCircle } from 'lucide-react';

interface Brand {
  id: string;
  name: string;
}

interface BrandSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

// Local Storage Key
const RECENT_BRANDS_KEY = 'outer_recent_brands';

export default function BrandSelector({ value, onChange }: BrandSelectorProps) {
  const [query, setQuery] = useState('');
  const [brands, setBrands] = useState<Brand[]>([]);
  const [localBrands, setLocalBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Load initial data
  useEffect(() => {
    fetchBrands();
    loadLocalBrands();
    
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync internal query with external value
  useEffect(() => {
    if (value) {
      setQuery(value);
    } else {
      setQuery('');
    }
  }, [value]);

  const loadLocalBrands = () => {
    try {
      const stored = localStorage.getItem(RECENT_BRANDS_KEY);
      if (stored) {
        setLocalBrands(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load local brands', e);
    }
  };

  const saveLocalBrand = (brand: Brand) => {
    const updated = [brand, ...localBrands.filter(b => b.name !== brand.name)].slice(0, 10); // Keep last 10
    setLocalBrands(updated);
    localStorage.setItem(RECENT_BRANDS_KEY, JSON.stringify(updated));
  };

  const fetchBrands = async () => {
    try {
      // Fetch all brands (for MVP 50-100 items, fetching all is fine. For larger datasets, use server-side search)
      const { data, error } = await supabase
        .from('brands')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      setBrands(data || []);
    } catch (error) {
      console.error('Error fetching brands:', error);
      // Fallback to local brands if network fails
      if (brands.length === 0 && localBrands.length > 0) {
        setBrands(localBrands);
      }
    }
  };

  // Debounced Search & Filter
  const filteredBrands = useMemo(() => {
    const normalizedQuery = query.toLowerCase().trim();
    if (!normalizedQuery) return brands;

    return brands.filter(brand => 
      brand.name.toLowerCase().includes(normalizedQuery)
    );
  }, [query, brands]);

  // Check for duplicates
  const isDuplicate = useMemo(() => {
    const normalizedQuery = query.toLowerCase().trim();
    if (!normalizedQuery) return false;
    return brands.some(brand => brand.name.toLowerCase() === normalizedQuery);
  }, [query, brands]);

  const handleSelect = (brandName: string) => {
    onChange(brandName);
    setQuery(brandName);
    setIsOpen(false);
    setError(null);
  };

  const handleCreateBrand = async () => {
    const normalizedName = query.trim();
    if (!normalizedName) return;

    // Client-side duplicate check
    if (isDuplicate) {
      setError(`Brand "${normalizedName}" already exists.`);
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('brands')
        .insert({ name: normalizedName })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Unique violation
           setError(`Brand "${normalizedName}" already exists.`);
           // Optionally select it anyway
           // handleSelect(normalizedName);
        } else {
          throw error;
        }
      } else if (data) {
        // Success
        const newBrand = { id: data.id, name: data.name };
        setBrands(prev => [...prev, newBrand].sort((a, b) => a.name.localeCompare(b.name)));
        saveLocalBrand(newBrand);
        handleSelect(data.name);
      }
    } catch (error: any) {
      console.error('Error creating brand:', error);
      setError('Failed to create brand. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          className={`w-full rounded-md border py-2 pl-10 pr-10 shadow-sm focus:outline-none focus:ring-1 sm:text-sm ${
            error 
              ? 'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500' 
              : 'border-gray-300 bg-white focus:border-indigo-500 focus:ring-indigo-500'
          }`}
          placeholder="Search or add brand..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setError(null);
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

      {error && (
        <div className="mt-1 flex items-center text-xs text-red-600">
          <AlertCircle className="h-3 w-3 mr-1" />
          {error}
        </div>
      )}

      {isOpen && (
        <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
          {/* Create Option */}
          {!isDuplicate && query.trim() !== '' && (
            <li
              className="relative cursor-pointer select-none py-2 pl-3 pr-9 text-indigo-600 hover:bg-indigo-50 border-b border-gray-100"
              onClick={handleCreateBrand}
            >
              <div className="flex items-center">
                <Plus className="mr-2 h-4 w-4" />
                {loading ? 'Adding...' : `Add new brand "${query}"`}
              </div>
            </li>
          )}

          {/* List Options */}
          {filteredBrands.length === 0 && query.trim() === '' ? (
            <li className="relative cursor-default select-none py-2 pl-3 pr-9 text-gray-500">
              Start typing to search...
            </li>
          ) : filteredBrands.length === 0 && isDuplicate ? (
             // If duplicate, it will appear in the list below anyway, but handle empty search case
             null
          ) : (
            filteredBrands.map((brand) => (
              <li
                key={brand.id}
                className={`relative cursor-pointer select-none py-2 pl-3 pr-9 ${
                  brand.name === value ? 'bg-indigo-600 text-white' : 'text-gray-900 hover:bg-indigo-50'
                }`}
                onClick={() => handleSelect(brand.name)}
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
            ))
          )}
        </ul>
      )}
    </div>
  );
}
