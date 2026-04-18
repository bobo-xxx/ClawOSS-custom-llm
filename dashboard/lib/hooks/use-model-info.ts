import useSWR from "swr";

interface ModelInfo {
  model: string;
  displayName: string;
  provider: string;
  inputCostPerToken: number;
  outputCostPerToken: number;
  budgetEnabled: boolean;
  budgetCap: number | null;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useModelInfo() {
  const { data, error, isLoading } = useSWR<ModelInfo>(
    "/api/config/model",
    fetcher,
    { refreshInterval: 60000 }
  );

  return { data, error, isLoading };
}
