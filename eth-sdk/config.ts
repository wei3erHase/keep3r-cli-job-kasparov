import { defineConfig } from '@dethcrypto/eth-sdk';

export default defineConfig({
	outputPath: 'src/eth-sdk-build',
	contracts: {
		mainnet: {
			kasparov: '0x54A8265ADC50fD66FD0F961cfCc8B62DE0f2B57f',
		},
	},
});
