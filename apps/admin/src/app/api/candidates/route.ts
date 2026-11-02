import { randomBytes } from "crypto";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/db/client";
import { z } from "zod";
import { createCandidateSchema } from "@/lib/candidate-schema";
import { getOrCreateApplication } from "@/lib/applications";
import { sendCandidateInviteEmail, emailDelivered } from "@/lib/email";
import { requestOrigin } from "@/lib/request-origin";
import { hashPassword } from "@/lib/password";
import { createPasswordToken, passwordLink } from "@/lib/password-tokens";
import { findUserByEmail } from "@/lib/users";
import { getOrgSettings } from "@/lib/org";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = createCandidateSchema.parse(body);

    const existing = await findUserByEmail(session.user.organizationId, data.email);

    if (existing) {
      return NextResponse.json(
        { error: "Un élève existe déjà avec cet email" },
        { status: 409 }
      );
    }

    // Vérifié avant de créer le compte : pas de compte orphelin si le permis est refusé.
    const org = await prisma.organization.findUnique({
      where: { id: session.user.organizationId },
      select: { settings: true },
    });
    const offered = getOrgSettings(org?.settings).permitTypes;
    if (!offered.includes(data.permitType)) {
      return NextResponse.json({ error: "Ce permis n'est pas proposé." }, { status: 400 });
    }

    // Mot de passe aléatoire jamais communiqué : l'élève choisit le sien
    // via le lien d'activation envoyé par email.
    const passwordHash = await hashPassword(randomBytes(32).toString("hex"));

    const candidate = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || null,
        street: data.street,
        postalCode: data.postalCode,
        city: data.city,
        dateOfBirth: new Date(data.dateOfBirth),
        oedippNumber: data.oedippNumber || null,
        role: Role.CANDIDATE,
        organizationId: session.user.organizationId,
      },
    });

    const application = await getOrCreateApplication(
      candidate.id,
      session.user.organizationId,
      { partnerRate: data.partnerRate, permitType: data.permitType },
    );

    const activationToken = await createPasswordToken(candidate.id, "ACTIVATION");
    const inviteLink = passwordLink(activationToken, "ACTIVATION", requestOrigin(req));
    const sent = await sendCandidateInviteEmail(
      candidate.email,
      `${candidate.firstName} ${candidate.lastName}`,
      inviteLink,
    );

    return NextResponse.json({
      candidate: {
        id: candidate.id,
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        email: candidate.email,
        phone: candidate.phone,
        street: candidate.street,
        postalCode: candidate.postalCode,
        city: candidate.city,
        dateOfBirth: candidate.dateOfBirth?.toISOString() ?? null,
      },
      application: { id: application.id, status: application.status },
      inviteLink,
      emailSent: emailDelivered(sent),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Données invalides" },
        { status: 400 }
      );
    }
    console.error("Create candidate error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
