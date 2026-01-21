import pathlib

services = [
    {'dir': 'bike', 'id': 'bike', 'name': 'Bike Rental', 'component': 'Bike'},
    {'dir': 'bus', 'id': 'bus', 'name': 'Bus Rental', 'component': 'Bus'},
    {'dir': 'truck', 'id': 'truck', 'name': 'Truck Rental', 'component': 'Truck'},
    {'dir': 'luxury', 'id': 'luxury', 'name': 'Luxury Car', 'component': 'Luxury'},
    {'dir': 'packers', 'id': 'packers', 'name': 'Packers & Movers', 'component': 'Packers'},
    {'dir': 'equipment', 'id': 'equipment', 'name': 'Equipment Rental', 'component': 'Equipment'},
    {'dir': 'self-drive', 'id': 'self-drive', 'name': 'Self Drive', 'component': 'SelfDrive'}
]

base_dir = pathlib.Path('tr-vendor-app/screens/vendor/services')
print('Generator ready')

print('\nGenerating 21 quote screen files...\n')
total = 0

for svc in services:
    print(f"Processing {svc['name']}...")
    svc_dir = base_dir / svc['dir']
    
    # QuoteDetailScreen
    f1 = svc_dir / f"{svc['component']}QuoteDetailScreen.js"
    f1.write_text(f"// {svc['component']} Quote Detail Screen\nexport default () => null;", encoding='utf-8')
    print(f"  + QuoteDetailScreen.js")
    total += 1
    
    # QuoteRequestDetailScreen  
    f2 = svc_dir / f"{svc['component']}QuoteRequestDetailScreen.js"
    f2.write_text(f"// {svc['component']} Quote Request Detail Screen\nexport default () => null;", encoding='utf-8')
    print(f"  + QuoteRequestDetailScreen.js")
    total += 1
    
    # SendQuoteScreen
    f3 = svc_dir / f"{svc['component']}SendQuoteScreen.js"
    f3.write_text(f"// {svc['component']} Send Quote Screen\nexport default () => null;", encoding='utf-8')
    print(f"  + SendQuoteScreen.js")
    total += 1

print(f'\nSUCCESS: Created {total} files!')
