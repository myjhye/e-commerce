from django.urls import path
from base.views import recommendation_views as views

urlpatterns = [
    path('', views.get_user_recommendations, name='user-recommendations'),
    path('profile/', views.get_user_profile, name='user-profile'),
]