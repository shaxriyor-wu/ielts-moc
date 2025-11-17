# Generated migration for adding left_at and timeout_at fields to TestQueue

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('student_portal', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='testqueue',
            name='status',
            field=models.CharField(
                choices=[
                    ('waiting', 'Waiting'),
                    ('assigned', 'Assigned'),
                    ('preparation', 'Preparation'),
                    ('started', 'Started'),
                    ('left', 'Left'),
                    ('timeout', 'Timeout'),
                ],
                default='waiting',
                max_length=20
            ),
        ),
        migrations.AddField(
            model_name='testqueue',
            name='left_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='testqueue',
            name='timeout_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]

