// scriptsBaseServerWallet/send-from-spender.ts
import { CdpClient } from "@coinbase/cdp-sdk";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { createPublicClient, http, parseEther } from "viem";
import { baseSepolia } from "viem/chains";

// carrega .env.local se existir; senão .env
const envLocal = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envLocal)) {
  dotenv.config({ path: envLocal });
} else {
  dotenv.config();
}

function requireEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

const FROM = "0xC33359a0B39bcf7180CC522ea380a4F442FbFe91";
const TO = "0x710747A90Ad648134f96a2Ff7B86991447e1aC69";
const isAddr = (a: string) => /^0x[0-9a-fA-F]{40}$/.test(a);

if (!isAddr(FROM) || !isAddr(TO)) {
  console.error("Uso:");
  console.error("  npx tsx scriptsBaseServerWallet/send-from-spender.ts 0xFROM 0xTO");
  process.exit(1);
}

async function main() {
  requireEnv("CDP_API_KEY_ID");
  requireEnv("CDP_API_KEY_SECRET");
  requireEnv("CDP_WALLET_SECRET");

  const cdp = new CdpClient();
  const publicClient = createPublicClient({ chain: baseSepolia, transport: http() });

  console.log(`🚀 Enviando 0.000001 ETH de ${FROM} para ${TO}...`);
  const { transactionHash } = await cdp.evm.sendTransaction({
    address: FROM as `0x${string}`,
    network: "base-sepolia",
    transaction: {
      to: TO as `0x${string}`,
      value: parseEther("0.000001"),
    },
  });

  const url = `https://sepolia.basescan.org/tx/${transactionHash}`;
  console.log("TX:", url);

  console.log("⏳ Aguardando confirmação...");
  const receipt = await publicClient.waitForTransactionReceipt({ hash: transactionHash });
  console.log("✅ Confirmada:", `https://sepolia.basescan.org/tx/${receipt.transactionHash}`);
}

main().catch(e => {
  console.error("Erro:", e);
  process.exit(1);
});
