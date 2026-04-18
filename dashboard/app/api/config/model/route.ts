export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getCurrentModelInfo } from "@/lib/model-info";

export async function GET() {
  const modelInfo = getCurrentModelInfo();

  return NextResponse.json({
    model: modelInfo.model,
    displayName: modelInfo.displayName,
    provider: modelInfo.provider,
    inputCostPerToken: modelInfo.inputCost,
    outputCostPerToken: modelInfo.outputCost,
    budgetEnabled: modelInfo.budgetEnabled,
    budgetCap: modelInfo.budgetCap,
  });
}
