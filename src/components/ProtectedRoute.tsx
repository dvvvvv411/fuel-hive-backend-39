
import { Navigate } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';

interface ProtectedRouteProps {
  children: React.ReactNode;
  session: Session | null;
}

export function ProtectedRoute({ children, session }: ProtectedRouteProps) {
  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}
