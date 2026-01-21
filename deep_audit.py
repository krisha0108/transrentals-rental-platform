#!/usr/bin/env python3
"""
TransRentals Deep API Audit Script v3.0
========================================
Complete End-to-End Testing - Quote Based Services
(Bus, Truck, Packers, Equipment)

Simulates real user journeys:
- Customer creates quote request
- Vendor submits quote
- Customer accepts quote
- Admin verifies payment
- Vendor assigns driver & completes job

Author: API Audit Bot
Version: 3.0.0
"""

import sys
import io

# Fix Windows console encoding
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

import requests
import uuid
import json
import time
import random
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List, Tuple
from dataclasses import dataclass, field

# =============================================================================
# CONFIGURATION
# =============================================================================

BASE_URL = "http://localhost:3000"

# Use existing verified vendor credentials (set to None to create new vendor)
USE_EXISTING_VENDOR = True
EXISTING_VENDOR_EMAIL = "mehul.k@cre8r.in"
EXISTING_VENDOR_PASSWORD = "12345678"

# Color codes
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    MAGENTA = '\033[95m'
    CYAN = '\033[96m'
    WHITE = '\033[97m'
    BOLD = '\033[1m'
    END = '\033[0m'

# =============================================================================
# DATA STORE
# =============================================================================

class TestData:
    """Store all test data"""
    def __init__(self):
        self.unique_id = uuid.uuid4().hex[:8]

        # Customer
        self.customer_id: Optional[str] = None
        self.customer_token: Optional[str] = None
        self.customer_email: Optional[str] = None
        self.customer_phone: Optional[str] = None

        # Vendor
        self.vendor_id: Optional[str] = None
        self.vendor_email: Optional[str] = None
        self.vendor_session: Optional[requests.Session] = None

        # Admin session (will use cookies)
        self.admin_session: Optional[requests.Session] = None

        # Location
        self.location_id: Optional[str] = None
        self.location_name: str = "Hyderabad"

        # Truck Quote Flow
        self.truck_quote_request_id: Optional[str] = None
        self.truck_quote_request_number: Optional[str] = None
        self.truck_quote_id: Optional[str] = None
        self.truck_quote_number: Optional[str] = None
        self.truck_booking_id: Optional[str] = None
        self.truck_booking_number: Optional[str] = None
        self.truck_loading_otp: Optional[str] = None
        self.truck_delivery_otp: Optional[str] = None

        # Bus Quote Flow
        self.bus_quote_request_id: Optional[str] = None
        self.bus_quote_request_number: Optional[str] = None
        self.bus_quote_id: Optional[str] = None
        self.bus_booking_id: Optional[str] = None
        self.bus_booking_number: Optional[str] = None

        # Packers Quote Flow
        self.packers_quote_request_id: Optional[str] = None
        self.packers_quote_request_number: Optional[str] = None
        self.packers_quote_id: Optional[str] = None
        self.packers_booking_id: Optional[str] = None
        self.packers_booking_number: Optional[str] = None

        # Equipment Quote Flow
        self.equipment_quote_request_id: Optional[str] = None
        self.equipment_quote_request_number: Optional[str] = None
        self.equipment_quote_id: Optional[str] = None
        self.equipment_booking_id: Optional[str] = None
        self.equipment_booking_number: Optional[str] = None

store = TestData()

# =============================================================================
# TRACKING
# =============================================================================

@dataclass
class TestResult:
    step: int
    name: str
    passed: bool
    status_code: int
    expected: int
    message: str
    time_ms: float
    category: str
    endpoint: str = ""

class Tracker:
    def __init__(self):
        self.results: List[TestResult] = []
        self.step = 0

    def next(self) -> int:
        self.step += 1
        return self.step

    def add(self, result: TestResult):
        self.results.append(result)

    def passed(self) -> int:
        return sum(1 for r in self.results if r.passed)

    def failed(self) -> int:
        return sum(1 for r in self.results if not r.passed)

tracker = Tracker()

# =============================================================================
# UTILITIES
# =============================================================================

def print_header(title: str):
    print(f"\n{Colors.BOLD}{Colors.MAGENTA}{'='*70}")
    print(f"  {title}")
    print(f"{'='*70}{Colors.END}\n")

def print_step(title: str):
    print(f"\n{Colors.BOLD}{Colors.CYAN}>>> {title}{Colors.END}\n")

def print_info(msg: str):
    print(f"    {Colors.BLUE}[INFO]{Colors.END} {msg}")

def print_ok(msg: str):
    print(f"    {Colors.GREEN}[OK]{Colors.END} {msg}")

def print_fail(msg: str):
    print(f"    {Colors.RED}[FAIL]{Colors.END} {msg}")

def print_data(label: str, value: Any):
    print(f"    {Colors.YELLOW}{label}:{Colors.END} {value}")

