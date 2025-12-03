import "dotenv/config"; // --> WAJIB, supaya .env terbaca
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: env("DATABASE_URL"), // sekarang .env akan terbaca
  },
});
