import { NextAuthOptions, getServerSession } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { sendEmail } from "@/lib/mailer"
import type { Session } from "next-auth"
import type { JWT } from "next-auth/jwt"

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required")
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user || !user.passwordHash) {
          throw new Error("Invalid email or password")
        }

        const isValid = await verifyPassword(
          credentials.password,
          user.passwordHash
        )

        if (!isValid) {
          throw new Error("Invalid email or password")
        }

        if (user.isSuspended) {
          throw new Error("Account has been suspended")
        }

        sendEmail(user.email, "LOGIN_NOTIFICATION", { firstName: user.firstName || "" }).catch(console.warn)

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        ;(session.user as any).id = token.id
        ;(session.user as any).role = token.role
      }
      return session
    },
  },
}

export async function getCurrentUser(): Promise<Session["user"] | null> {
  const session = await getServerSession(authOptions)
  return session?.user ?? null
}

type AuthedUser = NonNullable<Session["user"]> & { id: string; role: string }

export async function requireAuth(): Promise<AuthedUser> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Authentication required")
  }
  return user as AuthedUser
}

export async function requireAdmin(): Promise<AuthedUser> {
  const user = await requireAuth()
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    throw new Error("Admin access required")
  }
  return user
}
