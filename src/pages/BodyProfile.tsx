import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { User, Check } from 'lucide-react';

const BODY_SHAPES = [
  { id: 'rectangle', name: 'Rectangle', description: 'Shoulders, waist and hips are around the same size.' },
  { id: 'triangle', name: 'Triangle (Pear)', description: 'Hips are wider than shoulders.' },
  { id: 'inverted_triangle', name: 'Inverted Triangle', description: 'Shoulders are wider than hips.' },
  { id: 'hourglass', name: 'Hourglass', description: 'Hips and shoulders are similar, with a defined waist.' },
  { id: 'oval', name: 'Oval (Apple)', description: 'Waist is larger than shoulders and hips.' },
];

export default function BodyProfile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [selectedShape, setSelectedShape] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function loadProfile() {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('body_measurements, body_type_preset')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        if (data) {
          if (data.body_measurements) {
            setHeight(data.body_measurements.height || '');
            setWeight(data.body_measurements.weight || '');
          }
          setSelectedShape(data.body_type_preset || '');
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setMessage('');

    try {
      const updates = {
        id: user.id,
        body_measurements: {
          height,
          weight,
        },
        body_type_preset: selectedShape,
        updated_at: new Date(),
      };

      const { error } = await supabase
        .from('profiles')
        .upsert(updates);

      if (error) throw error;
      setMessage('Profile updated successfully!');
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading profile...</div>;

  return (
    <div className="max-w-md mx-auto space-y-6 pb-20">
      <h2 className="text-xl font-bold text-gray-900">Your Body Profile</h2>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Height (cm)</label>
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm border"
              placeholder="170"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Weight (kg)</label>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm border"
              placeholder="60"
            />
          </div>
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">Body Shape</label>
          <div className="grid grid-cols-1 gap-3">
            {BODY_SHAPES.map((shape) => (
              <div
                key={shape.id}
                onClick={() => setSelectedShape(shape.id)}
                className={`relative flex cursor-pointer rounded-lg border p-4 shadow-sm focus:outline-none ${
                  selectedShape === shape.id
                    ? 'border-indigo-600 ring-1 ring-indigo-600 bg-indigo-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="flex flex-1">
                  <div className="flex flex-col">
                    <span className="block text-sm font-medium text-gray-900">{shape.name}</span>
                    <span className="mt-1 flex items-center text-xs text-gray-500">{shape.description}</span>
                  </div>
                </div>
                {selectedShape === shape.id && (
                  <Check className="h-5 w-5 text-indigo-600" aria-hidden="true" />
                )}
              </div>
            ))}
          </div>
        </div>

        {message && (
          <div className={`text-sm ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
}
