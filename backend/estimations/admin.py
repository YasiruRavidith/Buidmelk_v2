from django.contrib import admin

from .models import EstimationHistory, MaterialPrices


@admin.register(MaterialPrices)
class MaterialPricesAdmin(admin.ModelAdmin):
    list_display = ('item_name', 'unit', 'current_price', 'last_updated')
    search_fields = ('item_name', 'unit')
    list_filter = ('unit', 'last_updated')
    ordering = ('item_name',)


@admin.register(EstimationHistory)
class EstimationHistoryAdmin(admin.ModelAdmin):
    list_display = ('project_title', 'user', 'total_area_sqft', 'number_of_floors', 'quality_level', 'total_estimated_cost', 'created_at')
    search_fields = ('project_title', 'user__email', 'user__username')
    list_filter = ('quality_level', 'number_of_floors', 'created_at')
    readonly_fields = ('created_at',)
    ordering = ('-created_at',)
