from django.core.management.base import BaseCommand
from django.db import transaction
from firebase_admin import auth as firebase_auth

from marketplace.models import Material, MaterialCategory, Supplier
from users.models import CustomUser, HardwareShop, HardwareShopItem, ProfessionalProfile

DEMO_USERS = [
    {
        "slug": "client",
        "role": "CLIENT",
        "profession_type": None,
        "email": "client@demo.buildmelk.lk",
        "password": "Demo@2026!Client",
        "first_name": "Demo",
        "last_name": "Client",
    },
    {
        "slug": "contractor",
        "role": "PROFESSIONAL",
        "profession_type": "CONTRACTOR",
        "email": "contractor@demo.buildmelk.lk",
        "password": "Demo@2026!Contractor",
        "first_name": "Demo",
        "last_name": "Contractor",
    },
    {
        "slug": "engineer",
        "role": "PROFESSIONAL",
        "profession_type": "ENGINEER",
        "email": "engineer@demo.buildmelk.lk",
        "password": "Demo@2026!Engineer",
        "first_name": "Demo",
        "last_name": "Engineer",
    },
    {
        "slug": "lawyer",
        "role": "PROFESSIONAL",
        "profession_type": "LAWYER",
        "email": "lawyer@demo.buildmelk.lk",
        "password": "Demo@2026!Lawyer",
        "first_name": "Demo",
        "last_name": "Lawyer",
    },
    {
        "slug": "architect",
        "role": "PROFESSIONAL",
        "profession_type": "ARCHITECT",
        "email": "architect@demo.buildmelk.lk",
        "password": "Demo@2026!Architect",
        "first_name": "Demo",
        "last_name": "Architect",
    },
    {
        "slug": "qs",
        "role": "PROFESSIONAL",
        "profession_type": "QS",
        "email": "qs@demo.buildmelk.lk",
        "password": "Demo@2026!QS",
        "first_name": "Demo",
        "last_name": "QS",
    },
    {
        "slug": "hardware",
        "role": "PROFESSIONAL",
        "profession_type": "HARDWARE",
        "email": "hardware@demo.buildmelk.lk",
        "password": "Demo@2026!Hardware",
        "first_name": "Demo",
        "last_name": "Hardware",
    },
    {
        "slug": "worker",
        "role": "PROFESSIONAL",
        "profession_type": "WORKER",
        "email": "worker@demo.buildmelk.lk",
        "password": "Demo@2026!Worker",
        "first_name": "Demo",
        "last_name": "Worker",
    },
    {
        "slug": "plumber",
        "role": "PROFESSIONAL",
        "profession_type": "PLUMBER",
        "email": "plumber@demo.buildmelk.lk",
        "password": "Demo@2026!Plumber",
        "first_name": "Demo",
        "last_name": "Plumber",
    },
    {
        "slug": "welder",
        "role": "PROFESSIONAL",
        "profession_type": "WELDER",
        "email": "welder@demo.buildmelk.lk",
        "password": "Demo@2026!Welder",
        "first_name": "Demo",
        "last_name": "Welder",
    },
    {
        "slug": "electrician",
        "role": "PROFESSIONAL",
        "profession_type": "ELECTRICIAN",
        "email": "electrician@demo.buildmelk.lk",
        "password": "Demo@2026!Electrician",
        "first_name": "Demo",
        "last_name": "Electrician",
    },
    {
        "slug": "painter",
        "role": "PROFESSIONAL",
        "profession_type": "PAINTER",
        "email": "painter@demo.buildmelk.lk",
        "password": "Demo@2026!Painter",
        "first_name": "Demo",
        "last_name": "Painter",
    },
]

