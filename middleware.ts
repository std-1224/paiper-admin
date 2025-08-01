import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
  // Create a Supabase client for server-side operations
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Get the session from the request
  const { data: { session } } = await supabase.auth.getSession();

  // Define protected routes (all routes except login and auth callback)
  const protectedRoutes = ['/dashboard', '/admin', '/users', '/bars', '/inventory', '/orders', '/qr-codes', '/staff'];
  const isProtectedRoute = protectedRoutes.some(route => req.nextUrl.pathname.startsWith(route));
  const isAuthCallback = req.nextUrl.pathname === '/auth/callback';

  // Allow access to auth callback page without checks
  if (isAuthCallback) {
    return NextResponse.next();
  }

  // If accessing a protected route
  if (isProtectedRoute) {
    // If no session, redirect to login
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    // Check user approval status
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('approval_status')
        .eq('id', session.user.id)
        .single();

      if (error || !profile) {
        return NextResponse.redirect(new URL('/login', req.url));
      }

      // If user is not approved, redirect to login with pending status
      if (profile.approval_status === 'pending') {
        return NextResponse.redirect(new URL('/login?status=pending', req.url));
      }
    } catch (error) {
      console.error('Error checking approval status:', error);
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  // If accessing login page while authenticated and approved, redirect to dashboard
  if (req.nextUrl.pathname === '/login' && session) {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('approval_status')
        .eq('id', session.user.id)
        .single();

      if (!error && profile && profile.approval_status === 'approved') {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    } catch (error) {
      console.error('Error checking approval status:', error);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
