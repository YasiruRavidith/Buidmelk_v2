from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('estimations', '0005_estimationhistory_design_recommendation_json'),
    ]

    operations = [
        migrations.AddField(
            model_name='estimationhistory',
            name='project_details_json',
            field=models.JSONField(blank=True, null=True),
        ),
    ]