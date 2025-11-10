import json
from pathlib import Path


from django import template
from django.conf import settings
from django.utils.safestring import mark_safe

register = template.Library()

@register.simple_tag
def webpack_chunks():
    """Load all webpack chunks in the correct order"""
    manifest_path = Path("frontend") / "static" / "frontend" / "chunk-manifest.json"

    try:
        with open(manifest_path, 'r') as f:
            manifest = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        # Fallback if manifest doesn't exist
        print(f"Didn't find: {manifest_path}")
        from shared_constants import JAVASCRIPT_VERSION
        return mark_safe(f'<script src="/static/frontend/main_{JAVASCRIPT_VERSION}.js"></script>')

    # Load chunks in correct order: vendors first, then main
    chunks = []
    chunk_order = ['vendors', 'main']

    for chunk_name in chunk_order:
        chunk_file = manifest.get(f'{chunk_name}.js')
        if chunk_file:
            chunks.append(f'<script src="{chunk_file}"></script>')

    return mark_safe('\n'.join(chunks))