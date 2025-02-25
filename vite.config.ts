import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

// https://vitejs.dev/config/
export default defineConfig(({ command, mode, isSsrBuild, isPreview }) => {
    return {
        plugins: [react({ tsDecorators: true })],
        envPrefix: 'THJ_LOGS',
        base: command === `serve` ? `/` : `/thj-logs/`,
    };
});
