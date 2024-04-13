import { GenezioDeploy } from "@genezio/types";
import pg from "pg";
const { Pool } = pg;

@GenezioDeploy()
export class PostgresService {
  pool = new Pool({
    connectionString: process.env["SOLVEIT_DATABASE_URL"],
    ssl: true,
  });

  async insertUser(name: string): Promise<string> {
    await this.pool.query(
      "CREATE TABLE IF NOT EXISTS users (id serial PRIMARY KEY,name VARCHAR(255))"
    );

    await this.pool.query("INSERT INTO users (name) VALUES ($1)", [name]);
    const result = await this.pool.query("select * from users");

    return JSON.stringify(result.rows);
  }
}
