import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import TemplateLoader from './plugins/template-plugin'
import path from 'path';

export default defineConfig({
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    plugins: [
        tailwindcss(),
        TemplateLoader(),
    ]
});