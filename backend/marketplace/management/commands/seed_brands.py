from django.core.management.base import BaseCommand
from marketplace.models import Brand, MaterialCategory, Material


class Command(BaseCommand):
    help = 'Seed common brands and associate them with material categories. Also update existing materials brand field when matching.'

    def handle(self, *args, **options):
        # Mapping of category name substring -> brand list
        mapping = {
            'cement': ['Sanstha', 'Lanwa', 'Tokey'],
            'steel': ['Lanwa', 'SteelCo', 'Metrix'],
            'paint': ['ColorMax', 'DynaPaint', 'ProCoat'],
        }

        created = 0
        associated = 0
        updated_materials = 0

        for cat_name_part, brands in mapping.items():
            categories = MaterialCategory.objects.filter(name__icontains=cat_name_part)
            if not categories.exists():
                self.stdout.write(self.style.WARNING(f'No categories matching "{cat_name_part}"'))
                continue

            for bname in brands:
                brand, was_created = Brand.objects.get_or_create(name=bname)
                if was_created:
                    created += 1
                # associate with categories
                for c in categories:
                    if not brand.categories.filter(id=c.id).exists():
                        brand.categories.add(c)
                        associated += 1

        # Update existing materials: if their brand string matches a seeded brand name (case-insensitive), normalize it
        all_brands = list(Brand.objects.values_list('name', flat=True))
        for material in Material.objects.all():
            # exact string equality
            if material.brand:
                for bname in all_brands:
                    if material.brand.strip().lower() == bname.lower():
                        if material.brand != bname:
                            material.brand = bname
                            material.save(update_fields=['brand'])
                            updated_materials += 1
                        break

            # if still not normalized, try to infer from material name (contains brand substring)
            if not material.brand or material.brand.strip().lower() not in [b.lower() for b in all_brands]:
                lowered = (material.name or '').lower()
                for bname in all_brands:
                    if bname.lower() in lowered:
                        material.brand = bname
                        material.save(update_fields=['brand'])
                        updated_materials += 1
                        break

        self.stdout.write(self.style.SUCCESS(f'Brands created: {created}, associations added: {associated}, materials updated: {updated_materials}'))
