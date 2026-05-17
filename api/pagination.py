from __future__ import annotations

from urllib.parse import urlencode


class StandardResultsSetPagination:
    page_size = 12
    page_size_query_param = "page_size"
    max_page_size = 100

    def get_page_size(self, request) -> int:
        try:
            requested = int(request.query_params.get(self.page_size_query_param, self.page_size))
        except (TypeError, ValueError):
            requested = self.page_size
        return max(1, min(requested, self.max_page_size))

    def get_page_number(self, request) -> int:
        try:
            requested = int(request.query_params.get("page", 1))
        except (TypeError, ValueError):
            requested = 1
        return max(1, requested)

    def paginate(self, request, items: list):
        page_size = self.get_page_size(request)
        page_number = self.get_page_number(request)
        total = len(items)

        start = (page_number - 1) * page_size
        end = start + page_size
        page_items = items[start:end]

        return {
            "count": total,
            "next": self._build_page_url(request, page_number + 1, page_size) if end < total else None,
            "previous": self._build_page_url(request, page_number - 1, page_size) if page_number > 1 else None,
            "results": page_items,
        }

    def _build_page_url(self, request, page: int, page_size: int) -> str:
        query_params = request.query_params.copy()
        query_params["page"] = str(page)
        query_params[self.page_size_query_param] = str(page_size)
        encoded = urlencode(query_params, doseq=True)
        return request.build_absolute_uri(f"{request.path}?{encoded}")
