from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("chat/", include("chat_back.urls")),
    path("admin/", admin.site.urls),
]
