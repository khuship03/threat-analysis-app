// import path from "path";
// import { defineConfig } from "prisma/config";
// import * as dotenv from "dotenv";

// dotenv.config({ path: path.join(__dirname, ".env") });

// export default defineConfig({
//   earlyAccess: true,
//   schema: path.join("prisma", "schema.prisma"),
//   migrate: {
//        url: process.env.DATABASE_URL!,
//     adapter: async () => {
//       const { PrismaPg } = await import("@prisma/adapter-pg");
//       const { default: pg } = await import("pg");
//       const pool = new pg.Pool({
//         connectionString: process.env.DATABASE_URL,
//       });
//       return new PrismaPg(pool);
//     },
//   },
// });

import path from "path";
import { defineConfig } from "prisma/config";
import * as dotenv from "dotenv";

dotenv.config({ path: path.join(__dirname, ".env") });

export default defineConfig({
  earlyAccess: true,
  schema: path.join("prisma", "schema.prisma"),

  datasource: {
    url: process.env.DATABASE_URL!,
  },

  migrate: {
    url: process.env.DATABASE_URL!,
    adapter: async () => {
      const { PrismaPg } = await import("@prisma/adapter-pg");
      const { default: pg } = await import("pg");

      const pool = new pg.Pool({
        connectionString: process.env.DATABASE_URL,
      });

      return new PrismaPg(pool);
    },
  },
});