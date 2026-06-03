import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
		runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
	},
	kit: {
		// 순수 SPA(ssr=false) → 정적 빌드. Cloudflare Pages 등 어떤 정적 호스트에도 배포 가능.
		// fallback: SPA 라우팅용 단일 엔트리. Cloudflare Pages는 static/_redirects로 모든 경로를 여기로 보낸다.
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: 'index.html',
			precompress: false,
			strict: false
		})
	}
};

export default config;
