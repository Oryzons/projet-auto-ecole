import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import { normalizeEmail } from "./email-address";
import { passwordVersion, verifyPassword } from "./password";
import { clientIp, rateLimit, resetRateLimit } from "./rate-limit";
import { getCurrentOrganization } from "./org";
import { authConfig } from "./auth.config";
import { INACTIVITY_LIMIT_MS } from "./activity";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      role: "ADMIN" | "CANDIDATE" | "SKIPPER";
      firstName: string;
      lastName: string;
      organizationId: string;
    };
  }
  interface User {
    role: "ADMIN" | "CANDIDATE" | "SKIPPER";
    firstName: string;
    lastName: string;
    organizationId: string;
    pwdv?: string;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: "ADMIN" | "CANDIDATE" | "SKIPPER";
    firstName: string;
    lastName: string;
    organizationId: string;
    pwdv?: string;
    checkedAt?: number;
  }
}

/** Erreur renvoyée au formulaire de connexion quand la limite d'essais est atteinte. */
class TooManyAttempts extends CredentialsSignin {
  code = "rate_limited";
}

// Hash bcrypt valide d'un mot de passe aléatoire, utilisé pour les emails inconnus.
const DUMMY_HASH = "$2b$12$kBY7zWzAheJ3Zx8HWbQdme8ucEcX0hpOjnPPZECcgpQH5ROhvdJTW";

/** Délai entre deux relectures de l'utilisateur en base pour rafraîchir le jeton. */
const TOKEN_REFRESH_MS = 60_000;

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.organizationId = user.organizationId;
        token.pwdv = user.pwdv;
        token.checkedAt = Date.now();
        return token;
      }

      if (!token.email || !token.organizationId) return null;

      const checkedAt = typeof token.checkedAt === "number" ? token.checkedAt : 0;
      if (Date.now() - checkedAt < TOKEN_REFRESH_MS) return token;

      const dbUser = await prisma.user.findUnique({
        where: {
          email_organizationId: {
            email: token.email,
            organizationId: token.organizationId as string,
          },
        },
      });

      // Compte supprimé, ou mot de passe changé depuis l'ouverture de la session :
      // la session est invalidée.
      if (!dbUser || (token.pwdv && token.pwdv !== passwordVersion(dbUser.passwordHash))) {
        return null;
      }
      // Plus de 8 h sans activité : déconnexion automatique.
      if (dbUser.lastSeenAt && Date.now() - new Date(dbUser.lastSeenAt).getTime() > INACTIVITY_LIMIT_MS) {
        return null;
      }

      token.id = dbUser.id;
      token.role = dbUser.role;
      token.firstName = dbUser.firstName;
      token.lastName = dbUser.lastName;
      token.organizationId = dbUser.organizationId;
      token.pwdv = passwordVersion(dbUser.passwordHash);
      token.checkedAt = Date.now();
      return token;
    },
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        const rawEmail = typeof credentials?.email === "string" ? credentials.email : "";
        const password = typeof credentials?.password === "string" ? credentials.password : "";
        if (!rawEmail || !password || password.length > 200) return null;

        const email = normalizeEmail(rawEmail);
        const ip = clientIp(request.headers);
        // Par tranche de 15 minutes : 10 essais pour un compte depuis une même IP,
        // 30 par IP, et 100 au total sur un compte (attaque répartie). Un tiers qui
        // martèle un compte ne bloque donc pas son propriétaire, qui se connecte d'ailleurs.
        const byAccountIp = rateLimit(`login:account-ip:${email}:${ip}`, { limit: 10, windowMs: 15 * 60_000 });
        const byIp = rateLimit(`login:ip:${ip}`, { limit: 30, windowMs: 15 * 60_000 });
        const byAccount = rateLimit(`login:account:${email}`, { limit: 100, windowMs: 15 * 60_000 });
        if (!byAccountIp.ok || !byIp.ok || !byAccount.ok) {
          throw new TooManyAttempts();
        }

        const org = await getCurrentOrganization();
        const user = await prisma.user.findFirst({
          where: {
            organizationId: org.id,
            email: { equals: email, mode: "insensitive" },
          },
        });

        if (!user) {
          // Comparaison factice : même temps de réponse que pour un compte existant.
          await verifyPassword(password, DUMMY_HASH);
          return null;
        }

        const valid = await verifyPassword(password, user.passwordHash);
        if (!valid) return null;

        resetRateLimit(`login:account-ip:${email}:${ip}`);

        // la visite précédente sert de point de départ au récap affiché après la connexion
        await prisma.user.update({
          where: { id: user.id },
          data: { previousSeenAt: user.lastSeenAt ?? null, lastSeenAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          organizationId: user.organizationId,
          pwdv: passwordVersion(user.passwordHash),
        };
      },
    }),
  ],
});
