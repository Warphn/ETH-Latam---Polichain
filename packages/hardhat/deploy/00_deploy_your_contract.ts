import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * Deploys the TransferWithFee contract using the deployer account.
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployTransferWithFee: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy, log } = hre.deployments;

  // ==============================
  // Deploy parameters
  // ==============================
  const initialFeePercent = 2; // 2% de taxa inicial

  log("----------------------------------------------------");
  log("🚀 Deploying TransferWithFee Contract...");
  log(`👤 Deployer: ${deployer}`);
  log(`💰 Initial Fee Percent: ${initialFeePercent}%`);

  const deployment = await deploy("TransferWithFee", {
    from: deployer,
    args: [initialFeePercent],
    log: true,
    autoMine: true, // acelera deploy na rede local
  });

  log("✅ TransferWithFee deployed at:", deployment.address);

  // Recupera o contrato para interagir após o deploy
  const transferWithFee = await hre.ethers.getContract<Contract>("TransferWithFee", deployer);

  const owner = await transferWithFee.owner();
  const feePercent = await transferWithFee.feePercent();

  log("👑 Owner address:", owner);
  log(`💸 Current feePercent: ${feePercent.toString()}%`);
  log("----------------------------------------------------");
};

export default deployTransferWithFee;

// Tags para execução seletiva: yarn deploy --tags TransferWithFee
deployTransferWithFee.tags = ["TransferWithFee"];