MATERIALS_SEED = [
    {
        "category": "Cement",
        "name": "Cement Bag (50kg)",
        "unit": "bag",
        "unit_price": 1500,
        "stock_available": 400,
        "description": "Demo cement bag for pricing.",
    },
    {
        "category": "Cement",
        "name": "Ready Mix Cement (1m3)",
        "unit": "m3",
        "unit_price": 25000,
        "stock_available": 120,
        "description": "Demo ready mix cement.",
    },
    {
        "category": "Steel",
        "name": "Steel Bar 12mm",
        "unit": "piece",
        "unit_price": 1800,
        "stock_available": 800,
        "description": "Demo steel bar for construction.",
    },
    {
        "category": "Bricks",
        "name": "Clay Brick",
        "unit": "piece",
        "unit_price": 70,
        "stock_available": 6000,
        "description": "Demo clay brick.",
    },
    {
        "category": "Sand",
        "name": "River Sand (cube)",
        "unit": "cube",
        "unit_price": 9500,
        "stock_available": 200,
        "description": "Demo river sand.",
    },
    {
        "category": "Aggregates",
        "name": "Metal Aggregate 3/4",
        "unit": "cube",
        "unit_price": 11000,
        "stock_available": 180,
        "description": "Demo metal aggregate.",
    },
    {
        "category": "Electrical",
        "name": "Electrical Cable 2.5mm",
        "unit": "roll",
        "unit_price": 6500,
        "stock_available": 90,
        "description": "Demo electrical cable roll.",
    },
    {
        "category": "Plumbing",
        "name": "PVC Pipe 1 inch",
        "unit": "piece",
        "unit_price": 480,
        "stock_available": 350,
        "description": "Demo PVC pipe.",
    },
    {
        "category": "Paint",
        "name": "Interior Wall Paint 20L",
        "unit": "tin",
        "unit_price": 9200,
        "stock_available": 140,
        "description": "Demo interior paint.",
    },
    {
        "category": "Paint",
        "name": "Exterior Wall Paint 20L",
        "unit": "tin",
        "unit_price": 9800,
        "stock_available": 140,
        "description": "Demo exterior paint.",
    },
]


class Command(BaseCommand):
    help = "Seed demo users, profiles, and hardware shops/items."

    def handle(self, *args, **options):
        self.stdout.write("Seeding demo users...")
        with transaction.atomic():
            materials = ensure_materials()
            for index, data in enumerate(DEMO_USERS, start=1):
                fb_user = get_or_create_firebase_user(
                    email=data["email"],
                    password=data["password"],
                    display_name=f"{data['first_name']} {data['last_name']}",
                    verified=True,
                )
                user = upsert_custom_user(fb_user, data, index)
                if data["role"] == "PROFESSIONAL":
                    profile = upsert_professional_profile(user, data)
                    if data["profession_type"] == "HARDWARE":
                        ensure_hardware_shops(profile, materials)

        self.stdout.write(self.style.SUCCESS("Demo users seeded."))


def get_or_create_firebase_user(email, password, display_name, verified):
    try:
        fb_user = firebase_auth.get_user_by_email(email)
        if verified and not fb_user.email_verified:
            firebase_auth.update_user(fb_user.uid, email_verified=True)
        return fb_user
    except firebase_auth.UserNotFoundError:
        fb_user = firebase_auth.create_user(
            email=email,
            password=password,
            display_name=display_name,
            email_verified=verified,
        )
        if verified and not fb_user.email_verified:
            firebase_auth.update_user(fb_user.uid, email_verified=True)
        return fb_user


def upsert_custom_user(fb_user, data, index):
    username = f"demo_{data['slug']}"
    if CustomUser.objects.filter(username=username).exclude(firebase_uid=fb_user.uid).exists():
        username = f"{username}_{index}"

    user, created = CustomUser.objects.get_or_create(
        firebase_uid=fb_user.uid,
        defaults={
            "username": username,
            "email": data["email"],
            "first_name": data["first_name"],
            "last_name": data["last_name"],
            "role": data["role"],
            "phone_number": f"+94 77 000 00{index:02d}",
            "is_email_verified": True,
        },
    )

    if not created:
        user.username = username
        user.email = data["email"]
        user.first_name = data["first_name"]
        user.last_name = data["last_name"]
        user.role = data["role"]
        user.phone_number = user.phone_number or f"+94 77 000 00{index:02d}"
        user.is_email_verified = True
        user.save(
            update_fields=[
                "username",
                "email",
                "first_name",
                "last_name",
                "role",
                "phone_number",
                "is_email_verified",
            ]
        )

    return user