def api_call(
    session: requests.Session,
    method: str,
    endpoint: str,
    expected: int = 200,
    name: str = "",
    category: str = "General",
    json_data: Optional[Dict] = None,
    data: Optional[Dict] = None
) -> Tuple[TestResult, Optional[Dict]]:
    """Make API call and track result"""

    step = tracker.next()
    url = f"{BASE_URL}{endpoint}"
    response_data = None

    start = datetime.now()

    try:
        if method == "GET":
            resp = session.get(url, timeout=30)
        elif method == "POST":
            resp = session.post(url, json=json_data, data=data, timeout=30)
        elif method == "PATCH":
            resp = session.patch(url, json=json_data, data=data, timeout=30)
        else:
            raise ValueError(f"Unknown method: {method}")

        time_ms = (datetime.now() - start).total_seconds() * 1000

        try:
            response_data = resp.json()
            msg = response_data.get('message', response_data.get('error', ''))
            if not msg:
                msg = str(response_data)[:100]
        except:
            msg = resp.text[:100] if resp.text else "No body"

        passed = resp.status_code == expected

        result = TestResult(
            step=step,
            name=name or endpoint,
            passed=passed,
            status_code=resp.status_code,
            expected=expected,
            message=msg if not passed else "OK",
            time_ms=time_ms,
            category=category,
            endpoint=endpoint
        )

    except requests.exceptions.ConnectionError:
        result = TestResult(
            step=step,
            name=name or endpoint,
            passed=False,
            status_code=0,
            expected=expected,
            message="Connection Error - Server not running?",
            time_ms=0,
            category=category,
            endpoint=endpoint
        )
    except Exception as e:
        result = TestResult(
            step=step,
            name=name or endpoint,
            passed=False,
            status_code=0,
            expected=expected,
            message=str(e)[:100],
            time_ms=0,
            category=category,
            endpoint=endpoint
        )

    tracker.add(result)

    # Print result
    icon = f"{Colors.GREEN}PASS{Colors.END}" if result.passed else f"{Colors.RED}FAIL{Colors.END}"
    print(f"  [{Colors.YELLOW}{step:02d}{Colors.END}] [{icon}] {result.name}")
    print(f"      {Colors.WHITE}{method} {endpoint}{Colors.END}")
    print(f"      Status: {result.status_code} (expected {expected}) | {result.time_ms:.0f}ms")

    if not result.passed:
        print(f"      {Colors.RED}Error: {result.message}{Colors.END}")

    return result, response_data

def gen_email(prefix: str) -> str:
    return f"{prefix}_{store.unique_id}_{random.randint(1000,9999)}@test.com"

def gen_phone() -> str:
    return f"98{random.randint(10000000, 99999999)}"

def gen_name(prefix: str) -> str:
    return f"{prefix} {store.unique_id[:4]}"

def future_date(days: int) -> str:
    return (datetime.now() + timedelta(days=days)).strftime("%Y-%m-%d")

def future_datetime(days: int, hour: int = 10) -> str:
    dt = datetime.now() + timedelta(days=days)
    dt = dt.replace(hour=hour, minute=0, second=0)
    return dt.isoformat()

# =============================================================================
# SETUP: CREATE USERS
# =============================================================================

def setup_users():
    """Create customer and vendor for testing"""
    print_header("SETUP: Creating Test Users")

    session = requests.Session()

    # --- Create Customer ---
    print_step("Creating Customer")

    store.customer_email = gen_email("customer")
    store.customer_phone = gen_phone()

    print_info(f"Email: {store.customer_email}")
    print_info(f"Phone: {store.customer_phone}")

    result, data = api_call(
        session, "POST", "/api/customer/auth",
        expected=200,
        name="Register Customer",
        category="Setup",
        json_data={
            "action": "register",
            "name": gen_name("Customer"),
            "email": store.customer_email,
            "phone": store.customer_phone,
            "password": "Test@123456"
        }
    )

    if result.passed and data:
        store.customer_token = data.get('token')
        store.customer_id = data.get('customer', {}).get('id') or data.get('id')
        print_ok(f"Customer ID: {store.customer_id}")

    # --- Create or Use Existing Vendor ---
    if USE_EXISTING_VENDOR:
        print_step("Using Existing Verified Vendor")
        store.vendor_email = EXISTING_VENDOR_EMAIL
        vendor_password = EXISTING_VENDOR_PASSWORD
        print_info(f"Email: {store.vendor_email}")
    else:
        print_step("Creating Vendor")
        store.vendor_email = gen_email("vendor")
        store.vendor_phone = gen_phone()
        vendor_password = "Vendor@123456"

        print_info(f"Email: {store.vendor_email}")
        print_info(f"Phone: {store.vendor_phone}")

        result, data = api_call(
            session, "POST", "/api/vendor/register",
            expected=201,
            name="Register Vendor",
            category="Setup",
            json_data={
                "email": store.vendor_email,
                "password": vendor_password,
                "phone": store.vendor_phone,
                "businessName": f"Test Transport {store.unique_id}",
                "ownerName": gen_name("Owner"),
                "city": "Hyderabad",
                "address": "123 Test Street",
                "state": "Telangana",
                "pincode": "500001"
            }
        )

        if result.passed and data:
            store.vendor_id = data.get('vendor', {}).get('id') or data.get('id')
            print_ok(f"Vendor ID: {store.vendor_id}")

    # --- Login Vendor (NextAuth) ---
    print_step("Logging in Vendor")

    store.vendor_session = requests.Session()

    # Step 1: Get CSRF token
    try:
        csrf_resp = store.vendor_session.get(f"{BASE_URL}/api/vendor/auth/csrf")
        csrf_data = csrf_resp.json()
        csrf_token = csrf_data.get('csrfToken', '')
        print_info(f"Got CSRF token: {csrf_token[:20]}...")
    except Exception as e:
        print_fail(f"Failed to get CSRF token: {e}")
        csrf_token = ""

    # Step 2: Login with credentials (provider id is 'vendor-credentials')
    if csrf_token:
        login_data = {
            "email": store.vendor_email,
            "password": vendor_password,
            "csrfToken": csrf_token,
            "callbackUrl": f"{BASE_URL}/vendor/dashboard",
            "redirect": "false",
            "json": "true"
        }
        try:
            login_resp = store.vendor_session.post(
                f"{BASE_URL}/api/vendor/auth/callback/vendor-credentials",
                data=login_data,
                allow_redirects=False
            )
            if login_resp.status_code in [200, 302]:
                print_ok("Vendor logged in successfully")
                # Check cookies
                cookies = store.vendor_session.cookies.get_dict()
                if 'next-auth.session-token-vendor' in cookies:
                    print_ok("Session cookie obtained")
                else:
                    print_info(f"Cookies: {list(cookies.keys())}")

                # Get vendor ID from profile
                profile_resp = store.vendor_session.get(f"{BASE_URL}/api/vendor/profile")
                if profile_resp.status_code == 200:
                    profile_data = profile_resp.json()
                    store.vendor_id = profile_data.get('vendor', {}).get('id') or profile_data.get('id')
                    print_ok(f"Vendor ID: {store.vendor_id}")
            else:
                print_fail(f"Login failed: {login_resp.status_code}")
        except Exception as e:
            print_fail(f"Login error: {e}")

    # --- Get Location ---
    print_step("Fetching Location")

    result, data = api_call(
        session, "GET", "/api/locations",
        expected=200,
        name="Get Locations",
        category="Setup"
    )

    if result.passed and data:
        locations = data.get('locations', data) if isinstance(data, dict) else data
        if isinstance(locations, list) and len(locations) > 0:
            for loc in locations:
                if loc.get('type') == 'city':
                    store.location_id = loc.get('id')
                    store.location_name = loc.get('name', 'Hyderabad')
                    break
            if not store.location_id:
                store.location_id = locations[0].get('id')
                store.location_name = locations[0].get('name', 'Hyderabad')
            print_ok(f"Using: {store.location_name} (ID: {store.location_id})")

