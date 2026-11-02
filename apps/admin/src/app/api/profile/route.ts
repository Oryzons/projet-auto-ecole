import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveDbUser } from "@/lib/session";
import { theoryCourseStatus } from "@/lib/theory-sessions";

const profileSchema = z.object({
  firstName: z.string().trim().min(1, "Le prénom est requis").max(80),
  lastName: z.string().trim().min(1, "Le nom est requis").max(80),
  phone: z.string().trim().max(30, "Le téléphone est trop long").optional().default(""),
  street: z.string().trim().max(160).optional().default(""),
  postalCode: z.string().trim().max(10).optional().default(""),
  city: z.string().trim().max(80).optional().default(""),
  dateOfBirth: z.string().trim().optional().default(""),
});

function emptyToNull(value: string) {
  return value.trim() ? value.trim() : null;
}

function toDateInput(value: Date | null) {
  return value ? value.toISOString().slice(0, 10) : "";
}

async function loadProfile() {
  const session = await auth();
  if (!session?.user) return null;

  const user = await resolveDbUser(session);
  if (!user) return null;

  const organization = await prisma.organization.findUnique({
    where: { id: user.organizationId },
    select: { name: true },
  });

  const theoryCourse = user.role === "CANDIDATE" ? await theoryCourseStatus(user.id) : undefined;
  // L'élève ne voit son numéro NEPH qu'une fois noté présent à la séance de code.
  const oedippLocked = Boolean(theoryCourse && theoryCourse.status !== "attended");

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone ?? "",
    profilePhotoUrl: user.profilePhotoUrl,
    street: user.street ?? "",
    postalCode: user.postalCode ?? "",
    city: user.city ?? "",
    dateOfBirth: toDateInput(user.dateOfBirth),
    oedippNumber: oedippLocked ? "" : (user.oedippNumber ?? ""),
    oedippLocked,
    organizationName: organization?.name ?? "",
    theoryCourse,
  };
}

export async function GET() {
  const profile = await loadProfile();
  if (!profile) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }

  return NextResponse.json({ profile });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }

  const user = await resolveDbUser(session);
  if (!user) {
    return NextResponse.json({ error: "Session expirée" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Informations invalides" },
      { status: 400 },
    );
  }

  const data = parsed.data;
  if (data.postalCode && !/^\d{5}$/.test(data.postalCode)) {
    return NextResponse.json(
      { error: "Le code postal doit contenir 5 chiffres" },
      { status: 400 },
    );
  }

  let dateOfBirth: Date | null = null;
  if (data.dateOfBirth) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data.dateOfBirth)) {
      return NextResponse.json(
        { error: "La date de naissance est invalide" },
        { status: 400 },
      );
    }
    dateOfBirth = new Date(data.dateOfBirth);
    if (Number.isNaN(dateOfBirth.getTime())) {
      return NextResponse.json(
        { error: "La date de naissance est invalide" },
        { status: 400 },
      );
    }
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      phone: emptyToNull(data.phone),
      street: emptyToNull(data.street),
      postalCode: emptyToNull(data.postalCode),
      city: emptyToNull(data.city),
      dateOfBirth,
    },
  });

  const profile = await loadProfile();
  return NextResponse.json({ profile });
}
