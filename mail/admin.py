from django.contrib import admin

# Register your models here.
from .models import Email

@admin.register(Email)
class EmailAdmin(admin.ModelAdmin):
    pass
