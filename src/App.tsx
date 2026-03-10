import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { RegisterVet } from './RegisterVet';
import { PetDashboard } from './PetDashboard';
import './index.css';

function App() {
  const [session, setSession] = useState<any>(null);

  // Check if a user is already logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>PetMind Vet Portal</h1>
      
      {!session ? (
        // Show registration if not logged in
        <div>
          <p>Please register to access your dashboard.</p>
          <RegisterVet />
        </div>
      ) : (
        // Show the dashboard and a logout button if logged in
        <div>
          <button onClick={() => supabase.auth.signOut()} style={{ float: 'right' }}>Logout</button>
          <PetDashboard />
        </div>
      )}
    </div>
  );
}

export default App;
