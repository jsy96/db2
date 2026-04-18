import { NextResponse } from 'next/server';

export async function GET() {
	// 优先使用 NEXT_PUBLIC_ 环境变量（Vercel）
	let url = process.env.NEXT_PUBLIC_SUPABASE_URL;
	let anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

	// 如果未配置，尝试使用 Coze 平台变量（开发环境）
	if (!url || url.includes('your-project') || !anonKey || anonKey.includes('your-')) {
		url = process.env.COZE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
		anonKey = process.env.COZE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
	}

	return NextResponse.json({ url, anonKey });
}
