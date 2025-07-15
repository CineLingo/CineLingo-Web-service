'use client';

import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { FcGoogle } from 'react-icons/fc';

export function GoogleAuthButton() {
  const supabase = createClient();

  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    });
  };

  return (
    <Button variant="outline" className="w-full" onClick={handleSignIn}>
      <FcGoogle className="mr-2 h-4 w-4" />
      Continue with Google
    </Button>
  );
}
