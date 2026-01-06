import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Trash2 } from 'lucide-react';

interface ClothingItem {
  id: string;
  image_url: string;
  category: string;
  color: string;
  season: string;
}

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'top', label: 'Tops' },
  { id: 'bottom', label: 'Bottoms' },
  { id: 'shoes', label: 'Shoes' },
  { id: 'outerwear', label: 'Outerwear' },
  { id: 'accessory', label: 'Accessories' },
];

export default function WardrobeGallery() {
  const { user } = useAuth();
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchItems();
  }, [user]);

  const fetchItems = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('clothing')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, imageUrl: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      // 1. Delete from database
      const { error: dbError } = await supabase
        .from('clothing')
        .delete()
        .eq('id', id);
      
      if (dbError) throw dbError;

      // 2. Delete from storage (optional, but good practice)
      // Extract file path from URL if needed, or rely on bucket policies
      // For simplicity in MVP, we might skip strict storage cleanup or handle it via trigger

      // Update local state
      setItems(items.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item');
    }
  };

  const filteredItems = activeTab === 'all' 
    ? items 
    : items.filter(item => item.category === activeTab);

  if (loading) return <div className="text-center py-4">Loading wardrobe...</div>;

  return (
    <div className="mt-8 space-y-4">
      <h3 className="text-lg font-bold text-gray-900">Your Collection</h3>
      
      {/* Category Tabs */}
      <div className="flex overflow-x-auto pb-2 -mx-4 px-4 space-x-2 scrollbar-hide">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveTab(cat.id)}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeTab === cat.id
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Gallery Grid */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed">
          <p>No items found in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {filteredItems.map((item) => (
            <div key={item.id} className="group relative aspect-[3/4] rounded-lg overflow-hidden bg-gray-100 shadow-sm">
              <img
                src={item.image_url}
                alt={item.category}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  onClick={() => handleDelete(item.id, item.image_url)}
                  className="p-2 bg-white rounded-full text-red-600 hover:bg-red-50"
                  title="Delete Item"
                >
                  <Trash2 size={20} />
                </button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                <div className="flex justify-between items-end text-white text-xs">
                  <span className="capitalize">{item.color}</span>
                  <span className="capitalize">{item.season}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
