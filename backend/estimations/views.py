import os
from io import BytesIO
import json
from urllib import error, request

from django.conf import settings
from django.http import FileResponse
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from .models import EstimationHistory, MaterialPrices
from .serializers import EstimationHistorySerializer


OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'


def _money(value):
    return f"LKR {int(round(float(value or 0))):,}"


def _included_sections():
    return [
        ('Building Details', ['Land size', 'House size', 'Number of floors', 'Rooms', 'Bathrooms', 'Kitchen', 'Garage', 'Balcony']),
        ('Material Estimation', ['Cement', 'Cement quantity', 'Cement brands', 'SLS certified cement', 'Sand', 'River sand', 'Manufactured sand', 'Metal', '1/2 metal', '3/4 metal', 'Bricks / Blocks', 'Brick quantity', 'Block quantity']),
        ('Steel Rods', ['10mm rods', '12mm rods', '16mm rods', '20mm rods']),
        ('Electrical Estimation', ['Wires 1.5mm', 'Wires 2.5mm', 'Wires 4mm', 'Wires 6mm', 'Electrical items', 'Switches', 'Lights', 'DB boards', 'CCTV', 'Fans']),
        ('Plumbing Estimation', ['Pipes', 'Water systems', 'Bathroom fittings', 'Drainage systems']),
        ('Roofing Estimation', ['Roofing sheets', 'Roof tiles', 'Timber', 'Steel structures']),
        ('Interior Estimation', ['Furniture', 'Paint', 'Curtains', 'Cupboards', 'Decorations', 'TV', 'Air conditioner']),
        ('Labor Estimation', ['Mason charges', 'Electrician charges', 'Painter charges', 'Plumber charges', 'Welder charges']),
        ('Transport Estimation', ['Material delivery charges', 'Vehicle charges', 'Mountain area extra costs']),
        ('Legal & Approval Estimation', ['Lawyer fees', 'Plan approval charges', 'Municipality charges']),
        ('Timeline Estimation', ['Foundation time', 'Wall construction time', 'Roofing time', 'Finishing time', 'Total construction duration']),
    ]


def _fallback_design_brief(sqft, floors, rooms, quality):
    luxury = quality == 'LUXURY'
    multi_floor = floors > 1
    return {
        'design_title': 'Modern Family Residence' if not luxury else 'Premium Contemporary Residence',
        'style_summary': (
            'A practical, efficient home design with a clean footprint and cost control focus.'
            if not luxury
            else 'A premium home concept with stronger visual presence, larger openings, and upgraded finishes.'
        ),
        'recommended_layout': [
            'Use a compact rectangular or L-shaped footprint to reduce structural waste.',
            'Place wet areas close together to reduce plumbing costs.',
            'Keep living, dining, and kitchen circulation simple for better usable space.',
            'Use cross-ventilation and natural light to lower long-term energy use.',
        ] + ([
            'Add a central stair core and cluster bedrooms for efficient circulation.'
        ] if multi_floor else []),
        'material_strategy': [
            'Prioritize SLS-certified cement and consistent branded materials for reliability.',
            'Use the estimate to lock brand choices before ordering bulk materials.',
            'Reserve budget for roofing and finishing upgrades if the client wants a premium look.',
        ],
        'client_note': f'Estimated for a {sqft} sqft, {floors}-floor, {rooms}-room project with {quality.lower()} finish expectations.',
    }


