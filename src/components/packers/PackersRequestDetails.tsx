'use client';

import {
  PackersDetailFields,
  formatShiftingScope,
  formatVehicleType,
  formatPropertyTypeAndSize,
  formatDate,
} from '@/lib/packers-display';

interface PackersRequestDetailsProps {
  data: PackersDetailFields;
  /** Tailwind size variant — keeps consistent with existing design language */
  variant?: 'default' | 'compact';
  /** Hide certain sections that may already be shown in the surrounding layout */
  hidePropertyType?: boolean;
}

const Field = ({ label, value }: { label: string; value: React.ReactNode }) => {
  if (value === null || value === undefined || value === '' || value === false) return null;
  return (
    <div>
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p className="text-sm text-gray-900">{value}</p>
    </div>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => {
  // Filter out null/false children
  const nonEmpty = Array.isArray(children)
    ? children.filter((c) => c !== null && c !== undefined && c !== false)
    : [children];
  if (!nonEmpty.length) return null;
  return (
    <div className="border-t border-gray-100 pt-4 first:border-t-0 first:pt-0">
      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">{title}</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{children}</div>
    </div>
  );
};

/** Renders the full packers/movers detail breakdown for the new fields. */
export default function PackersRequestDetails({
  data,
  hidePropertyType,
}: PackersRequestDetailsProps) {
  const scopeLabel = formatShiftingScope(data.shiftingScope);
  const vehicleTypeLabel = formatVehicleType(data.vehicleType);
  const propertyLabel = formatPropertyTypeAndSize(data.shiftingType, data.propertySize);

  // ── Trip Info ──
  const tripFields: React.ReactNode[] = [];
  if (scopeLabel) tripFields.push(<Field key="scope" label="Shifting Scope" value={scopeLabel} />);
  if (!hidePropertyType && propertyLabel)
    tripFields.push(<Field key="property" label="Property" value={propertyLabel} />);
  if (data.pickupPincode)
    tripFields.push(<Field key="pickPin" label="Pickup Pincode" value={data.pickupPincode} />);
  if (data.dropPincode)
    tripFields.push(<Field key="dropPin" label="Drop Pincode" value={data.dropPincode} />);
  if (data.expectedDeliveryDate)
    tripFields.push(
      <Field
        key="expDate"
        label="Expected Delivery"
        value={`${formatDate(data.expectedDeliveryDate)}${data.expectedDeliveryTime ? ` · ${data.expectedDeliveryTime}` : ''}`}
      />
    );

  // ── Property Access ──
  const accessFields: React.ReactNode[] = [];
  if (data.pickupFloor !== null && data.pickupFloor !== undefined)
    accessFields.push(
      <Field
        key="pf"
        label="Pickup Floor"
        value={`Floor ${data.pickupFloor} · ${data.hasPickupLift ? 'Lift available' : 'No lift'}`}
      />
    );
  if (data.dropFloor !== null && data.dropFloor !== undefined)
    accessFields.push(
      <Field
        key="df"
        label="Drop Floor"
        value={`Floor ${data.dropFloor} · ${data.hasDropLift ? 'Lift available' : 'No lift'}`}
      />
    );

  // ── Inventory ──
  const inventoryFields: React.ReactNode[] = [];
  if (data.boxesCount)
    inventoryFields.push(<Field key="boxes" label="Boxes" value={data.boxesCount} />);
  if (data.bagsCount)
    inventoryFields.push(<Field key="bags" label="Bags" value={data.bagsCount} />);
  if (data.estimatedWeight)
    inventoryFields.push(
      <Field key="weight" label="Estimated Weight" value={`${data.estimatedWeight} kg`} />
    );
  if (data.estimatedVolumeCubFt)
    inventoryFields.push(
      <Field key="vol" label="Estimated Volume" value={`${data.estimatedVolumeCubFt} cuft`} />
    );
  if (data.hasHeavyItems)
    inventoryFields.push(
      <Field
        key="heavy"
        label="Heavy Items"
        value={data.heavyItemsDesc ? `Yes – ${data.heavyItemsDesc}` : 'Yes'}
      />
    );
  if (data.hasFragileItems)
    inventoryFields.push(
      <Field
        key="fragile"
        label="Fragile Items"
        value={data.fragileItemsDesc ? `Yes – ${data.fragileItemsDesc}` : 'Yes'}
      />
    );

  // ── Services ──
  const servicesFields: React.ReactNode[] = [];
  if (data.needPacking) servicesFields.push(<Field key="np" label="Packing" value="Required" />);
  if (data.needLoading) servicesFields.push(<Field key="nl" label="Loading" value="Required" />);
  if (data.needUnloading)
    servicesFields.push(<Field key="nu" label="Unloading" value="Required" />);
  if (data.labourCount)
    servicesFields.push(<Field key="lc" label="Labour Count" value={data.labourCount} />);
  if (vehicleTypeLabel)
    servicesFields.push(<Field key="vt" label="Vehicle Type" value={vehicleTypeLabel} />);
  if (data.partLoadAccepted)
    servicesFields.push(<Field key="pl" label="Part Load" value="Accepted" />);
  if (data.needInsurance)
    servicesFields.push(
      <Field
        key="ins"
        label="Insurance"
        value={data.insuranceValue ? `Yes – ₹${data.insuranceValue.toLocaleString()}` : 'Yes'}
      />
    );
  if (data.requiresPOD)
    servicesFields.push(<Field key="pod" label="POD" value="Required" />);

  // ── Receiver & Stops ──
  const receiverFields: React.ReactNode[] = [];
  if (data.receiverName)
    receiverFields.push(<Field key="rn" label="Receiver Name" value={data.receiverName} />);
  if (data.receiverPhone)
    receiverFields.push(<Field key="rp" label="Receiver Phone" value={data.receiverPhone} />);
  if (data.hasMultipleStops)
    receiverFields.push(
      <Field
        key="ms"
        label="Multiple Stops"
        value={data.multipleStopsDetails ? `Yes – ${data.multipleStopsDetails}` : 'Yes'}
      />
    );

  const allEmpty =
    !tripFields.length &&
    !accessFields.length &&
    !inventoryFields.length &&
    !servicesFields.length &&
    !receiverFields.length &&
    !data.inventoryList;

  if (allEmpty) return null;

  return (
    <div className="space-y-5">
      {tripFields.length > 0 && (
        <Section title="Trip Info">{tripFields}</Section>
      )}
      {accessFields.length > 0 && (
        <Section title="Property Access">{accessFields}</Section>
      )}
      {(inventoryFields.length > 0 || data.inventoryList) && (
        <div className="border-t border-gray-100 pt-4">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Inventory</h4>
          {data.inventoryList && (
            <div className="bg-gray-50 rounded-lg p-3 mb-3">
              <p className="text-xs text-gray-500 font-medium mb-1">Inventory List</p>
              <p className="text-sm text-gray-900 whitespace-pre-wrap">{data.inventoryList}</p>
            </div>
          )}
          {inventoryFields.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{inventoryFields}</div>
          )}
        </div>
      )}
      {servicesFields.length > 0 && (
        <Section title="Services Required">{servicesFields}</Section>
      )}
      {receiverFields.length > 0 && (
        <Section title="Receiver & Stops">{receiverFields}</Section>
      )}
    </div>
  );
}
