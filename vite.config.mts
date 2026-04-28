import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
    base: "/p5-spectrum-visualizer/",
    plugins: [tsconfigPaths()],
    server: {
        port: 3000,
    },
    define: {
        __APP_ENV__: JSON.stringify(process.env),
    },
    resolve: {
        extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
    },
    test: {
        environment: "jsdom",
        setupFiles: "./src/setupTests.ts",
    },
});