def _generate_design_brief(sqft, floors, rooms, quality, details=None):
    details = details or {}
    if not getattr(settings, 'OPENROUTER_API_KEY', ''):
        brief = _fallback_design_brief(sqft, floors, rooms, quality)
        brief['client_note'] = details.get('project_title') or brief['client_note']
        return brief

    details_text = json.dumps(details, ensure_ascii=False, indent=2)

    prompt = (
        'You are a construction estimator and residential designer. '
        'Decide the most suitable house design direction for the client based on the project inputs. '
        'Return ONLY valid JSON with keys: design_title, style_summary, recommended_layout, material_strategy, client_note. '
        'recommended_layout and material_strategy must be arrays of short strings. '
        f'Project core inputs: total_area_sqft={sqft}, number_of_floors={floors}, number_of_rooms={rooms}, quality_level={quality}. '
        f'Additional client details: {details_text}. '
        'Prefer practical Sri Lankan home planning, good cost control, and a client-friendly recommendation.'
    )

    body = json.dumps({
        'model': settings.OPENROUTER_MODEL,
        'messages': [
            {'role': 'system', 'content': 'You produce concise construction design recommendations in JSON only.'},
            {'role': 'user', 'content': prompt},
        ],
        'temperature': 0.3,
    }).encode('utf-8')

    headers = {
        'Authorization': f'Bearer {settings.OPENROUTER_API_KEY}',
        'Content-Type': 'application/json',
        'HTTP-Referer': getattr(settings, 'OPENROUTER_SITE_URL', 'http://localhost:8000'),
        'X-Title': getattr(settings, 'OPENROUTER_APP_NAME', 'BuildMe.lk'),
    }

    req = request.Request(OPENROUTER_URL, data=body, headers=headers, method='POST')

    try:
        with request.urlopen(req, timeout=30) as response:
            payload = json.loads(response.read().decode('utf-8'))
    except (error.URLError, error.HTTPError, TimeoutError, json.JSONDecodeError, KeyError, IndexError):
        return _fallback_design_brief(sqft, floors, rooms, quality)

    content = payload.get('choices', [{}])[0].get('message', {}).get('content', '').strip()
    try:
        parsed = json.loads(content)
    except json.JSONDecodeError:
        return _fallback_design_brief(sqft, floors, rooms, quality)

    if not isinstance(parsed, dict):
        return _fallback_design_brief(sqft, floors, rooms, quality)

    return {
        'design_title': parsed.get('design_title') or _fallback_design_brief(sqft, floors, rooms, quality)['design_title'],
        'style_summary': parsed.get('style_summary') or _fallback_design_brief(sqft, floors, rooms, quality)['style_summary'],
        'recommended_layout': parsed.get('recommended_layout') or _fallback_design_brief(sqft, floors, rooms, quality)['recommended_layout'],
        'material_strategy': parsed.get('material_strategy') or _fallback_design_brief(sqft, floors, rooms, quality)['material_strategy'],
        'client_note': parsed.get('client_note') or _fallback_design_brief(sqft, floors, rooms, quality)['client_note'],
    }


def _draw_pdf_watermark(canvas, document):
    logo_path = os.path.join(settings.BASE_DIR, 'media', 'logo.png')
    if not os.path.exists(logo_path):
        logo_path = os.path.join(settings.BASE_DIR, '..', 'frontend', 'public', 'logo.png')

    if os.path.exists(logo_path):
        canvas.saveState()
        try:
            canvas.setFillAlpha(0.12)
            canvas.setStrokeAlpha(0.12)

            width, height = A4
            wm_width = 145 * mm
            wm_height = 50 * mm
            x = (width - wm_width) / 2.0
            y = (height - wm_height) / 2.0

            canvas.drawImage(
                logo_path,
                x,
                y,
                width=wm_width,
                height=wm_height,
                mask='auto',
                preserveAspectRatio=True,
            )
        except Exception as e:
            print("Error adding watermark to estimation PDF:", e)
        finally:
            canvas.restoreState()


