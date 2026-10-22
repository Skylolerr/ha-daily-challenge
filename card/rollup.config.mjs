import nodeResolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";

// Single self-contained ES module, committed to the integration because
// HACS runs no build step.
export default {
  input: "src/daily-challenge-card.ts",
  output: {
    file: "../custom_components/daily_challenge/frontend/daily-challenge-card.js",
    format: "es",
    inlineDynamicImports: true,
  },
  plugins: [
    nodeResolve(),
    typescript({ include: ["src/**/*.ts"], noEmitOnError: true }),
    terser(),
  ],
};
