import { Job, JobWorkableGroup, makeid, prelog, toKebabCase } from '@keep3r-network/cli-utils';
import { getMainnetSdk } from '../../eth-sdk-build';
import metadata from './metadata.json';

const getWorkableTxs: Job['getWorkableTxs'] = async (args) => {
  // setup logs
  const correlationId = toKebabCase(metadata.name);
  const logMetadata = {
    job: metadata.name,
    block: args.advancedBlock,
    logId: makeid(5),
  };
  const logConsole = prelog(logMetadata);

  // skip job if already in progress
  if (args.skipIds.includes(correlationId)) {
    logConsole.log(`Skipping job`);
    return args.subject.complete();
  }

  logConsole.log(`Trying to work`);

  // setup job
  const signer = args.fork.ethersProvider.getSigner(args.keeperAddress);
  const { kasparov: job, keep3r, keep3rHelper } = getMainnetSdk(signer);
  try {
    const jobCredits = await keep3r.totalJobCredits(job.address, {
      blockTag: args.advancedBlock,
    });

    const moveGas = 500_000; // NOTE: testing on prod
    const moveCost = await keep3rHelper.callStatic.getRewardAmountFor(args.keeperAddress, moveGas, {
      blockTag: args.advancedBlock,
    });

    const estimateMoves = jobCredits.div(moveCost);
    logConsole.log(`Trying to work multiple (${estimateMoves}) times`);

    // TODO: what if estimateMoves is bigger than moves[] (inaccesible)
    await job.callStatic.workMany(estimateMoves.toNumber(), {
      blockTag: args.advancedBlock,
    });

    // check if job is workable

    logConsole.log(`Job is workable multiple (${estimateMoves}) times`);

    // create work tx
    const tx = await job.populateTransaction.workMany(estimateMoves, {
      nonce: args.keeperNonce,
      gasLimit: 15_000_000,
      type: 2,
    });

    // create a workable group every bundle burst
    const workableGroups: JobWorkableGroup[] = new Array(args.bundleBurst).fill(null).map((_, index) => ({
      targetBlock: args.targetBlock + index,
      txs: [tx],
      logId: `${logMetadata.logId}-${makeid(5)}`,
    }));

    // submit all bundles
    args.subject.next({
      workableGroups,
      correlationId,
    });
  } catch (err: unknown) {
    logConsole.warn('Simulation failed, probably out of credits');
  }

  try {
    // check if job is workable
    await job.callStatic.work({
      blockTag: args.advancedBlock,
    });

    logConsole.log(`Job is workable`);

    // create work tx
    const tx = await job.populateTransaction.work({
      nonce: args.keeperNonce,
      gasLimit: 3_000_000,
      type: 2,
    });

    // create a workable group every bundle burst
    const workableGroups: JobWorkableGroup[] = new Array(args.bundleBurst).fill(null).map((_, index) => ({
      targetBlock: args.targetBlock + index,
      txs: [tx],
      logId: `${logMetadata.logId}-${makeid(5)}`,
    }));

    // submit all bundles
    args.subject.next({
      workableGroups,
      correlationId,
    });
  } catch (err: unknown) {
    logConsole.warn('Simulation failed, probably out of credits');
  }

  // finish job process
  args.subject.complete();
};

module.exports = {
  getWorkableTxs,
} as Job;
