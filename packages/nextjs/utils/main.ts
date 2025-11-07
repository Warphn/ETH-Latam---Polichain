import { CdpClient } from "@coinbase/cdp-sdk";
import dotenv from "dotenv";

dotenv.config();

export const cdp = new CdpClient(); // lê as variáveis do .env
