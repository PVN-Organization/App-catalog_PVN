import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient'; 
import type { Session } from '@supabase/supabase-js';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Kiểm tra phiên hiện có bằng client duy nhất
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Lắng nghe các thay đổi trạng thái xác thực bằng client duy nhất
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    // Dọn dẹp subscription khi component bị unmount
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="text-xl font-semibold text-gray-600">Đang tải ứng dụng...</div>
        </div>
    );
  }

  return (
    <>
      {!session ? <Auth /> : <Dashboard key={session.user.id} session={session} />}
    </>
  );
};

export default App;