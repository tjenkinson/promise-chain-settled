import typescript from 'rollup-plugin-typescript2';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: 'src/promise-chain-settled.ts',
  plugins: [typescript(), resolve(), commonjs()],
  onwarn: (e) => {
    throw new Error(e);
  },
  output: [
    {
      name: 'PromiseChainSettled',
      file: 'dist/promise-chain-settled.js',
      format: 'umd',
    },
    {
      file: 'dist/promise-chain-settled.es.js',
      format: 'es',
    },
  ],
};