# =============================================================================
# TRUCK QUOTE FLOW - COMPLETE END-TO-END
# =============================================================================

def test_truck_complete_flow():
    """Complete Truck booking flow from quote to completion"""
    print_header("TRUCK BOOKING - COMPLETE FLOW")

    session = requests.Session()

    # =========================================================================
    # STEP 1: Customer Creates Quote Request
    # =========================================================================
    print_step("Step 1: Customer Creates Quote Request")

    quote_request_data = {
        "customerName": gen_name("Truck Customer"),
        "customerEmail": gen_email("truck"),
        "customerPhone": gen_phone(),
        "customerId": store.customer_id,
        "serviceType": "intercity",
        "vehicleCategory": "20ft-container",
        "vehicleCategoryName": "20ft Container Truck",
        "pickupCity": store.location_name,
        "pickupAddress": "Industrial Area, Phase 1, " + store.location_name,
        "pickupFloor": 0,
        "hasPickupLift": True,
        "dropCity": "Chennai",
        "dropAddress": "Warehouse Complex, Ambattur Industrial Estate, Chennai",
        "dropFloor": 0,
        "hasDropLift": True,
        "pickupDate": future_date(7),
        "pickupTime": "08:00",
        "goodsType": "furniture",
        "goodsDescription": "Office furniture - 10 desks, 20 chairs, 5 cabinets, 2 conference tables",
        "estimatedWeight": 5000.0,  # Float in kg, not string!
        "estimatedVolume": "800 CFT",
        "estimatedDistance": 600.0,  # Float
        "requiresLabour": True,
        "labourCount": 4,
        "isFlexibleDate": True,
        "needInsurance": True,
        "needPackaging": True,
        "requirements": "Handle with care. Fragile items included.",
        "budgetMin": 25000.0,
        "budgetMax": 45000.0
    }

    print_data("Route", f"{quote_request_data['pickupCity']} → {quote_request_data['dropCity']}")
    print_data("Goods", quote_request_data['goodsType'])
    print_data("Weight", quote_request_data['estimatedWeight'])

    result, data = api_call(
        session, "POST", "/api/truck-quote-requests",
        expected=200,
        name="Create Truck Quote Request",
        category="Truck Flow",
        json_data=quote_request_data
    )

    if result.passed and data:
        store.truck_quote_request_id = data.get('id') or data.get('quoteRequest', {}).get('id')
        store.truck_quote_request_number = data.get('requestNumber') or data.get('quoteRequest', {}).get('requestNumber')
        print_ok(f"Quote Request ID: {store.truck_quote_request_id}")
        print_ok(f"Request Number: {store.truck_quote_request_number}")
    else:
        print_fail("Could not create quote request. Stopping truck flow.")
        return

    # =========================================================================
    # STEP 2: Vendor Submits Quote
    # =========================================================================
    print_step("Step 2: Vendor Submits Quote")

    # Use the authenticated vendor session
    if not store.vendor_session:
        print_fail("Vendor session not available. Stopping truck flow.")
        return

    quote_data = {
        "requestId": store.truck_quote_request_id,
        "vendorId": store.vendor_id,
        "vehicleName": "Tata 20ft Container",
        "vehicleCategory": "20ft-container",
        "vehicleNumber": "TS09AB1234",
        "vehicleCapacity": "7 Tons",
        "driverName": "Ramesh Kumar",
        "driverPhone": gen_phone(),
        "baseAmount": 28000,
        "labourIncluded": True,
        "labourCount": 4,
        "labourCharges": 4000,
        "loadingCharges": 2000,
        "unloadingCharges": 2000,
        "packagingCharges": 3000,
        "insuranceCharges": 1500,
        "tollEstimate": 2500,
        "gstAmount": 7740,  # 18% of base + charges
        "totalAmount": 50740,
        "estimatedDuration": "2 days",
        "inclusions": ["Driver", "Fuel", "Loading Labour", "Unloading Labour", "Packaging Material", "Insurance"],
        "exclusions": ["Parking charges", "Waiting charges beyond 2 hours"],
        "termsConditions": ["50% advance required", "Balance on delivery", "Cancellation charges apply"],
        "validityDays": 3,
        "notes": "We have handled similar moves. Professional packing guaranteed."
    }

    print_data("Vehicle", quote_data['vehicleName'])
    print_data("Base Amount", f"₹{quote_data['baseAmount']}")
    print_data("Total Amount", f"₹{quote_data['totalAmount']}")

    result, data = api_call(
        store.vendor_session, "POST", "/api/vendor/truck-quotes",
        expected=200,
        name="Vendor Submits Quote",
        category="Truck Flow",
        json_data=quote_data
    )

    if result.passed and data:
        store.truck_quote_id = data.get('id') or data.get('quote', {}).get('id')
        store.truck_quote_number = data.get('quoteNumber') or data.get('quote', {}).get('quoteNumber')
        print_ok(f"Quote ID: {store.truck_quote_id}")
        print_ok(f"Quote Number: {store.truck_quote_number}")
    else:
        print_fail("Could not submit quote. Stopping truck flow.")
        return

    # =========================================================================
    # STEP 3: Customer Views Quote Request with Quotes
    # =========================================================================
    print_step("Step 3: Customer Views Received Quotes")

    result, data = api_call(
        session, "GET", f"/api/truck-quote-requests/{store.truck_quote_request_id}",
        expected=200,
        name="View Quote Request with Quotes",
        category="Truck Flow"
    )

    if result.passed and data:
        quotes = data.get('quotes', [])
        print_ok(f"Total Quotes Received: {len(quotes)}")

    # =========================================================================
    # STEP 4: Customer Accepts Quote (Creates Booking)
    # =========================================================================
    print_step("Step 4: Customer Accepts Quote")

    result, data = api_call(
        session, "PATCH", f"/api/truck-quote-requests/{store.truck_quote_request_id}",
        expected=200,
        name="Customer Accepts Quote",
        category="Truck Flow",
        json_data={
            "action": "accept_quote",
            "quoteId": store.truck_quote_id
        }
    )

    if result.passed and data:
        booking = data.get('booking', data)
        store.truck_booking_id = booking.get('id')
        store.truck_booking_number = booking.get('bookingNumber')
        store.truck_loading_otp = booking.get('loadingOtp')
        store.truck_delivery_otp = booking.get('deliveryOtp')
        print_ok(f"Booking Created!")
        print_ok(f"Booking ID: {store.truck_booking_id}")
        print_ok(f"Booking Number: {store.truck_booking_number}")
        print_ok(f"Loading OTP: {store.truck_loading_otp}")
        print_data("Status", "PENDING_PAYMENT")
    else:
        print_fail("Could not accept quote. Stopping truck flow.")
        return

    # =========================================================================
    # STEP 5: Customer Submits Payment
    # =========================================================================
    print_step("Step 5: Customer Pays Advance (Simulated)")
    # In real flow, customer pays via payment gateway (Razorpay/UPI)
    # Payment is then verified by admin
    print_info("Customer would pay via payment gateway (Razorpay/UPI)")
    print_info("Skipping to admin verification...")

    # =========================================================================
    # STEP 6: Admin Verifies Payment
    # =========================================================================
    print_step("Step 6: Admin Verifies Payment")

    result, data = api_call(
        session, "POST", "/api/admin/payments/verify",
        expected=200,
        name="Admin Verifies Payment",
        category="Truck Flow",
        json_data={
            "bookingId": store.truck_booking_id,
            "bookingType": "truck",
            "action": "verify",
            "notes": "Payment verified via bank statement"
        }
    )

    if result.passed:
        print_ok("Payment verified by admin")
        print_data("Status", "ADVANCE_PAID")

    # =========================================================================
    # STEP 7: Vendor Assigns Driver & Vehicle
    # =========================================================================
    print_step("Step 7: Vendor Assigns Driver & Vehicle")

    result, data = api_call(
        store.vendor_session, "PATCH", f"/api/vendor/truck-bookings/{store.truck_booking_id}",
        expected=200,
        name="Assign Driver & Vehicle",
        category="Truck Flow",
        json_data={
            "action": "assign_driver",
            "driverName": "Suresh Yadav",
            "driverPhone": gen_phone(),
            "vehicleNumber": "TS09CD5678",
            "vehicleModel": "Tata 1109 Container"
        }
    )

    if result.passed:
        print_ok("Driver and vehicle assigned")
        print_data("Driver", "Suresh Yadav")
        print_data("Vehicle", "TS09CD5678")
        print_data("Status", "VEHICLE_ASSIGNED")

    # =========================================================================
    # STEP 8: Vendor Starts Loading (with OTP)
    # =========================================================================
    print_step("Step 8: Driver Arrives & Starts Loading")

    # First, get the booking to get OTP (in real scenario, customer shares OTP)
    result, data = api_call(
        session, "GET", f"/api/truck-bookings/{store.truck_booking_id}",
        expected=200,
        name="Get Booking Details (for OTP)",
        category="Truck Flow"
    )

    if result.passed and data:
        booking_data = data.get('booking', data)
        store.truck_loading_otp = booking_data.get('loadingOtp') or store.truck_loading_otp
        print_info(f"Loading OTP: {store.truck_loading_otp}")

    result, data = api_call(
        store.vendor_session, "PATCH", f"/api/vendor/truck-bookings/{store.truck_booking_id}",
        expected=200,
        name="Start Loading (OTP Verified)",
        category="Truck Flow",
        json_data={
            "action": "start_loading",
            "otp": store.truck_loading_otp
        }
    )

    if result.passed:
        print_ok("Loading started - OTP verified")
        print_data("Status", "LOADING")

    # =========================================================================
    # STEP 9: Vendor Completes Loading & Starts Transit
    # =========================================================================
    print_step("Step 9: Loading Complete - Start Transit")

    result, data = api_call(
        store.vendor_session, "PATCH", f"/api/vendor/truck-bookings/{store.truck_booking_id}",
        expected=200,
        name="Start Transit",
        category="Truck Flow",
        json_data={
            "action": "start_transit"
        }
    )

    if result.passed and data:
        store.truck_delivery_otp = data.get('deliveryOtp') or data.get('booking', {}).get('deliveryOtp')
        print_ok("Transit started - On the way to destination")
        print_ok(f"New Delivery OTP Generated: {store.truck_delivery_otp}")
        print_data("Status", "IN_TRANSIT")

    # =========================================================================
    # STEP 10: Vendor Arrives & Starts Unloading (with Delivery OTP)
    # =========================================================================
    print_step("Step 10: Arrived at Destination - Start Unloading")

    # Get fresh OTP if needed
    if not store.truck_delivery_otp:
        result, data = api_call(
            session, "GET", f"/api/truck-bookings/{store.truck_booking_id}",
            expected=200,
            name="Get Delivery OTP",
            category="Truck Flow"
        )
        if result.passed and data:
            booking_data = data.get('booking', data)
            store.truck_delivery_otp = booking_data.get('deliveryOtp')

    print_info(f"Delivery OTP: {store.truck_delivery_otp}")

    result, data = api_call(
        store.vendor_session, "PATCH", f"/api/vendor/truck-bookings/{store.truck_booking_id}",
        expected=200,
        name="Start Unloading (Delivery OTP)",
        category="Truck Flow",
        json_data={
            "action": "start_unloading",
            "otp": store.truck_delivery_otp
        }
    )

    if result.passed:
        print_ok("Unloading started at destination")
        print_data("Status", "UNLOADING")

    # =========================================================================
    # STEP 11: Vendor Completes the Job
    # =========================================================================
    print_step("Step 11: Job Completed")

    result, data = api_call(
        store.vendor_session, "PATCH", f"/api/vendor/truck-bookings/{store.truck_booking_id}",
        expected=200,
        name="Complete Booking",
        category="Truck Flow",
        json_data={
            "action": "complete",
            "notes": "All items delivered safely. Customer verified."
        }
    )

    if result.passed:
        print_ok("🎉 BOOKING COMPLETED SUCCESSFULLY!")
        print_data("Final Status", "COMPLETED")
        print_data("Payment Status", "COMPLETED")

    # =========================================================================
    # STEP 12: Verify Final State
    # =========================================================================
    print_step("Step 12: Verify Final Booking State")

    result, data = api_call(
        session, "GET", f"/api/truck-bookings/{store.truck_booking_id}",
        expected=200,
        name="Get Final Booking State",
        category="Truck Flow"
    )

    if result.passed and data:
        print_ok("Final Booking Details:")
        print_data("Booking Number", data.get('bookingNumber'))
        print_data("Status", data.get('status'))
        print_data("Payment Status", data.get('paymentStatus'))
        print_data("Vendor", data.get('vendorId'))

