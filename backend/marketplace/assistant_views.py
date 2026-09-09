from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
import json
import urllib.request
import urllib.error
import re

from .models import Material, MaterialCategory
from estimations.models import EstimationHistory
from .views import _get_user_from_token

OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'


def _call_openrouter_ai(user_message, context_text=""):
    """
    Calls OpenRouter API to generate a natural conversational AI response.
    Falls back to structured response if API key is not configured or request fails.
    """
    api_key = getattr(settings, 'OPENROUTER_API_KEY', '')
    model = getattr(settings, 'OPENROUTER_MODEL', 'openai/gpt-4o-mini')

    if not api_key:
        return None

    system_prompt = (
        "You are the official BuildMe.lk AI Construction & Architectural Assistant in Sri Lanka. "
        "Help users with home construction, estimations, structural advice, material selection, "
        "legal approvals, site planning, worker management, and cost control. "
        "Respond naturally, conversationally, and professionally in clean GitHub Markdown. "
        "Keep answers helpful, accurate, and concise."
    )

    if context_text:
        user_prompt = f"{context_text}\n\nUser Question: {user_message}"
    else:
        user_prompt = user_message

    body = json.dumps({
        'model': model,
        'messages': [
            {'role': 'system', 'content': system_prompt},
            {'role': 'user', 'content': user_prompt},
        ],
        'temperature': 0.7,
    }).encode('utf-8')

    headers = {
        'Authorization': f'Bearer {api_key}',
        'Content-Type': 'application/json',
        'HTTP-Referer': getattr(settings, 'OPENROUTER_SITE_URL', 'http://localhost:8000'),
        'X-Title': getattr(settings, 'OPENROUTER_APP_NAME', 'BuildMe.lk'),
    }

    req = urllib.request.Request(OPENROUTER_URL, data=body, headers=headers, method='POST')

    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            payload = json.loads(response.read().decode('utf-8'))
            reply = payload.get('choices', [{}])[0].get('message', {}).get('content', '').strip()
            return reply if reply else None
    except Exception as exc:
        print(f"OpenRouter API call error: {exc}")
        return None


