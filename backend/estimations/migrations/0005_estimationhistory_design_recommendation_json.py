from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('estimations', '0004_alter_estimationhistory_id_alter_materialprices_id'),
    ]

    operations = [
        migrations.AddField(
            model_name='estimationhistory',
            name='design_recommendation_json',
            field=models.JSONField(blank=True, null=True),
        ),
    ]