# =============================================================================
# BUS QUOTE FLOW
# =============================================================================

def test_bus_complete_flow():
    """Complete Bus booking flow"""
    print_header("BUS BOOKING - COMPLETE FLOW")

    session = requests.Session()

    # Step 1: Create Quote Request
    print_step("Step 1: Customer Creates Bus Quote Request")

    quote_request_data = {
        "customerName": gen_name("Bus Customer"),
        "customerEmail": gen_email("bus"),
        "customerPhone": gen_phone(),
        "customerId": store.customer_id,
        "tripType": "outstation",
        "vehicleCategory": "luxury-coach",
        "vehicleCategoryName": "45 Seater Luxury Coach",  # Required field
        "pickupCity": store.location_name,
        "pickupAddress": "Corporate Office, Hitech City, " + store.location_name,
        "dropCity": "Goa",
        "dropAddress": "Calangute Beach Resort, North Goa",
        "pickupDate": future_date(14),
        "pickupTime": "06:00",
        "returnDate": future_date(17),
        "returnTime": "22:00",
        "passengers": 40,  # Int as per schema
        "tripDays": 4,
        "needAC": True,
        "needLuxury": True,
        "needSleeper": False,
        "requirements": "Corporate team outing. Need WiFi and charging points.",
        "budgetMin": 80000.0,  # Float as per schema
        "budgetMax": 120000.0  # Float as per schema
    }

    print_data("Route", f"{quote_request_data['pickupCity']} → {quote_request_data['dropCity']}")
    print_data("Passengers", quote_request_data['passengers'])
    print_data("Duration", f"{quote_request_data['tripDays']} days")

    result, data = api_call(
        session, "POST", "/api/bus-quote-requests",
        expected=200,
        name="Create Bus Quote Request",
        category="Bus Flow",
        json_data=quote_request_data
    )

    if result.passed and data:
        store.bus_quote_request_id = data.get('id') or data.get('quoteRequest', {}).get('id')
        store.bus_quote_request_number = data.get('requestNumber')
        print_ok(f"Quote Request ID: {store.bus_quote_request_id}")
        print_ok(f"Request Number: {store.bus_quote_request_number}")
    else:
        print_fail("Could not create quote request")
        return

    # Step 2: Vendor Submits Quote
    print_step("Step 2: Vendor Submits Quote")

    result, data = api_call(
        store.vendor_session, "POST", "/api/vendor/bus-quotes",
        expected=200,
        name="Vendor Submits Bus Quote",
        category="Bus Flow",
        json_data={
            "requestId": store.bus_quote_request_id,
            "vehicleName": "Volvo 9400 Multi-Axle",
            "vehicleCategory": "luxury-coach",
            "vehicleNumber": "TS09EF9012",
            "seats": 45,  # API expects 'seats' not 'seatingCapacity'
            "driverName": "Venkat Reddy",
            "driverPhone": gen_phone(),
            "baseAmount": 85000,
            "driverAllowance": 4000,
            "nightHaltCharges": 3000,
            "tollEstimate": 4500,
            "parkingEstimate": 1000,
            "gstAmount": 17550,
            "totalAmount": 115050,
            "inclusions": ["AC Bus", "Experienced Driver", "Fuel", "Permits", "First Aid Kit"],
            "exclusions": ["Toll charges", "Parking", "Driver food"],
            "termsConditions": ["30% advance", "Balance before trip", "Overtime charges apply"],
            "validityDays": 5
        }
    )

    if result.passed and data:
        store.bus_quote_id = data.get('quote', {}).get('id') or data.get('id')
        print_ok(f"Quote ID: {store.bus_quote_id}")
    else:
        return

    # Step 3: Customer Accepts Quote
    print_step("Step 3: Customer Accepts Quote")

    result, data = api_call(
        session, "PATCH", f"/api/bus-quote-requests/{store.bus_quote_request_id}",
        expected=200,
        name="Customer Accepts Bus Quote",
        category="Bus Flow",
        json_data={
            "action": "accept_quote",
            "quoteId": store.bus_quote_id
        }
    )

    if result.passed and data:
        booking = data.get('booking', data)
        store.bus_booking_id = booking.get('id')
        store.bus_booking_number = booking.get('bookingNumber')
        print_ok(f"Booking ID: {store.bus_booking_id}")
        print_ok(f"Booking Number: {store.bus_booking_number}")
    else:
        return

    # Step 4-6: Payment & Verification (similar pattern)
    print_step("Step 4: Admin Verifies Payment")

    api_call(
        session, "POST", "/api/admin/payments/verify",
        expected=200,
        name="Admin Verifies Bus Payment",
        category="Bus Flow",
        json_data={
            "bookingId": store.bus_booking_id,
            "bookingType": "bus",
            "action": "verify"
        }
    )

    print_ok("Bus booking flow completed till payment verification")

