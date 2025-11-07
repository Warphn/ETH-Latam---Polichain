// scriptsBaseServerWallet/faucet-spender.ts
import { CdpClient } from "@coinbase/cdp-sdk";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { createPublicClient, http } from "viem";
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

const arg = (process.argv[2] ?? "").trim();
const isAddr = (a: string) => /^0x[0-9a-fA-F]{40}$/.test(a);

if (!isAddr(arg)) {
  console.error("Uso:");
  console.error("  npx tsx scriptsBaseServerWallet/faucet-spender.ts 0xSEU_SPENDER");
  process.exit(1);
}

const SPENDER = arg as `0x${string}`;

async function main() {
  requireEnv("CDP_API_KEY_ID");
  requireEnv("CDP_API_KEY_SECRET");
  requireEnv("CDP_WALLET_SECRET");

  const cdp = new CdpClient();
  const publicClient = createPublicClient({ chain: baseSepolia, transport: http() });

  console.log("💧 Pedindo faucet para", SPENDER, "na Base Sepolia...");
  const { transactionHash } = await cdp.evm.requestFaucet({
    address: SPENDER,
    network: "base-sepolia",
    token: "eth",
  });

  const url = `https://sepolia.basescan.org/tx/${transactionHash}`;
  console.log("Faucet TX:", url);

  console.log("⏳ Aguardando confirmação do faucet...");
  await publicClient.waitForTransactionReceipt({ hash: transactionHash });
  console.log("✅ Faucet confirmado!");
}

main().catch(e => {
  console.error("Erro:", e);
  process.exit(1);
});
