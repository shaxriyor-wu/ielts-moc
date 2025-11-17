# Generated migration to remove owner role

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0002_alter_customuser_role'),
    ]

    operations = [
        migrations.AlterField(
            model_name='customuser',
            name='role',
            field=models.CharField(
                choices=[('admin', 'Admin'), ('student', 'Student')],
                default='student',
                help_text='User role: admin or student',
                max_length=10
            ),
        ),
    ]

