'use client';

import {
  TruckDetailFields,
  formatTruckBodyType,
  formatTripDirection,
  formatTruckGoodsType,
  formatTruckVolume,
  formatTruckDate,
} from '@/lib/truck-display';

interface TruckRequestDetailsProps {
  data: TruckDetailFields;
  variant?: 'default' | 'compact';
  /** Hide the vehicle/category section if it's already shown above */
  hideVehicle?: boolean;
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

/** Renders the full truck rental detail breakdown for the new fields. */
export default function TruckRequestDetails({
  data,
  hideVehicle,
}: TruckRequestDetailsProps) {
  const bodyTypeLabel = formatTruckBodyType(data.truckBodyType);
  const tripDirLabel = formatTripDirection(data.tripDirection);
  const goodsLabel = formatTruckGoodsType(data.goodsType);
  const volumeLabel = formatTruckVolume(data.estimatedVolume) || data.estimatedVolume;

  // ── Trip Info ──
  const tripFields: React.ReactNode[] = [];
  if (!hideVehicle && data.vehicleCategoryName)
    tripFields.push(<Field key="veh" label="Truck Type" value={data.vehicleCategoryName} />);
  if (bodyTypeLabel)
    tripFields.push(<Field key="body" label="Body Type" value={bodyTypeLabel} />);
  if (tripDirLabel)
    tripFields.push(<Field key="trip" label="Trip Direction" value={tripDirLabel} />);
  if (data.pickupPincode)
    tripFields.push(<Field key="pickPin" label="Pickup Pincode" value={data.pickupPincode} />);
  if (data.dropPincode)
    tripFields.push(<Field key="dropPin" label="Drop Pincode" value={data.dropPincode} />);
  if (data.expectedDeliveryDate)
    tripFields.push(
      <Field
        key="expDate"
        label="Expected Delivery"
        value={`${formatTruckDate(data.expectedDeliveryDate)}${data.expectedDeliveryTime ? ` · ${data.expectedDeliveryTime}` : ''}`}
      />
    );
  else if (data.expectedDeliveryTime)
    tripFields.push(<Field key="expTime" label="Delivery Time" value={data.expectedDeliveryTime} />);

  // ── Cargo / Goods ──
  const cargoFields: React.ReactNode[] = [];
  if (goodsLabel) cargoFields.push(<Field key="gt" label="Goods Type" value={goodsLabel} />);
  if (data.estimatedWeight)
    cargoFields.push(<Field key="w" label="Estimated Weight" value={`${data.estimatedWeight} kg`} />);
  if (volumeLabel)
    cargoFields.push(<Field key="v" label="Approximate Volume" value={volumeLabel} />);

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

  // ── Services ──
  const servicesFields: React.ReactNode[] = [];
  if (data.requiresLabour)
    servicesFields.push(
      <Field
        key="lab"
        label="Loading & Unloading"
        value={data.labourCount ? `Yes – ${data.labourCount} labourer(s)` : 'Required'}
      />
    );
  if (data.needInsurance)
    servicesFields.push(<Field key="ins" label="Insurance" value="Required" />);
  if (data.needPackaging)
    servicesFields.push(<Field key="pkg" label="Packaging" value="Required" />);
  if (data.isFlexibleDate)
    servicesFields.push(<Field key="flex" label="Flexible Date" value="Yes" />);

  // ── Receiver & POD ──
  const receiverFields: React.ReactNode[] = [];
  if (data.receiverName)
    receiverFields.push(<Field key="rn" label="Receiver Name" value={data.receiverName} />);
  if (data.receiverPhone)
    receiverFields.push(<Field key="rp" label="Receiver Phone" value={data.receiverPhone} />);
  if (data.requiresPOD)
    receiverFields.push(<Field key="pod" label="Proof of Delivery" value="Required" />);
  if (data.hasMultipleStops)
    receiverFields.push(
      <Field
        key="ms"
        label="Multiple Stops"
        value={data.multipleStopsDetails ? `Yes – ${data.multipleStopsDetails}` : 'Yes'}
      />
    );

  // ── Notes ──
  const hasGoodsDescription =
    data.goodsDescription && data.goodsDescription.trim() && data.goodsDescription !== goodsLabel;
  const hasRequirements = data.requirements && data.requirements.trim();

  const allEmpty =
    !tripFields.length &&
    !cargoFields.length &&
    !accessFields.length &&
    !servicesFields.length &&
    !receiverFields.length &&
    !hasGoodsDescription &&
    !hasRequirements;

  if (allEmpty) return null;

  return (
    <div className="space-y-5">
      {tripFields.length > 0 && <Section title="Trip Info">{tripFields}</Section>}
      {(cargoFields.length > 0 || hasGoodsDescription) && (
        <div className="border-t border-gray-100 pt-4">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Cargo</h4>
          {hasGoodsDescription && (
            <div className="bg-gray-50 rounded-lg p-3 mb-3">
              <p className="text-xs text-gray-500 font-medium mb-1">Material Details</p>
              <p className="text-sm text-gray-900 whitespace-pre-wrap">{data.goodsDescription}</p>
            </div>
          )}
          {cargoFields.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{cargoFields}</div>
          )}
        </div>
      )}
      {accessFields.length > 0 && <Section title="Property Access">{accessFields}</Section>}
      {servicesFields.length > 0 && <Section title="Services Required">{servicesFields}</Section>}
      {receiverFields.length > 0 && <Section title="Receiver & POD">{receiverFields}</Section>}
      {hasRequirements && (
        <div className="border-t border-gray-100 pt-4">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Notes</h4>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-900 whitespace-pre-wrap">{data.requirements}</p>
          </div>
        </div>
      )}
    </div>
  );
}
