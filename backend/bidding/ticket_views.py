from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction as db_transaction

from .models import TicketBundle, ProjectUnlock, ProjectPost


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def purchase_ticket_bundle(request):
    """
    Purchase a new ticket bundle (3 unlocks for LKR 500).
    In the current mock flow, purchase is approved immediately.
    """
    user = request.user

    # Professionals / admins don't need tickets — reject the call
    if user.role in ('PROFESSIONAL', 'ADMIN'):
        return Response(
            {"error": "Professionals do not need ticket bundles."},
            status=status.HTTP_400_BAD_REQUEST
        )

    bundle = TicketBundle.objects.create(
        owner=user,
        unlocks_total=3,
        unlocks_used=0,
        price_paid=500.00,
        status='ACTIVE',
        transaction_ref=request.data.get('transaction_ref', 'MOCK_PAYMENT'),
    )

    return Response({
        "message": "Ticket bundle purchased successfully.",
        "bundle_id": bundle.id,
        "unlocks_remaining": bundle.unlocks_remaining(),
        "price_paid": str(bundle.price_paid),
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def unlock_project(request, project_id):
    """
    Spend one unlock credit to unlock a specific project.
    Returns the full bid list once unlocked.
    """
    user = request.user

    # Professionals bypass entirely — no unlock needed
    if user.role in ('PROFESSIONAL', 'ADMIN'):
        return Response({"already_accessible": True})

    # Check already unlocked
    if ProjectUnlock.objects.filter(user=user, project_id=project_id).exists():
        return Response({"already_unlocked": True, "message": "Project already unlocked."})

    try:
        project = ProjectPost.objects.get(id=project_id)
    except ProjectPost.DoesNotExist:
        return Response({"error": "Project not found."}, status=status.HTTP_404_NOT_FOUND)

    # If ticket_required is False, no need to spend a credit
    if not project.ticket_required:
        return Response({"already_accessible": True})

    # Find an active bundle with remaining credits
    bundle = (
        TicketBundle.objects
        .filter(owner=user, status='ACTIVE')
        .order_by('purchased_at')
        .first()
    )

    if not bundle or not bundle.is_usable():
        return Response(
            {
                "error": "No ticket credits remaining. Please purchase a ticket bundle first.",
                "needs_purchase": True,
            },
            status=status.HTTP_402_PAYMENT_REQUIRED,
        )

    with db_transaction.atomic():
        bundle.unlocks_used += 1
        if bundle.unlocks_remaining() == 0:
            bundle.status = 'EXHAUSTED'
        bundle.save()

        ProjectUnlock.objects.create(bundle=bundle, user=user, project=project)

    return Response({
        "unlocked": True,
        "unlocks_remaining": bundle.unlocks_remaining(),
        "message": f"Project '{project.title}' unlocked successfully.",
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_project_unlock(request, project_id):
    """
    Returns whether the current user has unlocked the given project.
    Also returns ticket credit summary.
    """
    user = request.user

    # Professionals always have access
    if user.role in ('PROFESSIONAL', 'ADMIN'):
        return Response({"unlocked": True, "is_professional": True})

    try:
        project = ProjectPost.objects.get(id=project_id)
    except ProjectPost.DoesNotExist:
        return Response({"error": "Project not found."}, status=status.HTTP_404_NOT_FOUND)

    is_owner = (project.client == user)

    if not project.ticket_required:
        return Response({"unlocked": True, "is_owner": is_owner, "ticket_not_required": True})

    is_unlocked = ProjectUnlock.objects.filter(user=user, project_id=project_id).exists()

    # Count available credits
    active_bundles = TicketBundle.objects.filter(owner=user, status='ACTIVE')
    credits_remaining = sum(b.unlocks_remaining() for b in active_bundles)

    return Response({
        "unlocked": is_unlocked,
        "is_owner": is_owner,
        "credits_remaining": credits_remaining,
        "needs_purchase": not is_unlocked and credits_remaining == 0,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_ticket_bundles(request):
    """List all ticket bundles owned by the current user."""
    bundles = TicketBundle.objects.filter(owner=request.user).order_by('-purchased_at')
    data = [
        {
            "id": b.id,
            "status": b.status,
            "unlocks_total": b.unlocks_total,
            "unlocks_used": b.unlocks_used,
            "unlocks_remaining": b.unlocks_remaining(),
            "price_paid": str(b.price_paid),
            "purchased_at": b.purchased_at,
        }
        for b in bundles
    ]
    # Summary of active credits
    total_credits = sum(b["unlocks_remaining"] for b in data if b["status"] == "ACTIVE")
    return Response({"bundles": data, "total_credits_remaining": total_credits})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_unlocked_projects(request):
    """List all projects this user has unlocked."""
    unlocks = ProjectUnlock.objects.filter(user=request.user).select_related('project').order_by('-unlocked_at')
    data = [
        {
            "project_id": u.project.id,
            "project_title": u.project.title,
            "project_status": u.project.status,
            "unlocked_at": u.unlocked_at,
        }
        for u in unlocks
    ]
    return Response(data)
