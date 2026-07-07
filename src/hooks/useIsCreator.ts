import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useIsCreator() {
  const [loading, setLoading] = useState(true);
  const [isCreator, setIsCreator] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { if (!cancelled) { setLoading(false); setIsCreator(false); } return; }
      setEmail(user.email ?? null);
      const { data, error } = await supabase.rpc("is_creator", { _user_id: user.id });
      if (!cancelled) {
        setIsCreator(!error && !!data);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { loading, isCreator, email };
}
