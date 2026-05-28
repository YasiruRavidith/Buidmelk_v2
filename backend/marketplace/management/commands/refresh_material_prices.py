from django.core.management.base import BaseCommand

from marketplace.models import Material
from marketplace.services import refresh_material_ai_price, material_ai_price_is_stale


class Command(BaseCommand):
    help = 'Refresh material AI prices when they are stale according to the configured interval.'

    def add_arguments(self, parser):
        parser.add_argument('--force', action='store_true', help='Refresh all materials immediately.')
        parser.add_argument('--dry-run', action='store_true', help='Show which materials would be refreshed.')

    def handle(self, *args, **options):
        force = options['force']
        dry_run = options['dry_run']

        refreshed = 0
        skipped = 0

        materials = Material.objects.select_related('category', 'supplier').all()

        for material in materials:
            should_refresh = force or material_ai_price_is_stale(material)

            if not should_refresh:
                skipped += 1
                continue

            if dry_run:
                self.stdout.write(f'Would refresh: {material.id} {material.name}')
                refreshed += 1
                continue

            try:
                refresh_material_ai_price(material, force=True)
                refreshed += 1
                self.stdout.write(self.style.SUCCESS(f'Refreshed: {material.id} {material.name}'))
            except Exception as exc:
                skipped += 1
                self.stderr.write(self.style.ERROR(f'Failed: {material.id} {material.name} - {exc}'))

        self.stdout.write(
            self.style.SUCCESS(
                f'Completed. refreshed={refreshed} skipped={skipped} force={force} dry_run={dry_run}'
            )
        )