def upsert_professional_profile(user, data):
    company_name = f"Demo {data['last_name']} Services"
    if data["profession_type"] == "HARDWARE":
        company_name = "Demo Hardware Group"

    profile, created = ProfessionalProfile.objects.get_or_create(
        user=user,
        defaults={
            "profession_type": data["profession_type"],
            "company_name": company_name,
            "location": "Western - Colombo",
            "years_of_experience": 5,
            "about": "Demo professional profile for BuildMe.lk.",
            "skills_specialization": "Residential and commercial projects.",
            "certifications": "Demo certification",
            "education": "Demo education",
            "service_areas": ["Colombo", "Gampaha"],
            "pricing_range": "LKR 100,000 - 500,000",
            "years_in_business": 5,
            "team_size": 10,
            "availability": "Weekdays",
        },
    )

    if not created:
        profile.profession_type = data["profession_type"]
        profile.company_name = company_name
        profile.location = profile.location or "Western - Colombo"
        profile.years_of_experience = profile.years_of_experience or 5
        profile.about = profile.about or "Demo professional profile for BuildMe.lk."
        profile.skills_specialization = (
            profile.skills_specialization or "Residential and commercial projects."
        )
        profile.certifications = profile.certifications or "Demo certification"
        profile.education = profile.education or "Demo education"
        profile.service_areas = profile.service_areas or ["Colombo", "Gampaha"]
        profile.pricing_range = profile.pricing_range or "LKR 100,000 - 500,000"
        profile.years_in_business = profile.years_in_business or 5
        profile.team_size = profile.team_size or 10
        profile.availability = profile.availability or "Weekdays"
        profile.save()

    return profile


def ensure_materials():
    existing = list(Material.objects.all().order_by("id"))
    if existing:
        return existing

    supplier, _ = Supplier.objects.get_or_create(
        company_name="BuildMe Demo Supplier",
        defaults={
            "contact_email": "supplier@demo.buildmelk.lk",
            "contact_phone": "+94 11 200 0000",
            "address": "Colombo 03, Sri Lanka",
        },
    )

    categories = {}
    for item in MATERIALS_SEED:
        category_name = item["category"]
        if category_name not in categories:
            categories[category_name], _ = MaterialCategory.objects.get_or_create(
                name=category_name,
                defaults={"description": f"Demo {category_name.lower()} materials."},
            )

    materials = []
    for item in MATERIALS_SEED:
        material, _ = Material.objects.get_or_create(
            name=item["name"],
            supplier=supplier,
            defaults={
                "category": categories[item["category"]],
                "unit": item["unit"],
                "ai_price": item["unit_price"],
                "stock_available": item["stock_available"],
                "description": item["description"],
            },
        )
        materials.append(material)

    return materials


def ensure_hardware_shops(profile, materials):
    shops_data = [
        {
            "shop_name": "Demo Hardware Central",
            "shop_address": "No. 12, Main Street, Colombo",
            "shop_phone": "+94 11 250 0000",
            "shop_email": "central@demo.buildmelk.lk",
            "opening_hours": "Mon-Sat 08:00-18:00",
        },
        {
            "shop_name": "Demo Hardware North",
            "shop_address": "No. 88, Kandy Road, Gampaha",
            "shop_phone": "+94 33 220 0000",
            "shop_email": "north@demo.buildmelk.lk",
            "opening_hours": "Mon-Sat 08:00-18:00",
        },
    ]

    shops = []
    for shop_data in shops_data:
        shop, _ = HardwareShop.objects.get_or_create(
            profile=profile,
            shop_name=shop_data["shop_name"],
            defaults=shop_data,
        )
        shops.append(shop)

    if not materials:
        return

    items_per_shop = 5
    for index, material in enumerate(materials[: items_per_shop * len(shops)]):
        shop = shops[index // items_per_shop]
        HardwareShopItem.objects.update_or_create(
            shop=shop,
            material=material,
            defaults={
                "stock_quantity": 50 + index * 5,
                "is_active": True,
            },
        )
