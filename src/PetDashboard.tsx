import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export const PetDashboard = () => {
  const [pets, setPets] = useState<any[]>([]);
  const [petName, setPetName] = useState('');
  const [species, setSpecies] = useState('');
  const [notes, setNotes] = useState(''); 
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null); // NEW: Track which pet is being edited

  const fetchPets = async () => {
    const { data, error } = await supabase.from('pets').select('*').order('created_at', { ascending: false });
    if (!error) setPets(data || []);
  };

  useEffect(() => { fetchPets(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingId) {
      // UPDATE existing pet
      const { error } = await supabase
        .from('pets')
        .update({ name: petName, species: species, notes: notes })
        .eq('id', editingId);
      
      if (!error) {
        setEditingId(null);
        alert("Patient updated successfully!");
      }
    } else {
      // INSERT new pet
      await supabase
        .from('pets')
        .insert([{ name: petName, species: species, notes: notes }]);
    }

    setPetName('');
    setSpecies('');
    setNotes('');
    fetchPets(); 
  };

  // NEW: Function to load pet data into the form for editing
  const startEdit = (pet: any) => {
    setEditingId(pet.id);
    setPetName(pet.name);
    setSpecies(pet.species);
    setNotes(pet.notes);
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll up to the form
  };

  const deletePet = async (id: string) => {
    const { error } = await supabase.from('pets').delete().eq('id', id);
    if (!error) fetchPets();
  };

  const filteredPets = pets.filter(pet => 
    pet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pet.species.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h2 style={{ color: '#2c3e50', textAlign: 'center' }}>Vet Patient Records</h2>
      
      <form onSubmit={handleSubmit} style={{ background: editingId ? '#fff3cd' : '#f4f7f6', padding: '20px', borderRadius: '12px', marginBottom: '20px', transition: '0.3s' }}>
        <h4 style={{ marginTop: 0 }}>{editingId ? '⚠️ Editing Patient' : 'Register New Patient'}</h4>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <input placeholder="Pet Name" value={petName} onChange={e => setPetName(e.target.value)} required style={{ flex: 1, padding: '10px' }} />
          <input placeholder="Species" value={species} onChange={e => setSpecies(e.target.value)} required style={{ flex: 1, padding: '10px' }} />
        </div>
        <textarea 
          placeholder="Medical History / Notes" 
          value={notes} 
          onChange={e => setNotes(e.target.value)} 
          style={{ width: '100%', height: '60px', marginBottom: '10px', padding: '10px', boxSizing: 'border-box' }}
        />
        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="submit" style={{ flex: 2, padding: '12px', background: '#3ecf8e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            {editingId ? 'Save Changes' : 'Add Patient'}
          </button>
          {editingId && (
            <button onClick={() => { setEditingId(null); setPetName(''); setSpecies(''); setNotes(''); }} style={{ flex: 1, background: '#95a5a6', color: 'white', border: 'none', borderRadius: '4px' }}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <input 
        type="text" 
        placeholder="🔍 Search patients..." 
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '20px', boxSizing: 'border-box' }}
      />

      <h3>Active Patients ({filteredPets.length})</h3>
      <div style={{ display: 'grid', gap: '15px' }}>
        {filteredPets.map(pet => (
          <div key={pet.id} style={{ border: '1px solid #eee', padding: '15px', borderRadius: '8px', background: 'white' }}>
            <div style={{ float: 'right' }}>
              <button onClick={() => startEdit(pet)} style={{ marginRight: '10px', color: '#3498db', background: 'none', border: 'none', cursor: 'pointer' }}>Edit</button>
              <button onClick={() => deletePet(pet.id)} style={{ color: '#ff4d4d', background: 'none', border: 'none', cursor: 'pointer' }}>Delete</button>
            </div>
            <h4 style={{ margin: '0 0 8px 0' }}>{pet.name} <span style={{ fontWeight: 'normal', color: '#95a5a6' }}>— {pet.species}</span></h4>
            <p style={{ margin: 0, fontSize: '0.95em', color: '#546e7a' }}>
              <strong>History:</strong> {pet.notes || 'No notes.'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
