import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode, isSsrBuild, isPreview }) => {
    return {
        plugins: [react()],
        envPrefix: 'THJ_LOGS',
        base: command === `serve` ? `/` : `/thj-logs/`
    }
});
