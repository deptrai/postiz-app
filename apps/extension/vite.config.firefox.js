import { resolve } from 'path';
import { mergeConfig, defineConfig } from 'vite';
import { crx } from '@crxjs/vite-plugin';
import baseConfig, { baseManifest, baseBuildOptions } from './vite.config.base';
const outDir = resolve(__dirname, 'dist_firefox');
export default mergeConfig(baseConfig, defineConfig({
    plugins: [
        crx({
            manifest: Object.assign(Object.assign({}, baseManifest), { background: {
                    scripts: ['src/pages/background/index.ts'],
                } }),
            browser: 'firefox',
            contentScripts: {
                injectCss: true,
            },
        }),
    ],
    build: Object.assign(Object.assign({}, baseBuildOptions), { outDir }),
    publicDir: resolve(__dirname, 'public'),
}));
//# sourceMappingURL=vite.config.firefox.js.map