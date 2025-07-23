import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function middleware(req: NextRequest) {
	// const { data: { session } } = await supabase.auth.getSession( )
	// // Rutas protegidas para admin
	// const adminRoutes = ['/admin', '/dashboard']
	// if (adminRoutes.includes(req.nextUrl.pathname)) {
	// if (!session || session.user.user_metadata.role !== 'admin') {
	//     return NextResponse.redirect(new URL('/login', req.url))
	// }
	// }
	// return NextResponse.next()
}
