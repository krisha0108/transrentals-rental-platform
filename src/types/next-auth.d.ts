import 'next-auth';
import { AdminRole } from '@prisma/client';

// Combined role type for admin, vendor and customer users
type UserRole = AdminRole | 'VENDOR' | 'CUSTOMER' | 'customer';

declare module 'next-auth' {
  interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    userType?: string;
    status?: string;
    phone?: string;
    ownerName?: string;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
      userType?: string;
      status?: string;
      phone?: string;
      ownerName?: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: UserRole;
    userType?: string;
    status?: string;
    phone?: string;
    ownerName?: string;
  }
}
