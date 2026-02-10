# Instructions to Add Payment Notifications for Remaining Services

You need to add notification creation after payment approve/reject for these services in:
**File:** `src/app/api/admin/payments/verify/route.ts`

## Copy-Paste Template:

For each service (bus, truck, equipment, packers, luxury, chauffeur), add this **after** the `prisma.[service]_bookings.update()` call:

### For VERIFY (Payment Approved):
```typescript
// ⭐ Send notification - Payment Approved
try {
  await prisma.notifications.create({
    data: prepareNotificationData({
      customerId: [BOOKING_VARIABLE].customerId,
      title: '✅ Payment Approved!',
      body: `Your [SERVICE_NAME] booking payment of ₹${[BOOKING_VARIABLE].advanceAmount || [BOOKING_VARIABLE].grandTotal} has been approved.`,
      type: 'payment',
      serviceType: '[SERVICE_TYPE]',  // bus, truck, equipment, packers, luxury, car
      bookingId: bookingId,
      quoteId: null,
    }),
  });
} catch (notifError) {
  logger.error('Failed to create notification', notifError);
}
```

### For REJECT (Payment Rejected):
```typescript
// ⭐ Send notification - Payment Rejected
try {
  await prisma.notifications.create({
    data: prepareNotificationData({
      customerId: [BOOKING_VARIABLE].customerId,
      title: '❌ Payment Rejected',
      body: `Your [SERVICE_NAME] booking payment was rejected. ${notes || 'Please contact support.'}`,
      type: 'payment',
      serviceType: '[SERVICE_TYPE]',  // bus, truck, equipment, packers, luxury, car
      bookingId: bookingId,
      quoteId: null,
    }),
  });
} catch (notifError) {
  logger.error('Failed to create notification', notifError);
}
```

## Service-specific Replacements:

| Service | Variable Name | Service Type | Service Name |
|---------|--------------|--------------|--------------|
| Bus | `busBooking` | `'bus'` | `bus` |
| Truck | `truckBooking` | `'truck'` | `truck` |
| Equipment | `equipmentBooking` | `'equipment'` | `equipment` |
| Packers | `packersBooking` | `'packers'` | `packers & movers` |
| Luxury | `luxuryBooking` | `'luxury'` | `luxury car` |
| Chauffeur | `booking` | `'car'` | `chauffeur car` |

## Example for Bus:

```typescript
// After: await prisma.bus_bookings.update({...})

// ⭐ Send notification - Payment Approved
try {
  await prisma.notifications.create({
    data: prepareNotificationData({
      customerId: busBooking.customerId,
      title: '✅ Payment Approved!',
      body: `Your bus booking payment of ₹${busBooking.advanceAmount || 0} has been approved.`,
      type: 'payment',
      serviceType: 'bus',
      bookingId: bookingId,
      quoteId: null,
    }),
  });
} catch (notifError) {
  logger.error('Failed to create notification', notifError);
}
```

---

**I already added for:**
- ✅ Bike bookings
- ✅ Self-drive / Car bookings

**You need to add for:**
- [ ] Bus bookings (lines 167-199)
- [ ] Truck bookings (lines 220-257)
- [ ] Equipment bookings (lines 273-308)
- [ ] Packers bookings (lines 324-360)
- [ ] Luxury bookings (lines 376-411)
- [ ] Chauffeur bookings (lines 426-468)

Just copy-paste the template above and replace the variables accordingly!
