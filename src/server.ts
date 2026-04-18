import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { execSync } from 'child_process';

// 在服务器启动时加载 Coze 环境变量
function loadCozeEnvVars() {
	// 如果已经是生产环境，直接返回
	if (process.env.NODE_ENV === 'production') return;

	try {
		const pythonCode = `
import os
from coze_workload_identity import Client

client = Client()
env_vars = client.get_project_env_vars()
client.close()

for env_var in env_vars:
    key = env_var.key
    value = env_var.value
    # 只处理 Supabase 相关变量
    if 'SUPABASE' in key:
        print(f"{key}={value}")
`;

		const output = execSync(`python3 -c '${pythonCode.replace(/'/g, "'\"'\"'")}'`, {
			encoding: 'utf-8',
			timeout: 10000,
			stdio: ['pipe', 'pipe', 'pipe'],
		});

		const lines = output.trim().split('\n');
		for (const line of lines) {
			if (!line || line.startsWith('#')) continue;
			const eqIndex = line.indexOf('=');
			if (eqIndex > 0) {
				const key = line.substring(0, eqIndex);
				let value = line.substring(eqIndex + 1);
				// 去除引号
				if ((value.startsWith("'") && value.endsWith("'")) || (value.startsWith('"') && value.endsWith('"'))) {
					value = value.slice(1, -1);
				}
				process.env[key] = value;
			}
		}
		console.log('[Dev Server] Loaded Coze Supabase environment variables');
	} catch (e) {
		console.log('[Dev Server] Using default .env.local configuration');
	}
}

// 立即加载环境变量
loadCozeEnvVars();

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '5000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
	createServer(async (req, res) => {
		try {
			const parsedUrl = parse(req.url!, true);
			await handle(req, res, parsedUrl);
		} catch (err) {
			console.error('Error occurred handling', req.url, err);
			res.statusCode = 500;
			res.end('Internal server error');
		}
	}).listen(port, () => {
		console.log(`> Server ready on http://${hostname}:${port}`);
	});
});