# =============================================================================
# PACKERS QUOTE FLOW
# =============================================================================

def test_packers_complete_flow():
    """Complete Packers & Movers booking flow"""
    print_header("PACKERS & MOVERS - COMPLETE FLOW")

    session = requests.Session()

    # Step 1: Create Quote Request
    print_step("Step 1: Customer Creates Packers Quote Request")

    quote_request_data = {
        "customerName": gen_name("Packers Customer"),
        "customerEmail": gen_email("packers"),
        "customerPhone": gen_phone(),
        "customerId": store.customer_id,
        "serviceType": "home-intercity",
        "shiftingType": "3bhk",  # Should match schema values: 1bhk, 2bhk, 3bhk, etc.
        "propertySize": "1800 sq ft",
        "pickupCity": store.location_name,
        "pickupAddress": "Flat 1201, Prestige Towers, Gachibowli, " + store.location_name,
        "pickupFloor": 12,
        "hasPickupLift": True,
        "pickupParkingDist": "50 meters from building",
        "dropCity": "Bangalore",
        "dropAddress": "Villa 45, Palm Meadows, Whitefield, Bangalore",
        "dropFloor": 0,
        "hasDropLift": False,
        "dropParkingDist": "Gate parking available",
        "preferredDate": future_date(21),
        "isFlexibleDate": True,
        "flexibleDateRange": "2-3 days",
        # inventoryList should be JSON array as per schema
        "inventoryList": [
            {"name": "Bed", "quantity": 3, "fragile": False},
            {"name": "Wardrobe", "quantity": 4, "fragile": False},
            {"name": "Sofa Set", "quantity": 1, "fragile": False},
            {"name": "Dining Table", "quantity": 1, "fragile": False},
            {"name": "AC Unit", "quantity": 4, "fragile": True},
            {"name": "Refrigerator", "quantity": 1, "fragile": True},
            {"name": "Washing Machine", "quantity": 1, "fragile": False},
            {"name": "TV 65 inch", "quantity": 1, "fragile": True},
            {"name": "Cartons", "quantity": 50, "fragile": False}
        ],
        "hasHeavyItems": True,
        "heavyItemsDesc": "4 AC units, 2 door refrigerator, Washing machine, Treadmill",
        "hasFragileItems": True,
        "fragileItemsDesc": "65 inch TV, Crockery set, Glass showcase, Decorative items",
        "hasVehicle": True,
        "vehicleDetails": "Honda City 2022 Model",
        "needPacking": True,
        "needUnpacking": True,
        "needStorage": False,
        "needInsurance": True,
        "insuranceValue": 1500000.0,  # Float as per schema
        "requirements": "Careful handling needed. Many antique items. Car to be transported separately.",
        "budgetMin": 45000.0,  # Float as per schema
        "budgetMax": 70000.0  # Float as per schema
    }

    print_data("Moving", f"{quote_request_data['pickupCity']} → {quote_request_data['dropCity']}")
    print_data("Property", quote_request_data['propertySize'])
    print_data("Insurance Value", f"₹{quote_request_data['insuranceValue']}")

    result, data = api_call(
        session, "POST", "/api/packers-quote-requests",
        expected=200,
        name="Create Packers Quote Request",
        category="Packers Flow",
        json_data=quote_request_data
    )

    if result.passed and data:
        store.packers_quote_request_id = data.get('id') or data.get('quoteRequest', {}).get('id')
        store.packers_quote_request_number = data.get('requestNumber')
        print_ok(f"Quote Request ID: {store.packers_quote_request_id}")
    else:
        return

    # Step 2: Vendor Submits Quote
    print_step("Step 2: Vendor Submits Quote")

    result, data = api_call(
        store.vendor_session, "POST", "/api/vendor/packers-quotes",
        expected=200,
        name="Vendor Submits Packers Quote",
        category="Packers Flow",
        json_data={
            "requestId": store.packers_quote_request_id,
            "vendorId": store.vendor_id,
            "packingCharges": 12000,
            "loadingCharges": 5000,
            "transportCharges": 25000,
            "unloadingCharges": 5000,
            "unpackingCharges": 8000,
            "insuranceCharges": 3000,
            "materialCharges": 4000,
            "carTransportCharges": 8000,
            "gstAmount": 12600,
            "totalAmount": 82600,
            "teamSize": 8,
            "estimatedDays": 3,
            "vehicleType": "32ft Container + Car Carrier",
            "inclusions": ["Packing material", "Loading/Unloading", "Transport", "Unpacking", "Insurance", "Car transport"],
            "exclusions": ["AC dismantling charges extra", "Appliance installation"],
            "termsConditions": ["30% advance", "Balance on delivery", "Transit insurance included"],
            "validityDays": 7
        }
    )

    if result.passed and data:
        store.packers_quote_id = data.get('quote', {}).get('id') or data.get('id')
        print_ok(f"Quote ID: {store.packers_quote_id}")
    else:
        return

    # Step 3: Accept Quote
    print_step("Step 3: Customer Accepts Quote")

    result, data = api_call(
        session, "PATCH", f"/api/packers-quote-requests/{store.packers_quote_request_id}",
        expected=200,
        name="Accept Packers Quote",
        category="Packers Flow",
        json_data={
            "action": "accept_quote",
            "quoteId": store.packers_quote_id
        }
    )

    if result.passed and data:
        store.packers_booking_id = data.get('booking', {}).get('id') or data.get('id')
        store.packers_booking_number = data.get('booking', {}).get('bookingNumber')
        print_ok(f"Booking ID: {store.packers_booking_id}")

    print_ok("Packers flow completed till quote acceptance")

