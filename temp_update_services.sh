#!/bin/bash

# Update Self-Drive Car Rental
sed -i.bak '6a\
import { SelfDriveServiceHero } from "@/components/services/SelfDriveServiceHero";
' src/app/\(services\)/self-drive-car-rental/page.tsx

# Update Luxury Car Rental  
sed -i.bak '6a\
import { LuxuryCarServiceHero } from "@/components/services/LuxuryCarServiceHero";
' src/app/\(services\)/luxury-car-rental/page.tsx

# Update Bus Rental
sed -i.bak '6a\
import { BusRentalServiceHero } from "@/components/services/BusRentalServiceHero";
' src/app/\(services\)/bus-rental/page.tsx

# Update Equipment Rental
sed -i.bak '6a\
import { EquipmentRentalServiceHero } from "@/components/services/EquipmentRentalServiceHero";
' src/app/\(services\)/equipment-rental/page.tsx

# Update Packers and Movers
sed -i.bak '6a\
import { PackersMoversServiceHero } from "@/components/services/PackersMoversServiceHero";
' src/app/\(services\)/packers-and-movers/page.tsx

# Update Transporter
sed -i.bak '6a\
import { TruckRentalServiceHero } from "@/components/services/TruckRentalServiceHero";
' src/app/\(services\)/transporter/page.tsx

echo "Imports added successfully"
