import React from 'react';
import { prisma } from '@/lib/db/prisma';
import { PaymentSettingsClient } from '@/components/admin/payment/PaymentSettingsClient';

export const metadata = {
    title: 'Payment & Fee Settings | Admin',
};

// Force dynamic rendering since we need DB connection
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PaymentSettingsPage() {
    // 1. Fetch Global Settings
    const globalSettings = await prisma.payment_settings.findFirst();

    // 2. Fetch All Services (Active) via Direct DB
    // Changing from API to Direct DB as per user request to fix "Services not found"
    let services: any[] = [];
    let fetchError = '';

    try {
        services = await prisma.services.findMany({
            where: { isActive: true },
            orderBy: { displayOrder: 'asc' },
            select: {
                id: true,
                name: true,
                slug: true,
                parentId: true,
                // Add other fields matching Service interface if needed, 
                // strictly using what we need for the UI.
            }
        });

        // Note: IDs here are strings (e.g. "cmj..."). 
        // The Client component must be updated to handle this.

    } catch (e: any) {
        console.error("Failed to fetch services from DB", e);
        fetchError = e.message || 'Failed to fetch services from DB';
    }

    // 3. Fetch all Service Configs
    const serviceConfigs = await prisma.service_payment_configs.findMany();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Payment & Tax Configuration</h1>
                <p className="text-gray-500">Manage global default fees and service-specific overrides. (Direct DB Mode)</p>
            </div>

            <PaymentSettingsClient
                globalSettings={globalSettings}
                services={services}
                serviceConfigs={serviceConfigs}
                fetchError={fetchError}
            />
        </div>
    );
}