# =============================================================================
# EQUIPMENT QUOTE FLOW
# =============================================================================

def test_equipment_complete_flow():
    """Complete Equipment rental booking flow"""
    print_header("EQUIPMENT RENTAL - COMPLETE FLOW")

    session = requests.Session()

    # Step 1: Create Quote Request
    print_step("Step 1: Customer Creates Equipment Quote Request")

    quote_request_data = {
        "customerName": gen_name("Equipment Customer"),
        "customerEmail": gen_email("equipment"),
        "customerPhone": gen_phone(),
        "customerId": store.customer_id,
        "companyName": "ABC Construction Pvt Ltd",
        "equipmentCategory": "construction",  # As per schema: construction, industrial, event, av, agricultural, medical
        "equipmentType": "excavator",  # As per schema: excavator, generator, sound-system, projector, tractor
        "equipmentName": "JCB 3DX Super",  # Schema uses equipmentName not specificModel
        "quantity": 2,
        "deliveryCity": store.location_name,  # Schema uses deliveryCity not city
        "deliveryAddress": "Construction Site, Survey No. 45, ORR Exit 12, " + store.location_name,
        "siteType": "construction-site",  # As per schema: construction-site, office, event-venue, farm
        "startDate": future_date(10),
        "endDate": future_date(40),
        "rentalDuration": "monthly",  # String as per schema: daily, weekly, monthly
        "rentalDays": 30,  # Int REQUIRED field in schema
        "needOperator": True,
        "needDelivery": True,  # As per schema
        "needInstallation": False,  # As per schema
        "requirements": "Equipment should be in good condition. Prefer machines less than 3 years old.",
        "budgetMin": 180000.0,  # Float as per schema
        "budgetMax": 280000.0  # Float as per schema
    }

    print_data("Equipment", f"{quote_request_data['equipmentType']} x {quote_request_data['quantity']}")
    print_data("Duration", f"{quote_request_data['rentalDays']} days ({quote_request_data['rentalDuration']})")
    print_data("Location", quote_request_data['deliveryCity'])

    result, data = api_call(
        session, "POST", "/api/equipment-quote-requests",
        expected=200,
        name="Create Equipment Quote Request",
        category="Equipment Flow",
        json_data=quote_request_data
    )

    if result.passed and data:
        store.equipment_quote_request_id = data.get('id') or data.get('quoteRequest', {}).get('id')
        store.equipment_quote_request_number = data.get('requestNumber')
        print_ok(f"Quote Request ID: {store.equipment_quote_request_id}")
    else:
        return

    # Step 2: Vendor Submits Quote
    print_step("Step 2: Vendor Submits Quote")

    result, data = api_call(
        store.vendor_session, "POST", "/api/vendor/equipment-quotes",
        expected=200,
        name="Vendor Submits Equipment Quote",
        category="Equipment Flow",
        json_data={
            "requestId": store.equipment_quote_request_id,
            "vendorId": store.vendor_id,
            "equipmentName": "JCB 3DX Super Backhoe Loader",
            "equipmentModel": "2023 Model",
            "quantity": 2,
            "dailyRate": 4500,
            "monthlyRate": 120000,
            "operatorCharges": 1500,
            "mobilizationCharges": 15000,
            "demobilizationCharges": 15000,
            "insuranceCharges": 8000,
            "gstAmount": 46800,
            "totalAmount": 306800,
            "operatorIncluded": True,
            "operatorShifts": 2,
            "fuelIncluded": False,
            "maintenanceIncluded": True,
            "inclusions": ["2 Operators (12 hour shifts)", "Routine maintenance", "Breakdown support", "Insurance"],
            "exclusions": ["Fuel", "Major repairs due to misuse"],
            "termsConditions": ["25% advance", "Weekly billing", "Minimum 15 days rental"],
            "validityDays": 7
        }
    )

    if result.passed and data:
        store.equipment_quote_id = data.get('quote', {}).get('id') or data.get('id')
        print_ok(f"Quote ID: {store.equipment_quote_id}")
    else:
        return

    # Step 3: Accept Quote
    print_step("Step 3: Customer Accepts Quote")

    result, data = api_call(
        session, "PATCH", f"/api/equipment-quote-requests/{store.equipment_quote_request_id}",
        expected=200,
        name="Accept Equipment Quote",
        category="Equipment Flow",
        json_data={
            "action": "accept_quote",
            "quoteId": store.equipment_quote_id
        }
    )

    if result.passed and data:
        store.equipment_booking_id = data.get('booking', {}).get('id') or data.get('id')
        store.equipment_booking_number = data.get('booking', {}).get('bookingNumber')
        print_ok(f"Booking ID: {store.equipment_booking_id}")

    print_ok("Equipment flow completed till quote acceptance")

