import { defineConfig } from '@dethcrypto/eth-sdk';

export default defineConfig({
  outputPath: 'src/eth-sdk-build',
  contracts: {
    mainnet: {
      kasparov: '0x54A8265ADC50fD66FD0F961cfCc8B62DE0f2B57f',
      keep3r: '0xeb02addCfD8B773A5FFA6B9d1FE99c566f8c44CC',
      keep3rHelper: '0xd36ac9ff5562abb541f51345f340fb650547a661',
    },
  },
});
