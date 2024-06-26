import { GenezioDeploy, GenezioMethod } from "@genezio/types";
import fetch from "node-fetch";
import pg from "pg";
const { Pool } = pg;

type SuccessResponse = {
  status: "success";
  country: string;
  lat: number;
  lon: number;
  city: string;
};

type ErrorResponse = {
  status: "fail";
};

@GenezioDeploy()
export class BackendService {
  constructor() {}

  pool = new Pool({
    connectionString: process.env["SOLVEIT_DATABASE_URL"],
    ssl: true,
  });

  @GenezioMethod()
  async hello(name: string): Promise<string> {
    const ipLocation: SuccessResponse | ErrorResponse = await fetch(
      "http://ip-api.com/json/"
    )
      .then((res) => res.json() as Promise<SuccessResponse>)
      .catch(() => ({ status: "fail" }));

    if (ipLocation.status === "fail") {
      return `Hello ${name}! Failed to get the server location :(`;
    }

    const formattedTime = new Date().toLocaleString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    return `Hello ${name}! This response was served from ${ipLocation.city}, ${ipLocation.country} (${ipLocation.lat}, ${ipLocation.lon}) at ${formattedTime}`;
  }

  @GenezioMethod()
  async askOpenAI(imageUrl: string): Promise<string> {
    const endpoint = "https://api.openai.com/v1/chat/completions";
    const apiKey = process.env.OPENAI_SECRET_KEY;
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    };
    const data = {
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Is my solution correct?",
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
              },
            },
          ],
        },
      ],
      max_tokens: 300,
    };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const jsonResponse = await response.json();
      return JSON.stringify(jsonResponse);
    } catch (error) {
      console.error("There was an error with the fetch operation: ", error);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      return `Failed to send the request: ${error.message}`;
    }
  }

  @GenezioMethod()
  async getCredits(userId: string): Promise<string> {
    const result = await this.pool.query(
      "select * from credits where userId = $1",
      [userId]
    );
    return JSON.stringify(result.rows);
  }

  @GenezioMethod()
  async increaseCredits(userId: string): Promise<string> {
    await this.pool.query(
      "update credits set credits = credits + 10 where userId = $1",
      [userId]
    );
    const result = await this.pool.query(
      "select * from credits where userId = $1",
      [userId]
    );
    return JSON.stringify(result.rows);
  }

  @GenezioMethod()
  async decreaseCredits(userId: string): Promise<string> {
    await this.pool.query(
      "update credits set credits = credits - 1 where userId = $1",
      [userId]
    );
    const result = await this.pool.query(
      "select * from credits where userId = $1",
      [userId]
    );
    return JSON.stringify(result.rows);
  }
}
