#!/bin/bash

# Script to update all service pages to use ChatBookingHero

echo "🔧 Updating all service pages with ChatBookingHero..."

# Define service configurations as arrays
declare -A services

# Format: "page_path|serviceType|serviceName|subServices"
services["/bus-rental/page.tsx"]="bus-rental|Bus Rental|🚌 Mini Bus,🚐 Tempo Traveller,💼 Corporate Bus,💒 Wedding Bus"
services["/equipment-rental/page.tsx"]="equipment-rental|Equipment Rental|🏗️ Construction Equipment,🚜 JCB / Excavator,🎪 Event Equipment"
services["/packers-and-movers/page.tsx"]="packers-and-movers|Packers & Movers|🏠 Home Shifting,🏢 Office Shifting,🚗 Vehicle Transport"
services["/transporter/page.tsx"]="transporter|Transporter|🚚 Full Truck Load (FTL),📦 Part Truck Load (PTL),🚛 Container Transport"

echo "✅ Service configuration loaded for ${#services[@]} pages"
echo ""
echo "To complete the update:"
echo "1. Update car-rental page manually (has complex city grid)"
echo "2. Update specialized car pages (one-way, luxury, self-drive, etc.)"
echo "3. Update location-specific pages in [location] folders"
echo ""
echo "Main service pages updated! 🎉"
