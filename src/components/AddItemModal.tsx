import { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Camera, Upload, X, Sparkles, Loader2, Save, Image as ImageIcon } from 'lucide-react';
import BrandSelector from './BrandSelector';
import { analyzeImage } from '../lib/qwen';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddItemModal({ isOpen, onClose, onSuccess }: AddItemModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<'upload' | 'analyzing' | 'confirm'>('upload');
  
  // Form State
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  
  const [category, setCategory] = useState('top');
  const [color, setColor] = useState('black');
  const [season, setSeason] = useState('all');
  const [brand, setBrand] = useState('');
  
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      // Reset state when closed
      setStep('upload');
      setFile(null);
      setPreviewUrl(null);
      setUploadedUrl(null);
      setCategory('top');
      setColor('black');
      setSeason('all');
      setBrand('');
      setMessage('');
      setAnalyzing(false);
      setSaving(false);
    }
  }, [isOpen]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      
      // Automatically start analysis flow
      setStep('analyzing');
      await performAnalysis(selectedFile);
    }
  };

  const uploadImage = async (fileToUpload: File): Promise<string> => {
    if (!user) throw new Error('User not logged in');
    
    const fileExt = fileToUpload.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from('clothing-images')
      .upload(fileName, fileToUpload);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('clothing-images')
      .getPublicUrl(fileName);
      
    return publicUrl;
  };

  const performAnalysis = async (selectedFile: File) => {
    setAnalyzing(true);
    setMessage('Uploading & Analyzing image...');
    
    try {
      // 1. Upload immediately
      const imageUrl = await uploadImage(selectedFile);
      setUploadedUrl(imageUrl);

      // 2. Call AI
      const result = await analyzeImage(imageUrl);
      
      // 3. Auto-fill
      if (result.category) setCategory(result.category);
      if (result.color) setColor(result.color);
      if (result.season) setSeason(result.season);
      
      setStep('confirm');
    } catch (error: any) {
      console.error('Analysis failed:', error);
      setMessage(`AI Analysis failed, please enter details manually.`);
      setStep('confirm'); // Go to confirm anyway to allow manual entry
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !uploadedUrl) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('clothing')
        .insert({
          user_id: user.id,
          image_url: uploadedUrl,
          category,
          color,
          season,
          brand,
        });

      if (error) throw error;

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error saving:', error);
      setMessage(`Error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl flex flex-col">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white z-10">
          <h3 className="text-lg font-bold text-gray-900">Add New Item</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <X size={24} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 flex-1">
          {step === 'upload' && (
             <div className="grid grid-cols-2 gap-4 h-64">
               {/* Camera Option */}
               <div 
                 onClick={() => cameraInputRef.current?.click()}
                 className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-all active:scale-95"
               >
                 <Camera className="w-12 h-12 text-indigo-500 mb-3" />
                 <p className="font-medium text-gray-700">Camera</p>
                 <input
                   ref={cameraInputRef}
                   type="file"
                   accept="image/*"
                   capture="environment"
                   className="hidden"
                   onChange={handleFileChange}
                 />
               </div>

               {/* Gallery Option */}
               <div 
                 onClick={() => galleryInputRef.current?.click()}
                 className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-all active:scale-95"
               >
                 <ImageIcon className="w-12 h-12 text-purple-500 mb-3" />
                 <p className="font-medium text-gray-700">Gallery</p>
                 <input
                   ref={galleryInputRef}
                   type="file"
                   accept="image/*"
                   className="hidden"
                   onChange={handleFileChange}
                 />
               </div>
             </div>
          )}

          {step === 'analyzing' && (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <div className="relative">
                <img src={previewUrl!} alt="Preview" className="w-32 h-32 object-cover rounded-lg opacity-50" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
                </div>
              </div>
              <p className="text-lg font-medium text-gray-900 animate-pulse">Analyzing with AI...</p>
              <p className="text-sm text-gray-500">Identifying category, color and season</p>
            </div>
          )}

          {step === 'confirm' && (
            <form onSubmit={handleSave} className="space-y-6">
              <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-gray-100">
                <img src={previewUrl!} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center">
                  <Sparkles className="w-3 h-3 mr-1" />
                  AI Analyzed
                </div>
              </div>

              {message && !message.includes('Analyzing') && (
                <div className="text-red-500 text-sm bg-red-50 p-2 rounded">{message}</div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm bg-white border"
                  >
                    <option value="top">Top</option>
                    <option value="bottom">Bottom</option>
                    <option value="shoes">Shoes</option>
                    <option value="outerwear">Outerwear</option>
                    <option value="accessory">Accessory</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Season</label>
                  <select
                    value={season}
                    onChange={(e) => setSeason(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm bg-white border"
                  >
                    <option value="all">All Year</option>
                    <option value="spring">Spring</option>
                    <option value="summer">Summer</option>
                    <option value="autumn">Autumn</option>
                    <option value="winter">Winter</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Color</label>
                  <select
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm bg-white border"
                  >
                    <option value="black">Black</option>
                    <option value="white">White</option>
                    <option value="grey">Grey</option>
                    <option value="beige">Beige</option>
                    <option value="navy">Navy</option>
                    <option value="blue">Blue</option>
                    <option value="red">Red</option>
                    <option value="green">Green</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                   <BrandSelector value={brand} onChange={setBrand} />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Confirm & Save
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
