var _a, _b, _c, _d, _e;
import { __rest } from "tslib";
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { stripDevIcons, crxI18n } from './custom-vite-plugins';
import manifest from './manifest.json';
import devManifest from './manifest.dev.json';
import pkg from './package.json';
import { ProviderList } from './src/providers/provider.list';
const isDev = process.env.NODE_ENV === 'development';
// set this flag to true, if you want localization support
const localize = false;
const merge = isDev ? devManifest : {};
const _f = ((_a = manifest === null || manifest === void 0 ? void 0 : manifest.content_scripts) === null || _a === void 0 ? void 0 : _a[0]) || {}, { matches } = _f, rest = __rest(_f, ["matches"]);
export const baseManifest = Object.assign(Object.assign(Object.assign(Object.assign({}, manifest), { host_permissions: [
        ...ProviderList.map((p) => p.baseUrl + '/'),
        ((_b = import.meta.env) === null || _b === void 0 ? void 0 : _b.FRONTEND_URL) || ((_c = process === null || process === void 0 ? void 0 : process.env) === null || _c === void 0 ? void 0 : _c.FRONTEND_URL) + '/*',
    ], permissions: [...(manifest.permissions || [])], content_scripts: [
        Object.assign({ matches: ProviderList.reduce((all, p) => [...all, p.baseUrl + '/*'], [((_d = import.meta.env) === null || _d === void 0 ? void 0 : _d.FRONTEND_URL) || ((_e = process === null || process === void 0 ? void 0 : process.env) === null || _e === void 0 ? void 0 : _e.FRONTEND_URL) + '/*']) }, rest),
    ], version: pkg.version }), merge), (localize
    ? {
        name: '__MSG_extName__',
        description: '__MSG_extDescription__',
        default_locale: 'en',
    }
    : {}));
export const baseBuildOptions = {
    sourcemap: isDev,
    emptyOutDir: !isDev,
};
export default defineConfig({
    envPrefix: ['NEXT_PUBLIC_', 'FRONTEND_URL'],
    plugins: [
        tailwindcss(),
        tsconfigPaths(),
        react(),
        stripDevIcons(isDev),
        crxI18n({ localize, src: './src/locales' }),
    ],
    publicDir: resolve(__dirname, 'public'),
});
//# sourceMappingURL=vite.config.base.js.map