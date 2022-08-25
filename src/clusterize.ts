// import { Injectable } from "@nestjs/common";
import * as _cluster from "cluster";
const cluster = _cluster as unknown as _cluster.Cluster; // typings fix
import * as os from "os";
import * as dotenv from "dotenv";
import * as fs from "fs";

import * as _ from "lodash";
import * as child from "child_process";

const env = _.clone(
  dotenv.parse(
    // fs.readFileSync(`config/${process.env.TAXII_ENV}.env`)
    fs.readFileSync(`config/.env`)
  )
);

import { bootstrap } from "./main";

const numCPUs = os.cpus().length;

// const envConfig: Record<string, string> = dotenv.parse(
//   // fs.readFileSync(`config/${process.env.TAXII_ENV}.env`)
//   fs.readFileSync(`config/.env`)
// );

// @Injectable()
// export class ClusterService {
//   static clusterize(callback: Function): void {
//     if (cluster.isMaster) {
//       console.log(`MASTER SERVER (${process.pid}) IS RUNNING `);
//
//       child.fork("./dist/main", {
//         env: envConfig,
//       });
//
//       // for (let i = 0; i < 4; i++) {
//       //   child.fork("./dist/main", {
//       //     env: envConfig,
//       //   });
//       // }
//
//       cluster.on("exit", (worker, code, signal) => {
//         console.log(`worker ${worker.process.pid} died`);
//       });
//     } else {
//       callback();
//     }
//   }
// }

// eslint-disable-next-line @typescript-eslint/ban-types
export function clusterize(): void {
  // if (cluster.isMaster && !ConfigService.isDevEnvironment()) {
  if (cluster.isPrimary) {
    console.log(`MASTER SERVER (${process.pid}) IS RUNNING `);

    for (let i = 0; i < numCPUs; i++) {
      const c = child.fork("./dist/main", { env: env });
      // const child = cluster.fork(envConfig);
      // child.process["env"] = envConfig;
      console.log(`WORKER PROCESS (${c.pid}) SPAWNED`);
    }

    cluster.on("exit", (worker, code, signal) => {
      console.log(`WORKER ${worker.process.pid} DIED`);
    });
  } else {
    bootstrap();
  }
}

clusterize();
