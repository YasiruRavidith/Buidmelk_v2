from django.contrib import admin
from django import forms
from django.urls import path, reverse
from django.shortcuts import redirect
from django.utils import timezone
from django.contrib import messages
from django.utils.html import format_html
from .models import MaterialCategory, Supplier, Material, MaterialImage, Brand
from .services import refresh_material_ai_price

class MaterialImageInline(admin.TabularInline):
    model = MaterialImage
    extra = 1


class MaterialAdminForm(forms.ModelForm):
    brand = forms.ChoiceField(required=False)

    class Meta:
        model = Material
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        current_brand = self.initial.get('brand') or getattr(self.instance, 'brand', '') or ''
        current_category = self.initial.get('category') or getattr(self.instance, 'category_id', None)

        self.fields['brand'].choices = self._get_brand_choices(current_category, current_brand)
        self.fields['brand'].widget = forms.Select()
        self.fields['brand'].widget.attrs.update({
            'data-brand-select': 'true',
        })

    @staticmethod
    def _get_brand_choices(category_id=None, current_brand=''):
        choices = [('', '---------')]

        brands_qs = Brand.objects.all().order_by('name')
        if category_id:
            brands_qs = brands_qs.filter(categories__id=category_id)

        brand_names = list(brands_qs.values_list('name', flat=True).distinct())
        if current_brand and current_brand not in brand_names:
            brand_names = [current_brand] + brand_names

        choices.extend((name, name) for name in brand_names)
        return choices

class MaterialAdmin(admin.ModelAdmin):
    form = MaterialAdminForm
    list_display = ['name', 'brand', 'category', 'current_price', 'stock_available', 'use_manual_price', 'last_ai_update']
    list_filter = ['category', 'use_manual_price']
    search_fields = ['name', 'brand']
    inlines = [MaterialImageInline]
    readonly_fields = ['last_ai_update', 'refresh_ai_button']
    actions = ['refresh_ai_price']

    class Media:
        js = ('marketplace/admin_brand_filter.js',)

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path(
                '<path:object_id>/refresh-ai/',
                self.admin_site.admin_view(self.refresh_ai_view),
                name='marketplace_material_refresh_ai',
            ),
        ]
        return custom_urls + urls

    def refresh_ai_view(self, request, object_id):
        material = self.get_object(request, object_id)
        if material is None:
            self.message_user(request, 'Material not found.', level=messages.ERROR)
            return redirect('admin:marketplace_material_changelist')

        try:
            refresh_material_ai_price(material, force=True)
            self.message_user(request, f'AI price refreshed for {material.name}.')
        except RuntimeError as exc:
            self.message_user(request, f'Could not refresh {material.name}: {exc}', level=messages.ERROR)

        return redirect(reverse('admin:marketplace_material_change', args=[object_id]))

    def refresh_ai_button(self, obj):
        if not obj or not obj.pk:
            return '-'

        url = reverse('admin:marketplace_material_refresh_ai', args=[obj.pk])
        return format_html(
            '<a class="button" href="{}" style="margin-top: 8px; display: inline-block;">Refresh AI Price</a>',
            url,
        )

    refresh_ai_button.short_description = 'AI Refresh'

    @admin.action(description='Refresh AI price from OpenRouter')
    def refresh_ai_price(self, request, queryset):
        updated = 0
        skipped = 0

        for material in queryset.select_related('category', 'supplier'):
            try:
                result = refresh_material_ai_price(material, force=True)
            except RuntimeError as exc:
                self.message_user(request, f'{material.name}: {exc}', level='error')
                skipped += 1
                continue

            updated += 1

        if updated:
            self.message_user(request, f'Updated AI price for {updated} material(s).')
        if skipped:
            self.message_user(request, f'Skipped {skipped} material(s) because pricing failed.', level='warning')

admin.site.register(MaterialCategory)
admin.site.register(Supplier)
admin.site.register(Material, MaterialAdmin)


class BrandAdmin(admin.ModelAdmin):
    list_display = ['name']
    search_fields = ['name']
    filter_horizontal = ('categories',)


admin.site.register(Brand, BrandAdmin)