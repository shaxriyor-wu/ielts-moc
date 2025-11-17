from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('student_portal', '0002_add_queue_status_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='testqueue',
            name='started_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]

