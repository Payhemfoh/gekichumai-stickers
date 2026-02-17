import axios from "axios";
import config from "../config.json";

// Minimal shape for the API response the client expects
interface LogResponse {
  key?: string;
  [k: string]: any;
}

/**
 * Send a usage log to the API.
 * @returns the parsed response from the server or undefined on failure
 */
async function log(id: string, name: string, type: string): Promise<LogResponse | undefined> {
  const key = localStorage.getItem("x-key") ?? undefined;
  try {
    const response = await axios.post<LogResponse>(
      `${config.apiUrl}/log`,
      { id, name, type },
      { headers: { "x-key": key } }
    );

    if (response.data?.key) {
      localStorage.setItem("x-key", response.data.key);
    }

    return response.data;
  } catch (error) {
    console.error("log error:", error);
    return undefined;
  }
}

export default log;