def _build_pdf(estimation):
    buffer = BytesIO()
    document = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=18 * mm,
        bottomMargin=18 * mm,
    )

    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name='SectionTitle', parent=styles['Heading2'], spaceAfter=8, textColor=colors.HexColor('#8B4434')))
    styles.add(ParagraphStyle(name='BodySmall', parent=styles['BodyText'], fontSize=9, leading=12, spaceAfter=4))
    styles.add(ParagraphStyle(name='BodyTiny', parent=styles['BodyText'], fontSize=8, leading=10, textColor=colors.HexColor('#5F5F5F')))

    design = estimation.design_recommendation_json or _fallback_design_brief(
        estimation.total_area_sqft,
        estimation.number_of_floors,
        estimation.number_of_rooms,
        estimation.quality_level,
    )

    story = []
    story.append(Paragraph('BuildMe.lk Construction Estimation Report', styles['Title']))
    story.append(Spacer(1, 6))
    story.append(Paragraph(f"Project: {estimation.project_title}", styles['Heading2']))
    story.append(Paragraph(f"Prepared on {estimation.created_at.strftime('%d %b %Y')}", styles['BodyTiny']))
    story.append(Spacer(1, 10))

    summary_data = [
        ['Total Area', f"{estimation.total_area_sqft} sqft"],
        ['Floors', str(estimation.number_of_floors)],
        ['Rooms', str(estimation.number_of_rooms)],
        ['Quality', estimation.quality_level.title()],
        ['Estimated Material Cost', _money(estimation.estimated_material_cost)],
        ['Estimated Labor Cost', _money(estimation.estimated_labor_cost)],
        ['Total Estimated Cost', _money(estimation.total_estimated_cost)],
    ]
    summary_table = Table(summary_data, colWidths=[55 * mm, 110 * mm])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F8F1EC')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#2E2A27')),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('LEADING', (0, 0), (-1, -1), 11),
        ('GRID', (0, 0), (-1, -1), 0.35, colors.HexColor('#E6D9D2')),
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#FBF6F3')),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 14))

    story.append(Paragraph('AI Design Decision', styles['SectionTitle']))
    story.append(Paragraph(design.get('design_title', 'Recommended Design'), styles['Heading3']))
    story.append(Paragraph(design.get('style_summary', ''), styles['BodySmall']))
    story.append(Paragraph(f"Client note: {design.get('client_note', '')}", styles['BodySmall']))
    story.append(Paragraph('Recommended Layout', styles['Heading4']))
    for item in design.get('recommended_layout', []):
        story.append(Paragraph(f"- {item}", styles['BodySmall']))
    story.append(Paragraph('Material Strategy', styles['Heading4']))
    for item in design.get('material_strategy', []):
        story.append(Paragraph(f"- {item}", styles['BodySmall']))
    story.append(Spacer(1, 10))

    story.append(Paragraph('Cost Breakdown', styles['SectionTitle']))
    breakdown_rows = [['Category', 'Estimated Amount']]
    for key, value in (estimation.breakdown_json or {}).items():
        breakdown_rows.append([str(key), _money(value)])
    breakdown_table = Table(breakdown_rows, colWidths=[110 * mm, 55 * mm])
    breakdown_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#8B4434')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('GRID', (0, 0), (-1, -1), 0.25, colors.HexColor('#E6D9D2')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#FCF8F6')]),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(breakdown_table)
    story.append(Spacer(1, 12))

    story.append(Paragraph('What Is Included in Estimation?', styles['SectionTitle']))
    for section_title, items in _included_sections():
        story.append(Paragraph(section_title, styles['Heading4']))
        for item in items:
            story.append(Paragraph(f"- {item}", styles['BodySmall']))
        story.append(Spacer(1, 4))

    document.build(story, onFirstPage=_draw_pdf_watermark, onLaterPages=_draw_pdf_watermark)
    buffer.seek(0)
    return buffer


def _get_user_from_request(request):
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return None, Response({'error': 'Missing authorization token.'}, status=status.HTTP_401_UNAUTHORIZED)

    token = auth_header.split(' ', 1)[1].strip()
    if not token:
        return None, Response({'error': 'Missing authorization token.'}, status=status.HTTP_401_UNAUTHORIZED)

    try:
        from firebase_admin import auth as firebase_auth
        from users.models import CustomUser

        decoded_token = firebase_auth.verify_id_token(token)
        uid = decoded_token.get('uid')
        user = CustomUser.objects.get(firebase_uid=uid)
        return user, None
    except CustomUser.DoesNotExist:
        return None, Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as exc:
        return None, Response({'error': str(exc)}, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['POST'])
