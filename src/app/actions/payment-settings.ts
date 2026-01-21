'use server';

import { prisma } from '@/lib/db/prisma';
import { revalidatePath } from 'next/cache';

export async function updateGlobalPaymentSettings(formData: FormData) {
    const settings = {
        defaultGst: parseFloat(formData.get('defaultGst') as string),
        defaultPlatformFee: parseFloat(formData.get('defaultPlatformFee') as string),
        defaultAdvance: parseFloat(formData.get('defaultAdvance') as string),
        defaultSecurityDeposit: parseFloat(formData.get('defaultSecurityDeposit') as string),
    };

    // Upsert (create if not exists, update always) - since it's a singleton, we check existing or just create
    // Actually, we can just findFirst and update, or create.
    const existing = await prisma.payment_settings.findFirst();

    if (existing) {
        await prisma.payment_settings.update({
            where: { id: existing.id },
            data: settings,
        });
    } else {
        await prisma.payment_settings.create({
            data: settings,
        });
    }

    revalidatePath('/admin/settings/fees');
    return { success: true };
}

export async function updateServicePaymentConfig(formData: FormData) {
    const serviceId = formData.get('serviceId') as string;
    const serviceName = formData.get('serviceName') as string;

    // Extract nullable fields
    const getFloat = (key: string) => {
        const val = formData.get(key);
        return (val && val !== '') ? parseFloat(val as string) : null;
    };

    const getInt = (key: string) => {
        const val = formData.get(key);
        return (val && val !== '') ? parseInt(val as string) : null;
    };

    const data = {
        serviceName, // Ensure name is kept in sync
        gst: getFloat('gst'),
        platformFee: getFloat('platformFee'),
        advancePercentage: getFloat('advancePercentage'),
        securityDeposit: getFloat('securityDeposit'),
        minBookingDays: getInt('minBookingDays'),
        maxBookingDays: getInt('maxBookingDays'),
    };

    await prisma.service_payment_configs.upsert({
        where: { serviceId },
        update: data,
        create: {
            serviceId,
            ...data,
        },
    });

    revalidatePath('/admin/settings/fees');
    return { success: true };
}
