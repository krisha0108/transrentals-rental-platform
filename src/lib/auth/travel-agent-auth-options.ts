import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';
import { generateTaid } from '@/lib/utils/generate-taid';

export const travelAgentAuthOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'travel-agent-credentials',
      name: 'Travel Agent Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials');
        }

        // Support login via Travel Agent ID (ta-0001) or email.
        const identifier = credentials.email.trim();
        const agent = await prisma.travel_agents.findFirst({
          where: /^ta-\d+$/i.test(identifier)
            ? { tid: identifier.toLowerCase() }
            : { email: identifier.toLowerCase() },
        });

        if (!agent) {
          throw new Error('Invalid credentials');
        }

        if (agent.status === 'BLOCKED') {
          throw new Error('Your account has been blocked. Please contact support.');
        }
        if (agent.status === 'SUSPENDED') {
          throw new Error('Your account is suspended. Please contact support.');
        }
        if (agent.status === 'REJECTED') {
          throw new Error('Your application was rejected. Please contact support.');
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, agent.password);
        if (!isPasswordValid) {
          throw new Error('Invalid credentials');
        }

        // Lazily assign a Travel Agent ID to older accounts missing one.
        let tid = agent.tid;
        if (!tid) {
          try { tid = await generateTaid(); } catch { /* non-fatal */ }
        }

        await prisma.travel_agents.update({
          where: { id: agent.id },
          data: { lastLoginAt: new Date(), ...(tid ? { tid } : {}) },
        });

        return {
          id: agent.id,
          email: agent.email,
          name: agent.agencyName,
          role: 'TRAVEL_AGENT',
          userType: 'travel_agent',
          status: agent.status,
          phone: agent.phone,
          ownerName: agent.ownerName,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.userType = (user as any).userType;
        token.status = (user as any).status;
        token.phone = (user as any).phone;
        token.ownerName = (user as any).ownerName;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role;
        (session.user as any).userType = token.userType;
        (session.user as any).status = token.status;
        (session.user as any).phone = token.phone;
        (session.user as any).ownerName = token.ownerName;
      }
      return session;
    },
  },
  pages: {
    signIn: '/travel-agent/login',
    error: '/travel-agent/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token-travel-agent',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    callbackUrl: {
      name: 'next-auth.callback-url-travel-agent',
      options: {
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    csrfToken: {
      name: 'next-auth.csrf-token-travel-agent',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
