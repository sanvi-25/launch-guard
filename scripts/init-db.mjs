import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
if (!process.env.DATABASE_URL) throw new Error("Set DATABASE_URL first");
const sql = neon(process.env.DATABASE_URL);
await sql(readFileSync("schema.sql", "utf8"));
console.log("risk_audits table ready");
