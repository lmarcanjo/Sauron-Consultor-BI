/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from "fs";
import * as path from "path";

export interface DoctorDiagnosis {
  success: boolean;
  nodeVersion: string;
  nodeVersionOk: boolean;
  packageManager: string;
  packageManagerOk: boolean;
  postgresUrlPresent: boolean;
  redisUrlPresent: boolean;
  envsMinimasOk: boolean;
  missingEnvs: string[];
  apiHealthOk: boolean;
}

/**
 * F5-XI: SAURON DOCTOR DIAGNOSTICS SUITE
 * 
 * Inspects host compatibility, local manifest locks, environment variables, 
 * database connection strings, and downstream health liveness.
 */
export async function runDoctorChecks(): Promise<DoctorDiagnosis> {
  const diagnosis: DoctorDiagnosis = {
    success: true,
    nodeVersion: process.version,
    nodeVersionOk: false,
    packageManager: "unknown",
    packageManagerOk: false,
    postgresUrlPresent: false,
    redisUrlPresent: false,
    envsMinimasOk: true,
    missingEnvs: [],
    apiHealthOk: false,
  };

  // 1. Node Version Validation (Sauron requires Node >= 18)
  const majorVersion = parseInt(process.version.replace("v", "").split(".")[0], 10);
  diagnosis.nodeVersionOk = majorVersion >= 18;
  if (!diagnosis.nodeVersionOk) {
    diagnosis.success = false;
  }

  // 2. Package Manager Lock Checks
  const hasNpmLock = fs.existsSync(path.join(process.cwd(), "package-lock.json"));
  const hasYarnLock = fs.existsSync(path.join(process.cwd(), "yarn.lock"));
  const hasPnpmLock = fs.existsSync(path.join(process.cwd(), "pnpm-lock.yaml"));

  if (hasNpmLock) {
    diagnosis.packageManager = "npm";
    diagnosis.packageManagerOk = true;
  } else if (hasYarnLock) {
    diagnosis.packageManager = "yarn";
    diagnosis.packageManagerOk = true;
  } else if (hasPnpmLock) {
    diagnosis.packageManager = "pnpm";
    diagnosis.packageManagerOk = true;
  }

  // 3. PostgreSQL and Redis Presence Checks
  // Check process.env directly (fallback to mock reading of a local .env if process.env is empty during mock tests)
  const dbUrl = process.env.DATABASE_URL;
  const redisUrl = process.env.REDIS_URL;

  diagnosis.postgresUrlPresent = !!dbUrl && dbUrl.startsWith("postgresql://");
  diagnosis.redisUrlPresent = !!redisUrl && redisUrl.startsWith("redis://");

  // 4. Minimum Environment Variables Configuration
  const requiredEnvs = [
    "DATABASE_URL",
    "REDIS_URL",
    "JWT_SECRET",
    "JWT_REFRESH_SECRET",
    "API_PORT",
    "WEB_PORT",
    "NODE_ENV",
    "CORS_ORIGIN"
  ];

  for (const envKey of requiredEnvs) {
    if (!process.env[envKey]) {
      diagnosis.missingEnvs.push(envKey);
    }
  }

  if (diagnosis.missingEnvs.length > 0) {
    diagnosis.envsMinimasOk = false;
    diagnosis.success = false;
  }

  // 5. API Health Check Probe (gracefully catching errors if the container is offline)
  const apiPort = process.env.API_PORT || "3001";
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1000); // 1s fast limit
    
    const res = await fetch(`http://localhost:${apiPort}/api/v1/health`, { signal: controller.signal });
    clearTimeout(timeoutId);
    diagnosis.apiHealthOk = res.ok;
  } catch {
    // Expected during doctor execution when services are not yet actively running
    diagnosis.apiHealthOk = false;
  }

  return diagnosis;
}

// Support executing directly via CLI (tsx scripts/sauron-doctor.ts)
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("\n=======================================================");
  console.log("             🛡️  SAURON DIAGNOSTICS DOCTOR             ");
  console.log("=======================================================\n");

  runDoctorChecks().then((report) => {
    console.log(`[Node Engine] Version: ${report.nodeVersion} (${report.nodeVersionOk ? "OK" : "OUTDATED - NEED >=18"})`);
    console.log(`[Package Manager] Client detected: ${report.packageManager} (Lock: ${report.packageManagerOk ? "YES" : "NO"})`);
    console.log(`[PostgreSQL DB] URL Present in Config: ${report.postgresUrlPresent ? "YES" : "NO"}`);
    console.log(`[Redis Cache] URL Present in Config: ${report.redisUrlPresent ? "YES" : "NO"}`);
    
    if (report.envsMinimasOk) {
      console.log("[Environment] All core security, port, and CORS variables are initialized.");
    } else {
      console.warn(`[Environment] CRITICAL - Missing variables: ${report.missingEnvs.join(", ")}`);
    }

    console.log(`[API Connection] Liveness probe status: ${report.apiHealthOk ? "ONLINE" : "OFFLINE (Expected if not running)"}`);

    if (report.success) {
      console.log("\n✅ DIAGNOSIS: Sauron Platform Backbone Bootstrapped Successfully!\n");
      process.exit(0);
    } else {
      console.error("\n❌ DIAGNOSIS: Environmental violations detected. Review log above!\n");
      process.exit(1);
    }
  }).catch((err) => {
    console.error("Critical doctor failure:", err);
    process.exit(1);
  });
}
