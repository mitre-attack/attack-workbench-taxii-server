// import { Injectable } from "@nestjs/common";
import * as _cluster from "cluster";
// import * as child from "child_process";
const cluster = _cluster as unknown as _cluster.Cluster; // typings fix
import * as os from "os";
import * as dotenv from "dotenv";
import * as fs from "fs";
// import * as _ from "lodash";
import { bootstrap } from "./main";

const numCPUs = os.cpus().length;

const envConfig: Record<string, string> = dotenv.parse(
  // fs.readFileSync(`config/${process.env.TAXII_ENV}.env`)
  fs.readFileSync(`config/.env`)
);

// eslint-disable-next-line @typescript-eslint/ban-types
export function clusterize(callback: Function): void {
  // if (cluster.isMaster && !ConfigService.isDevEnvironment()) {
  if (cluster.isPrimary) {
    console.log(`MASTER SERVER (${process.pid}) IS RUNNING `);

    for (let i = 0; i < numCPUs; i++) {
      const child = cluster.fork(envConfig);
      console.log(`WORKER PROCESS (${child.id}) SPAWNED`);
    }

    cluster.on("exit", (worker, code, signal) => {
      console.log(`WORKER ${worker.process.pid} DIED`);
    });
  } else {
    callback();
  }
}

clusterize(bootstrap);
