/**
 * POST /api/tasks/complete
 *
 * Body: { taskId: string; listId: string }
 *
 * Marks the given Google Task as completed (status=completed, completed timestamp).
 * Server-only. Reads and refreshes OAuth token from disk as needed.
 */

import { NextResponse, type NextRequest } from "next/server";
import { getAccessToken, completeTask } from "@/lib/google-tasks-server";

export async function POST(req: NextRequest) {
  let body: { taskId?: string; listId?: string };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { taskId, listId } = body;

  if (!taskId || !listId) {
    return NextResponse.json(
      { error: "Missing required fields: taskId, listId" },
      { status: 400 }
    );
  }

  try {
    const accessToken = await getAccessToken();
    const updated = await completeTask(accessToken, listId, taskId);
    return NextResponse.json({ success: true, task: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[/api/tasks/complete] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
