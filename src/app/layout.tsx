import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
	title: {
		default: '产品 HS 编码管理',
		template: '%s | 产品管理',
	},
	description: '产品英文品名和 HS 海关编码管理系统',
	openGraph: {
		title: '产品 HS 编码管理',
		description: '产品英文品名和 HS 海关编码管理系统',
		type: 'website',
	},
	robots: {
		index: true,
		follow: true,
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="zh-CN">
			<body className="antialiased">{children}</body>
		</html>
	);
}
