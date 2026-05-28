from rest_framework import serializers
from .models import MaterialPrices, EstimationHistory

class MaterialPricesSerializer(serializers.ModelSerializer):
    class Meta:
        model = MaterialPrices
        fields = '__all__'

class EstimationHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = EstimationHistory
        fields = '__all__'
