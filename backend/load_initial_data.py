import os
import django

def seed():
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
    django.setup()

    from users.models import CustomUser
    from django.core.management import call_command

    count = CustomUser.objects.count()
    dump_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'local_data_dump.json')
    
    if count == 0 and os.path.exists(dump_file):
        print(f"Database is empty (0 users found). Seeding data from {dump_file}...")
        try:
            call_command('loaddata', dump_file)
            print(f"Initial data seeded successfully! Total users now: {CustomUser.objects.count()}")
        except Exception as e:
            print(f"Error seeding initial data: {e}")
    else:
        print(f"Database already has {count} users. Skipping auto-seed.")

if __name__ == '__main__':
    seed()