@permission_classes([AllowAny])  # Allow guest estimations to engage users
def calculate_estimation(request):
    """
    AI-driven/Rule-based smart estimation calculation.
    """
    data = request.data
    sqft = float(data.get('total_area_sqft', 0))
    floors = int(data.get('number_of_floors', 1))
    rooms = int(data.get('number_of_rooms', 1))
    quality = data.get('quality_level', 'STANDARD')
    project_title = (data.get('project_title') or 'My Dream Home').strip()

    project_details = {
        'project_title': project_title,
        'land_size': data.get('land_size', ''),
        'house_size': data.get('house_size', ''),
        'number_of_floors': floors,
        'number_of_rooms': rooms,
        'bathrooms': int(data.get('bathrooms', 0) or 0),
        'kitchen_count': int(data.get('kitchen_count', 0) or 0),
        'garage': data.get('garage', 'No'),
        'balcony': data.get('balcony', 'No'),
        'cement_brand': data.get('cement_brand', ''),
        'cement_type': data.get('cement_type', ''),
        'sand_type': data.get('sand_type', ''),
        'metal_type': data.get('metal_type', ''),
        'roof_type': data.get('roof_type', ''),
        'interior_level': data.get('interior_level', ''),
        'timeline_target': data.get('timeline_target', ''),
        'legal_approval_required': data.get('legal_approval_required', 'Yes'),
        'additional_notes': data.get('additional_notes', ''),
    }
    
    if sqft <= 0:
        return Response({'error': 'Valid area in sqft is required.'}, status=status.HTTP_400_BAD_REQUEST)

    # Base pricing logic (In a real app, this queries MaterialPrices DB or LLM AI_chatbot logic)
    # Sri Lanka average estimates (LKR)
    base_rate_per_sqft = 8500 if quality == 'STANDARD' else 14000
    
    # Adjustments
    multi_floor_factor = 1.15 if floors > 1 else 1.0
    
    estimated_material_cost = (sqft * base_rate_per_sqft * 0.65) * multi_floor_factor
    estimated_labor_cost = (sqft * base_rate_per_sqft * 0.35) * multi_floor_factor
    total_cost = estimated_material_cost + estimated_labor_cost

    # Granular Breakdown structure
    breakdown = {
        "Cement & Sand": estimated_material_cost * 0.25,
        "Bricks/Blocks": estimated_material_cost * 0.15,
        "Steel & Iron": estimated_material_cost * 0.20,
        "Roofing": estimated_material_cost * 0.15,
        "Plumbing & Electrical": estimated_material_cost * 0.15,
        "Finishing & Painting": estimated_material_cost * 0.10,
        "Labor (Mason, Carpenter, etc.)": estimated_labor_cost
    }

    design_recommendation = _generate_design_brief(sqft, floors, rooms, quality, project_details)

    # Save to history if a Firebase token is provided
    user = None
    auth_header = request.headers.get('Authorization', '')
    if auth_header.startswith('Bearer '):
        user, _ = _get_user_from_request(request)
    
    estimation = EstimationHistory.objects.create(
        user=user,
        project_title=project_title,
        total_area_sqft=sqft,
        number_of_floors=floors,
        number_of_rooms=rooms,
        quality_level=quality,
        project_details_json=project_details,
        estimated_material_cost=estimated_material_cost,
        estimated_labor_cost=estimated_labor_cost,
        total_estimated_cost=total_cost,
        breakdown_json=breakdown,
        design_recommendation_json=design_recommendation,
    )

    return Response({
        "message": "Estimation calculated successfully",
        "data": EstimationHistorySerializer(estimation).data,
        "pdf_url": f"/api/estimations/{estimation.id}/pdf/",
    }, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_user_estimations(request):
    user, error_response = _get_user_from_request(request)
    if error_response:
        return error_response

    estimations = EstimationHistory.objects.filter(user=user).order_by('-created_at')
    serializer = EstimationHistorySerializer(estimations, many=True)
    payload = serializer.data

    for item in payload:
        item['pdf_url'] = f"/api/estimations/{item['id']}/pdf/"

    return Response(payload)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_estimation_detail(request, estimation_id):
    try:
        estimation = EstimationHistory.objects.get(id=estimation_id)
    except EstimationHistory.DoesNotExist:
        return Response({'error': 'Estimation not found.'}, status=status.HTTP_404_NOT_FOUND)

    serializer = EstimationHistorySerializer(estimation)
    payload = serializer.data
    payload['pdf_url'] = f"/api/estimations/{estimation.id}/pdf/"
    return Response(payload, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([AllowAny])
def download_estimation_pdf(request, estimation_id):
    try:
        estimation = EstimationHistory.objects.get(id=estimation_id)
    except EstimationHistory.DoesNotExist:
        return Response({'error': 'Estimation not found.'}, status=status.HTTP_404_NOT_FOUND)

    buffer = _build_pdf(estimation)
    filename = f'estimation-{estimation.id}.pdf'
    return FileResponse(buffer, as_attachment=True, filename=filename, content_type='application/pdf')


@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_user_estimation(request, estimation_id):
    """Delete a saved estimation owned by the user."""
    user, error_response = _get_user_from_request(request)
    if error_response:
        return error_response

    try:
        estimation = EstimationHistory.objects.get(id=estimation_id, user=user)
        estimation.delete()
        return Response({"message": "Estimation deleted successfully."}, status=status.HTTP_200_OK)
    except EstimationHistory.DoesNotExist:
        return Response({"error": "Estimation not found or not owned by you."}, status=status.HTTP_404_NOT_FOUND)