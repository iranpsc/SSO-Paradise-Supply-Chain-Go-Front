import { execFileSync } from "node:child_process";
import path from "node:path";
export default async function setup() {
 return async () => { execFileSync("go", ["run", "./cmd/testdb", "--drop"], { cwd: path.resolve(process.env.SSO_BACKEND_DIR ?? "../SSO-Paradise-Supply-Chain-Go"), env: process.env, stdio: "inherit" }); };
}
