from django.contrib import admin
from .models import DailyJob, JobApplication


@admin.register(DailyJob)
class DailyJobAdmin(admin.ModelAdmin):
    list_display = ['title', 'worker_type', 'workers_needed', 'location', 'job_date', 'status', 'posted_by', 'created_at']
    list_filter = ['worker_type', 'status', 'job_date']
    search_fields = ['title', 'location', 'posted_by__email']
    date_hierarchy = 'job_date'


@admin.register(JobApplication)
class JobApplicationAdmin(admin.ModelAdmin):
    list_display = ['job', 'worker', 'status', 'applied_at']
    list_filter = ['status']
    search_fields = ['job__title', 'worker__email']
