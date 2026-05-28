import json
import re
from datetime import timedelta
from decimal import Decimal, InvalidOperation
from html import unescape
from urllib import error, request
from urllib.parse import parse_qs, quote_plus, unquote, urlparse

from django.conf import settings
from django.utils import timezone


OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
DUCKDUCKGO_HTML_URL = 'https://html.duckduckgo.com/html/'
LIVE_SEARCH_USER_AGENT = (
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
    'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
)
MAX_SEARCH_RESULTS = 5
MAX_PAGE_FETCHES = 3


def build_material_price_prompt(material):
    brand = material.brand or 'N/A'
    supplier = material.supplier.company_name if material.supplier else 'Unknown supplier'
    description = material.description or 'No description provided.'

    return (
        'Estimate a fair retail price in Sri Lankan Rupees for the following construction material. '
        'Brand must materially affect the price. Well-known or premium brands should usually be priced above generic or unknown brands, '
        'and the same material should not get the same price across different brands. '
        'Return only JSON with keys price_lkr, confidence, and rationale. '
        'The price_lkr value must be a number, not a string.\n\n'
        f'Name: {material.name}\n'
        f'Brand: {brand}\n'
        f'Category: {material.category.name}\n'
        f'Supplier: {supplier}\n'
        f'Unit: {material.unit}\n'
        f'Stock available: {material.stock_available}\n'
        f'Description: {description}\n'
    )


def _normalize_text(value):
    return re.sub(r'\s+', ' ', unescape(str(value))).strip()


def _strip_tags(value):
    return re.sub(r'<[^>]+>', '', value or '')


def _build_live_search_query(material):
    parts = [material.name]
    if material.brand:
        parts.append(material.brand)
    if material.category:
        parts.append(material.category.name)
    parts.extend(['Sri Lanka', 'price'])
    return ' '.join(part for part in parts if part)


def _decode_search_result_url(href):
    href = unescape(href or '')
    if href.startswith('//'):
        href = 'https:' + href

    parsed = urlparse(href)
    if 'duckduckgo.com' in parsed.netloc and parsed.path.startswith('/l/'):
        query = parse_qs(parsed.query)
        target = query.get('uddg', [None])[0]
        if target:
            return unquote(target)

    return href


def _fetch_url_text(url, timeout=20):
    req = request.Request(url, headers={'User-Agent': LIVE_SEARCH_USER_AGENT})
    with request.urlopen(req, timeout=timeout) as response:
        encoding = response.headers.get_content_charset() or 'utf-8'
        return response.read().decode(encoding, 'ignore')


def _search_web_results(query, max_results=MAX_SEARCH_RESULTS):
    search_url = f'{DUCKDUCKGO_HTML_URL}?q={quote_plus(query)}'
    html = _fetch_url_text(search_url)

    results = []
    blocks = re.findall(r'<div class="result.*?</div>\s*</div>', html, re.S)

    for block in blocks:
        title_match = re.search(r'class="result__a" href="([^"]+)">(.*?)</a>', block, re.S)
        if not title_match:
            continue

        href = _decode_search_result_url(title_match.group(1))
        title = _normalize_text(_strip_tags(title_match.group(2)))

        snippet_match = re.search(r'class="result__snippet"[^>]*>(.*?)</a>', block, re.S)
        snippet = _normalize_text(_strip_tags(snippet_match.group(1))) if snippet_match else ''

        results.append({
            'title': title,
            'url': href,
            'snippet': snippet,
        })

        if len(results) >= max_results:
            break

    return results


def _parse_decimal_amount(amount_text):
    cleaned = re.sub(r'[^0-9.,]', '', amount_text or '')
    if not cleaned:
        return None

    cleaned = cleaned.replace(',', '')
    try:
        return Decimal(cleaned)
    except InvalidOperation:
        return None


def _extract_price_candidates(text):
    patterns = [
        r'itemprop="price"\s+content="([0-9][0-9,]*(?:\.[0-9]+)?)"',
        r'"price"\s*:\s*"?([0-9][0-9,]*(?:\.[0-9]+)?)"?',
        r'woocommerce-Price-amount[^>]*>\s*(?:<span[^>]*>.*?</span>\s*)?([0-9][0-9,]*(?:\.[0-9]+)?)',
        r'(?:Rs\.?|LKR|රු)\s*([0-9][0-9,]*(?:\.[0-9]+)?)',
    ]

    candidates = []
    for pattern in patterns:
        for match in re.finditer(pattern, text or '', re.I | re.S):
            amount = _parse_decimal_amount(match.group(1))
            if amount is not None:
                candidates.append(amount)

    unique_candidates = []
    seen = set()
    for amount in candidates:
        key = str(amount)
        if key in seen:
            continue
        seen.add(key)
        unique_candidates.append(amount)

    return unique_candidates


def _score_live_result(material, title, url, page_text=''):
    score = 0
    haystack = ' '.join([title or '', url or '', page_text[:2000] if page_text else '']).lower()

    if material.name and material.name.lower() in haystack:
        score += 6
    if material.brand and material.brand.lower() in haystack:
        score += 3
    if material.category and material.category.name.lower() in haystack:
        score += 2

    for token in re.findall(r'[a-z0-9]+', (material.name or '').lower()):
        if len(token) >= 3 and token in haystack:
            score += 1

    return score


