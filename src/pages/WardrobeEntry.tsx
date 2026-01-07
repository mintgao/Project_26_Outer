import { useState } from 'react';
import { Plus } from 'lucide-react';
import WardrobeGallery from '../components/WardrobeGallery';
import AddItemModal from '../components/AddItemModal';

export default function WardrobeEntry() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Force gallery refresh key
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="relative min-h-full pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">My Wardrobe</h2>
      </div>

      {/* Gallery Section (Default View) */}
      <WardrobeGallery key={refreshKey} />

      {/* Floating Action Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-indigo-600 rounded-full shadow-lg flex items-center justify-center text-white hover:bg-indigo-700 active:scale-95 transition-all z-40"
      >
        <Plus size={28} />
      </button>

      {/* Add Item Modal */}
      <AddItemModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={handleSuccess}
      />
    </div>
  );
}