# =============================================================================
# SUMMARY
# =============================================================================

def print_summary():
    """Print test summary"""
    print_header("TEST SUMMARY")

    passed = tracker.passed()
    failed = tracker.failed()
    total = passed + failed
    rate = (passed / total * 100) if total > 0 else 0

    print(f"  {Colors.BOLD}Total Tests:{Colors.END} {total}")
    print(f"  {Colors.GREEN}Passed:{Colors.END} {passed}")
    print(f"  {Colors.RED}Failed:{Colors.END} {failed}")
    print(f"  {Colors.BOLD}Pass Rate:{Colors.END} {rate:.1f}%")

    # Created Data
    print(f"\n  {Colors.BOLD}CREATED TEST DATA:{Colors.END}")
    print(f"  {'-'*40}")

    if store.customer_id:
        print(f"  Customer ID: {store.customer_id}")
    if store.vendor_id:
        print(f"  Vendor ID: {store.vendor_id}")
    if store.truck_booking_number:
        print(f"  Truck Booking: {store.truck_booking_number}")
    if store.bus_booking_number:
        print(f"  Bus Booking: {store.bus_booking_number}")
    if store.packers_booking_number:
        print(f"  Packers Booking: {store.packers_booking_number}")
    if store.equipment_booking_number:
        print(f"  Equipment Booking: {store.equipment_booking_number}")

    # Failed Tests
    if failed > 0:
        print(f"\n  {Colors.RED}FAILED TESTS:{Colors.END}")
        print(f"  {'-'*40}")
        for r in tracker.results:
            if not r.passed:
                print(f"  [{r.step:02d}] {r.name}")
                print(f"      {r.endpoint}")
                print(f"      Expected {r.expected}, Got {r.status_code}")
                print(f"      {Colors.RED}{r.message}{Colors.END}")

    print(f"\n{Colors.CYAN}{'='*70}{Colors.END}")
    print(f"  Completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"  Test Run ID: {store.unique_id}")
    print(f"{Colors.CYAN}{'='*70}{Colors.END}\n")

# =============================================================================
# MAIN
# =============================================================================

def main():
    print(f"\n{Colors.BOLD}{Colors.MAGENTA}")
    print("╔══════════════════════════════════════════════════════════════════════╗")
    print("║                                                                      ║")
    print("║       TRANSRENTALS DEEP AUDIT v3.0 - QUOTE BASED SERVICES            ║")
    print("║                                                                      ║")
    print("║   Complete End-to-End Testing: Truck, Bus, Packers, Equipment        ║")
    print("║                                                                      ║")
    print("╚══════════════════════════════════════════════════════════════════════╝")
    print(f"{Colors.END}")

    print(f"  Target: {BASE_URL}")
    print(f"  Run ID: {store.unique_id}")
    print(f"  Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    try:
        # Setup
        setup_users()

        # Quote-based flows
        test_truck_complete_flow()
        test_bus_complete_flow()
        test_packers_complete_flow()
        test_equipment_complete_flow()

    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}Interrupted{Colors.END}")
    except Exception as e:
        print(f"\n{Colors.RED}Error: {e}{Colors.END}")
        import traceback
        traceback.print_exc()

    print_summary()

if __name__ == "__main__":
    main()
