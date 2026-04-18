export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db, ensureDb } from "@/lib/db";
import { metricsTokens } from "@/lib/schema";
import { sql } from "drizzle-orm";
import { getBudgetCapUsd, isBudgetEnabled } from "@/lib/budget-config";
import { calculateBudgetStatus } from "@/lib/budget-calculator";

export async function GET() {
  try {
    await ensureDb();

    const cap = getBudgetCapUsd();

    if (!isBudgetEnabled() || cap === null) {
      return NextResponse.json({ enabled: false });
    }

    const totalCostResult = await db
      .select({
        totalCost: sql<number>`COALESCE(SUM(cost_usd), 0)`,
      })
      .from(metricsTokens);

    const spent = totalCostResult[0]?.totalCost || 0;

    const budgetStatus = calculateBudgetStatus(spent, cap);

    if (!budgetStatus) {
      return NextResponse.json({ enabled: false });
    }

    return NextResponse.json({
      enabled: true,
      ...budgetStatus,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch budget status", details: String(error) },
      { status: 500 }
    );
  }
}
