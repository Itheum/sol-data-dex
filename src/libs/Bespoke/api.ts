import axios from "axios";
import { uxConfig } from "libs/config";

export const getItheumPriceFromApi = async (): Promise<number | undefined> => {
  try {
    const url = "https://api.multiversx.com/tokens/ITHEUM-df6f26";
    const { data } = await axios.get<any>(url, {
      timeout: uxConfig.mxAPITimeoutMs,
    });

    return data.price;
  } catch (error) {
    console.error(error);
    return undefined;
  }
};
