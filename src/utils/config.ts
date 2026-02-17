import axios from "axios";
import config from "../config.json";

// Minimal shape for the API configuration response
interface ConfigResponse {
  key?: string;
  [k: string]: any;
}

/**
 * Fetch runtime configuration from the API.
 * Returns the server response or undefined on failure.
 */
async function getConfiguration(): Promise<ConfigResponse | undefined> {
  const key = localStorage.getItem("x-key") ?? undefined;
  try {
    const response = await axios.get<ConfigResponse>(`${config.apiUrl}/config`, {
      headers: { "x-key": key },
    });

    if (response.data?.key) {
      localStorage.setItem("x-key", response.data.key);
    }

    return response.data;
  } catch (error) {
    console.error("getConfiguration error:", error);
    return undefined;
  }
}

export default getConfiguration;
