SELECT 'Services:' AS info;
SELECT id, name, slug FROM services WHERE parentId IS NULL LIMIT 10;

SELECT 'Bike Models:' AS info;
SELECT id, name, slug, serviceId FROM vehicle_models WHERE serviceId = 'SVC_1' LIMIT 10;

SELECT 'Self-Drive Models:' AS info;
SELECT id, name, slug, serviceId FROM vehicle_models WHERE serviceId = 'SVC_2' LIMIT 10;

SELECT 'Vendor:' AS info;
SELECT id, businessName, email, status FROM vendors LIMIT 5;

SELECT 'Vendor Approved Services:' AS info;
SELECT vas.vendorId, s.name as serviceName
FROM vendor_approved_services vas
JOIN services s ON s.id = vas.serviceId
LIMIT 10;
