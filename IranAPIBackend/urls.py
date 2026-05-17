from django.conf import settings
from django.conf.urls.static import static
from django.urls import include, path, re_path

from .site_views import frontend_app, robots_txt, sitemap_xml


urlpatterns = [
    re_path(
        r"^api/(?!(?:v1|auth|health|usage|profile|categories|apis|pricing-plans|documentations)/)(?P<slug>[-\w]+)/?$",
        frontend_app,
        name="frontend-api-detail",
    ),
    path("api/", include("api.urls")),
    path("robots.txt", robots_txt, name="robots-txt"),
    path("sitemap.xml", sitemap_xml, name="sitemap-xml"),
]

if (settings.BASE_DIR / "frontend_static" / "index.html").exists():
    if settings.DEBUG and (settings.BASE_DIR / "frontend_static" / "assets").exists():
        urlpatterns += static(
            "/assets/",
            document_root=settings.BASE_DIR / "frontend_static" / "assets",
        )
    urlpatterns += [
        re_path(r"^(?!api/|static/|media/).*$", frontend_app),
    ]

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
