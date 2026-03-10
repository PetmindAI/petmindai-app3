import React, { useState } from 'react';
import { supabase } from './supabaseClient';

export const RegisterVet = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [license, setLicense] = useState('');
  const [message, setMessage] = useState('');

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Create the user's login
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      setMessage(`Error: ${authError.message}`);
      return;
    }

    // 2. Insert their professional details into the 'profiles' table
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          { id: data.user.id, full_name: fullName, license_number: license }
        ]);

      if (profileError) setMessage(`Profile Error: ${profileError.message}`);
      else setMessage('Success! Please check your email to verify your account.');
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px' }}>
      <h2>Vet Registration</h2>
      <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <input type="text" placeholder="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} required />
        <input type="text" placeholder="License Number" value={license} onChange={e => setLicense(e.target.value)} required />
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
        <button type="submit" style={{ background: '#3ecf8e', color: 'white', border: 'none', padding: '10px', cursor: 'pointer' }}>
          Register as Vet
        </button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};