@api_view(['POST'])
@permission_classes([AllowAny])
def ai_assistant_chat(request):
    """
    AI Chatbot endpoint for natural construction guidance using OpenRouter API,
    material database queries, estimation material lists, bulk buying suggestions,
    and direct add-to-cart integration.
    """
    message = request.data.get('message', '').strip()
    token = request.data.get('token')
    estimation_id = request.data.get('estimation_id')
    history = request.data.get('history', [])

    user = None
    if token:
        u, err = _get_user_from_token(token)
        if not err:
            user = u

    # Fetch available materials from database
    materials_qs = Material.objects.all().select_related('category').prefetch_related('images')
    all_materials = list(materials_qs)

    # Fetch user estimations if authenticated
    estimations_data = []
    selected_estimation = None
    if user:
        user_estimations = EstimationHistory.objects.filter(user=user).order_by('-created_at')[:10]
        for est in user_estimations:
            item_info = {
                "id": est.id,
                "title": est.project_title,
                "sqft": float(est.total_area_sqft),
                "floors": est.number_of_floors,
                "quality": est.quality_level,
                "total_cost": float(est.total_estimated_cost or 0),
                "created_at": est.created_at.strftime('%b %d, %Y'),
            }
            estimations_data.append(item_info)
            if estimation_id and est.id == int(estimation_id):
                selected_estimation = est

    if estimation_id and not selected_estimation:
        try:
            selected_estimation = EstimationHistory.objects.get(id=estimation_id)
        except EstimationHistory.DoesNotExist:
            pass

    msg_lower = message.lower()

    # Determine if query warrants material marketplace recommendations
    material_keywords = [
        "material", "price", "buy", "cart", "cost", "brick", "cement",
        "steel", "sand", "paint", "pipe", "cable", "tile", "estimation",
        "calculate", "list", "quantity", "sqft"
    ]
    should_recommend_materials = selected_estimation is not None or any(k in msg_lower for k in material_keywords)

    recommended_materials = []
    context_text = ""

    if selected_estimation:
        sqft = float(selected_estimation.total_area_sqft)
        floors = selected_estimation.number_of_floors
        context_text = (
            f"The user selected their saved project estimation '{selected_estimation.project_title}' "
            f"({sqft:.0f} sqft, {floors} floor(s), {selected_estimation.quality_level} finish grade). "
            f"Total estimated cost: LKR {selected_estimation.total_estimated_cost or 0:,.2f}."
        )

    # Calculate material requirements if estimation or sqft query
    sqft_val = float(selected_estimation.total_area_sqft) if selected_estimation else None
    if not sqft_val:
        match = re.search(r'(\d+)\s*sqft', msg_lower)
        if match:
            try:
                sqft_val = float(match.group(1))
            except ValueError:
                pass

    if should_recommend_materials:
        sqft_calc = sqft_val or 1000.0
        floors_calc = selected_estimation.number_of_floors if selected_estimation else 1

        bricks_count = int(sqft_calc * 10 * floors_calc)
        cement_bags = int(sqft_calc * 0.35 * floors_calc)
        sand_cubes = max(1.0, round(sqft_calc * 0.005 * floors_calc, 1))
        steel_kg = int(sqft_calc * 0.8 * floors_calc)
        paint_tins = max(1, int(sqft_calc * 0.004 * floors_calc))

        for mat in all_materials:
            name_l = mat.name.lower()
            cat_l = mat.category.name.lower() if mat.category else ""

            sug_qty = 1
            bulk_label = ""

            if "brick" in name_l or "brick" in cat_l:
                sug_qty = max(1000, round(bricks_count / 1000) * 1000)
                bulk_label = f"Bulk Order ({sug_qty:,} pcs)"
            elif "cement" in name_l or "cement" in cat_l:
                if "bag" in mat.unit.lower():
                    sug_qty = max(50, round(cement_bags / 50) * 50)
                    bulk_label = f"Bulk Pack ({sug_qty} Bags)"
                else:
                    sug_qty = 1
                    bulk_label = "1 Unit"
            elif "steel" in name_l or "bar" in name_l or "steel" in cat_l:
                sug_qty = max(20, int(steel_kg / 10))
                bulk_label = f"Bulk Bundle ({sug_qty} Rods)"
            elif "sand" in name_l or "sand" in cat_l:
                sug_qty = max(2, int(sand_cubes))
                bulk_label = f"Bulk Supply ({sug_qty} Cubes)"
            elif "paint" in name_l or "paint" in cat_l:
                sug_qty = max(2, paint_tins)
                bulk_label = f"Bulk Pack ({sug_qty} x 20L Tins)"
            elif "cable" in name_l or "wire" in name_l or "electrical" in cat_l:
                sug_qty = max(5, int(sqft_calc / 200))
                bulk_label = f"Pack ({sug_qty} Rolls)"
            elif "pipe" in name_l or "pvc" in name_l or "plumbing" in cat_l:
                sug_qty = max(10, int(sqft_calc / 100))
                bulk_label = f"Pack ({sug_qty} Pipes)"
            else:
                sug_qty = 10
                bulk_label = f"Batch ({sug_qty} {mat.unit}s)"

            img_url = None
            try:
                if hasattr(mat, 'images') and mat.images.exists():
                    first_img = mat.images.first()
                    if first_img and first_img.image:
                        img_url = first_img.image.url
            except Exception:
                pass

            recommended_materials.append({
                "id": mat.id,
                "name": mat.name,
                "brand": mat.brand or "Standard Grade",
                "category": mat.category.name if mat.category else "Building Materials",
                "unit": mat.unit,
                "unit_price": float(mat.current_price),
                "suggested_quantity": sug_qty,
                "bulk_label": bulk_label,
                "total_price": float(mat.current_price) * sug_qty,
                "image_url": img_url,
            })

    # Try calling OpenRouter AI
    ai_reply = _call_openrouter_ai(message, context_text)

    if not ai_reply:
        # Fallback response generator if OpenRouter key is not set or times out
        if selected_estimation:
            ai_reply = (
                f"Here is the calculated material breakdown & marketplace buying list for your project **'{selected_estimation.project_title}'** "
                f"({selected_estimation.total_area_sqft} sqft, {selected_estimation.number_of_floors} Floor(s)):\n\n"
                f"- 🧱 **Clay Bricks**: ~{int(float(selected_estimation.total_area_sqft)*10):,} pcs (Bulk bundle suggestion: 1,000 pcs)\n"
                f"- 📦 **Cement**: ~{int(float(selected_estimation.total_area_sqft)*0.35)} bags (50kg SLS certified)\n"
                f"- 🏗️ **Steel Rods**: ~{int(float(selected_estimation.total_area_sqft)*0.8):,} kg\n"
                f"- ⏳ **River Sand**: ~{round(float(selected_estimation.total_area_sqft)*0.005, 1)} cubes\n\n"
                f"You can add any material in bulk directly to your cart below!"
            )
        elif sqft_val:
            ai_reply = (
                f"Here is the estimated material breakdown and bulk purchasing list for a **{sqft_val:,.0f} sqft** project:\n\n"
                f"- 🧱 **Clay Bricks**: ~{int(sqft_val*10):,} pcs\n"
                f"- 📦 **Cement**: ~{int(sqft_val*0.35)} bags (50kg)\n"
                f"- 🏗️ **Steel Rods**: ~{int(sqft_val*0.8):,} kg\n"
                f"- ⏳ **River Sand**: ~{round(sqft_val*0.005, 1)} cubes\n"
                f"- 🎨 **Emulsion Paint**: ~{max(1, int(sqft_val*0.004))} tins (20L)\n\n"
                f"Click **'Add to Cart'** below on any item to add suggested bulk quantities directly to your marketplace cart."
            )
        else:
            ai_reply = (
                f"Hello! I am your **BuildMe.lk AI Construction & Material Assistant**.\n\n"
                f"I am ready to help you with architectural advice, house plan calculations, material specs, or site planning.\n\n"
                f"Feel free to ask questions like:\n"
                f"- *'What is the best foundation type for clay soil in Sri Lanka?'*\n"
                f"- *'Calculate materials and brick count for a 1500 sqft house'*\n"
                f"- *'Compare Insee cement vs Tokyo cement'* \n\n"
                f"You can also click **'Load Estimation'** to pull your saved project calculations and generate a direct shopping list!"
            )

    return Response({
        "reply": ai_reply,
        "recommended_materials": recommended_materials,
        "estimations_available": estimations_data,
    }, status=status.HTTP_200_OK)
