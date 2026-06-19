import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import templateLoader from './plugins/template-plugin'
import path from 'path';

export default defineConfig({
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    plugins: [
        tailwindcss(),
        // templateLoader(),
        {
            ...templateLoader(),
            enforce: 'pre'
        }
    ]
});