def collect_live_market_context(material):
    query = _build_live_search_query(material)
    search_results = _search_web_results(query)

    evidence = []
    best_direct_match = None

    for result in search_results[:MAX_PAGE_FETCHES]:
        page_text = ''
        page_prices = []
        page_title = result['title']

        try:
            page_text = _fetch_url_text(result['url'])
            page_prices = _extract_price_candidates(page_text)
            page_title_match = re.search(r'<title>(.*?)</title>', page_text, re.I | re.S)
            if page_title_match:
                page_title = _normalize_text(_strip_tags(page_title_match.group(1)))
        except (error.HTTPError, error.URLError, ValueError):
            page_text = ''

        score = _score_live_result(material, page_title, result['url'], page_text)
        best_price = page_prices[0] if page_prices else None

        evidence.append({
            'title': page_title,
            'url': result['url'],
            'snippet': result['snippet'],
            'price': str(best_price) if best_price is not None else None,
            'score': score,
        })

        if best_price is not None and score >= 6:
            candidate = {
                'price': best_price,
                'title': page_title,
                'url': result['url'],
                'score': score,
            }
            if best_direct_match is None or candidate['score'] > best_direct_match['score']:
                best_direct_match = candidate

    return {
        'query': query,
        'results': search_results,
        'evidence': evidence,
        'best_direct_match': best_direct_match,
    }


def _extract_json_payload(content):
    content = content.strip()
    if content.startswith('```'):
        content = content.strip('`')
        if content.lower().startswith('json\n'):
            content = content[5:]
    return json.loads(content)


def fetch_material_ai_price(material):
    if not getattr(settings, 'OPENROUTER_API_KEY', ''):
        raise RuntimeError('OPENROUTER_API_KEY is not configured.')

    market_context = collect_live_market_context(material)
    direct_match = market_context['best_direct_match']
    if direct_match is not None:
        return {
            'price': direct_match['price'],
            'raw': {
                'source': 'live_web_page',
                'query': market_context['query'],
                'evidence': market_context['evidence'],
                'selected_source': direct_match,
            },
            'parsed': {
                'price_lkr': float(direct_match['price']),
                'confidence': 0.98,
                'rationale': (
                    'Live web price extracted from a product page matching the requested '
                    f'material ({direct_match["title"]}).'
                ),
            },
        }

    payload = {
        'model': settings.OPENROUTER_MODEL,
        'messages': [
            {
                'role': 'system',
                'content': (
                    'You are a pricing assistant for construction materials in Sri Lanka. '
                    'Use live web evidence when it is provided. '
                    'Prefer exact product-page prices for the same material, brand, and pack size. '
                    'If web evidence is conflicting, choose the most plausible Sri Lankan retail price.'
                ),
            },
            {
                'role': 'user',
                'content': (
                    build_material_price_prompt(material)
                    + '\n\nLive web evidence gathered from search results and product pages:\n'
                    + '\n'.join(
                        (
                            f"- {item['title']} | {item['url']} | "
                            f"price={item['price'] or 'N/A'} | score={item['score']} | "
                            f"{item['snippet']}"
                        )
                        for item in market_context['evidence']
                    )
                    + '\n\nReturn only JSON with keys price_lkr, confidence, and rationale.'
                ),
            },
        ],
        'temperature': 0,
    }

    data = json.dumps(payload).encode('utf-8')
    headers = {
        'Authorization': f'Bearer {settings.OPENROUTER_API_KEY}',
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'HTTP-Referer': settings.OPENROUTER_SITE_URL,
        'X-Title': settings.OPENROUTER_APP_NAME,
    }

    req = request.Request(OPENROUTER_URL, data=data, headers=headers, method='POST')

    try:
        with request.urlopen(req, timeout=30) as response:
            response_data = json.loads(response.read().decode('utf-8'))
    except error.HTTPError as exc:
        raise RuntimeError(f'OpenRouter request failed with status {exc.code}.') from exc
    except error.URLError as exc:
        raise RuntimeError('OpenRouter request could not be completed.') from exc

    try:
        content = response_data['choices'][0]['message']['content']
        parsed = _extract_json_payload(content)
        price = Decimal(str(parsed['price_lkr']))
    except (KeyError, IndexError, TypeError, ValueError, InvalidOperation, json.JSONDecodeError) as exc:
        raise RuntimeError('OpenRouter returned an unexpected price payload.') from exc

    return {
        'price': price,
        'raw': response_data,
        'parsed': parsed,
    }


def material_ai_price_is_stale(material, refresh_interval_hours=None, now=None):
    if material.use_manual_price:
        return False

    refresh_interval_hours = refresh_interval_hours or settings.OPENROUTER_REFRESH_INTERVAL_HOURS
    now = now or timezone.now()

    if not material.last_ai_update:
        return True

    return now - material.last_ai_update >= timedelta(hours=refresh_interval_hours)


def refresh_material_ai_price(material, force=False):
    if not force and not material_ai_price_is_stale(material):
        return None

    result = fetch_material_ai_price(material)
    material.ai_price = result['price']
    material.last_ai_update = timezone.now()
    material.save(update_fields=['ai_price', 'last_ai_update'])

    return result