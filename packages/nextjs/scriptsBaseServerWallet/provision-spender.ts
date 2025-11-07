// scriptsBaseServerWallet/provision-spender.ts
import { CdpClient } from "@coinbase/cdp-sdk";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

// carrega .env.local se existir; senão .env
const envLocal = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envLocal)) {
  dotenv.config({ path: envLocal });
} else {
  dotenv.config(); // .env
}

function requireEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

async function main() {
  // garante que as 3 variáveis existem
  requireEnv("CDP_API_KEY_ID");
  requireEnv("CDP_API_KEY_SECRET");
  requireEnv("CDP_WALLET_SECRET");

  const cdp = new CdpClient();

  // cria a conta EVM (spender)
  const account = await cdp.evm.createAccount();

  console.log("✅ EVM Server Wallet (spender) criada.");
  console.log("address:");
  console.log(account.address); // <-- só loga o address
}

main().catch(e => {
  console.error("Erro:", e);
  process.exit(1);
});
