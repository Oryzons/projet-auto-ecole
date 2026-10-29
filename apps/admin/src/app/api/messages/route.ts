import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { EventType } from "@/lib/db/client";
import { logEvent, getAdminUsers } from "@/lib/applications";
import { sendNewMessageEmail } from "@/lib/email";
import { rateLimit, tooManyRequests } from "@/lib/rate-limit";
import { resolveDbUser } from "@/lib/session";
import { publishToAdmins, publishToUser, type SSEEvent } from "@/lib/sse-broker";

const messageSchema = z.object({
  applicationId: z.string(),
  content: z.string().trim().min(1).max(5000),
});

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await resolveDbUser(session);
  if (!dbUser) {
    return NextResponse.json(
      { error: "Session expirée — reconnectez-vous" },
      { status: 401 },
    );
  }

  // La messagerie relie un élève à l'administration : le moniteur n'y a pas accès.
  if (dbUser.role !== "ADMIN" && dbUser.role !== "CANDIDATE") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const applicationId = searchParams.get("applicationId");

  if (!applicationId) {
    return NextResponse.json({ error: "Missing applicationId" }, { status: 400 });
  }

  const app = await prisma.permitApplication.findFirst({
    where: {
      id: applicationId,
      organizationId: dbUser.organizationId,
      ...(dbUser.role === "CANDIDATE" ? { candidateId: dbUser.id } : {}),
    },
  });

  if (!app) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const messages = await prisma.message.findMany({
    where: { applicationId },
    include: {
      sender: {
        select: { id: true, firstName: true, lastName: true, role: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  await prisma.message.updateMany({
    where: {
      applicationId,
      readAt: null,
      NOT: { senderId: dbUser.id },
    },
    data: { readAt: new Date() },
  });

  return NextResponse.json({ messages });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await resolveDbUser(session);
  if (!dbUser) {
    return NextResponse.json(
      { error: "Session expirée — reconnectez-vous" },
      { status: 401 },
    );
  }

  // La messagerie relie un élève à l'administration : le moniteur n'y a pas accès.
  if (dbUser.role !== "ADMIN" && dbUser.role !== "CANDIDATE") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const limit = rateLimit(`messages:${dbUser.id}`, { limit: 20, windowMs: 10 * 60 * 1000 });
  if (!limit.ok) return tooManyRequests(limit.retryAfterSeconds);

  try {
    const body = await req.json();
    const { applicationId, content } = messageSchema.parse(body);

    const app = await prisma.permitApplication.findFirst({
      where: {
        id: applicationId,
        organizationId: dbUser.organizationId,
        ...(dbUser.role === "CANDIDATE" ? { candidateId: dbUser.id } : {}),
      },
      include: { candidate: true },
    });

    if (!app) {
      return NextResponse.json(
        { error: "Dossier introuvable ou accès refusé" },
        { status: 404 },
      );
    }

    const message = await prisma.message.create({
      data: {
        applicationId,
        senderId: dbUser.id,
        content,
      },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
      },
    });

    await logEvent(applicationId, EventType.MESSAGE_SENT, dbUser.id);

    await prisma.permitApplication.update({
      where: { id: applicationId },
      data: { updatedAt: new Date() },
    });

    const senderName = `${dbUser.firstName} ${dbUser.lastName}`;
    const preview = content.slice(0, 100) + (content.length > 100 ? "..." : "");

    try {
      if (dbUser.role === "CANDIDATE") {
        const admins = await getAdminUsers(dbUser.organizationId);
        for (const admin of admins) {
          await sendNewMessageEmail(
            admin.email,
            senderName,
            preview,
            applicationId,
            "ADMIN"
          );
        }
      } else {
        await sendNewMessageEmail(
          app.candidate.email,
          senderName,
          preview,
          applicationId,
          "CANDIDATE"
        );
      }
    } catch (emailErr) {
      console.error("Email notification failed:", emailErr);
    }

    const messageEvent: SSEEvent = {
      type: "message",
      data: {
        applicationId,
        messageId: message.id,
        senderId: dbUser.id,
        senderName,
        preview,
      },
    };
    publishToAdmins(dbUser.organizationId, messageEvent);
    if (dbUser.role === "ADMIN") {
      publishToUser(app.candidateId, messageEvent);
    }

    return NextResponse.json({ message });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Message invalide — vérifiez le contenu" },
        { status: 400 }
      );
    }
    console.error("Message error:", error);
    return NextResponse.json(
      { error: "Impossible d'envoyer le message. Reconnectez-vous si le problème persiste." },
      { status: 500 },
    );
  }
}
