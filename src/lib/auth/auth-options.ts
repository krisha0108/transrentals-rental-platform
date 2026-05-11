import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';

// Role hierarchy for access control
const ROLE_HIERARCHY = ['SUPER_ADMIN', 'ADMIN', 'SUB_ADMIN', 'MANAGER', 'EDITOR'] as const;

// Roles that can access specific portals
const PORTAL_ROLES = {
  admin: ['SUPER_ADMIN', 'ADMIN'],
  subadmin: ['SUB_ADMIN'],
  manager: ['MANAGER'],
} as const;

export const authOptions: NextAuthOptions = {
  providers: [
    // Admin credentials provider
    CredentialsProvider({
      id: 'admin-credentials',
      name: 'Admin Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        role: { label: 'Role', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials');
        }

        // Check database availability
        if (!prisma) {
          console.error('[Admin Auth] Database not available - Prisma client is undefined');
          throw new Error('Database service unavailable. Please try again later.');
        }

        try {
          const user = await prisma.admin_users.findUnique({
            where: {
              email: credentials.email,
            },
          });

          if (!user || !user.isActive) {
            throw new Error('Invalid credentials');
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            throw new Error('Invalid credentials');
          }

          if (credentials.role) {
            const expectedRole = credentials.role;
            if (expectedRole === 'ADMIN' && user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
              throw new Error('Access denied - Admin role required');
            }
            if (expectedRole === 'SUB_ADMIN' && user.role !== 'SUB_ADMIN') {
              throw new Error('Access denied - SubAdmin role required');
            }
            if (expectedRole === 'MANAGER' && user.role !== 'MANAGER') {
              throw new Error('Access denied - Manager role required');
            }
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            userType: 'admin',
          };
        } catch (error: any) {
          console.error('[Admin Auth] Error:', error.message);
          throw new Error(error.message || 'Authentication failed');
        }
      },
    }),
    // Travel agent credentials provider
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

        if (!prisma) {
          console.error('[Travel Agent Auth] Database not available');
          throw new Error('Database service unavailable. Please try again later.');
        }

        try {
          const agent = await prisma.travel_agents.findUnique({
            where: { email: credentials.email.toLowerCase() },
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

          await prisma.travel_agents.update({
            where: { id: agent.id },
            data: { lastLoginAt: new Date() },
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
        } catch (error: any) {
          console.error('[Travel Agent Auth] Error:', error.message);
          throw new Error(error.message || 'Authentication failed');
        }
      },
    }),
    // Vendor credentials provider
    CredentialsProvider({
      id: 'vendor-credentials',
      name: 'Vendor Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials');
        }

        // Check database availability
        if (!prisma) {
          console.error('[Vendor Auth] Database not available - Prisma client is undefined');
          throw new Error('Database service unavailable. Please try again later.');
        }

        try {
          const vendor = await prisma.vendors.findUnique({
            where: {
              email: credentials.email,
            },
          });

          if (!vendor) {
            throw new Error('Invalid credentials');
          }

          if (vendor.status === 'BLOCKED') {
            throw new Error('Your account has been blocked. Please contact support.');
          }
          if (vendor.status === 'SUSPENDED') {
            throw new Error('Your account is suspended. Please contact support.');
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            vendor.password
          );

          if (!isPasswordValid) {
            throw new Error('Invalid credentials');
          }

          // Update last login
          await prisma.vendors.update({
            where: { id: vendor.id },
            data: { lastLoginAt: new Date() },
          });

          return {
            id: vendor.id,
            email: vendor.email,
            name: vendor.businessName,
            role: 'VENDOR',
            userType: 'vendor',
            status: vendor.status,
            phone: vendor.phone,
            ownerName: vendor.ownerName,
          };
        } catch (error: any) {
          console.error('[Vendor Auth] Error:', error.message);
          throw new Error(error.message || 'Authentication failed');
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.userType = (user as any).userType;
        token.status = (user as any).status;
        token.phone = (user as any).phone;
        token.ownerName = (user as any).ownerName;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role;
        (session.user as any).userType = token.userType;
        (session.user as any).status = token.status;
        (session.user as any).phone = token.phone;
        (session.user as any).ownerName = token.ownerName;
      }
      return session;
    },
  },
  pages: {
    signIn: '/admin/login',
    error: '/admin/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};
