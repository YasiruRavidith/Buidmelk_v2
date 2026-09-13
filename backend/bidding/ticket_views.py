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
    Purchase bidding ticket(s) for posting project tenders.
    Price is LKR 1,500 per ticket.
    """
    user = request.user

    # Professionals / admins don't post client tenders
    if user.role in ('PROFESSIONAL', 'ADMIN'):
        return Response(
            {"error": "Only clients can purchase bidding tickets to post project tenders."},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        quantity = int(request.data.get('quantity', 1))
        if quantity < 1:
            quantity = 1
    except (ValueError, TypeError):
        quantity = 1

    unit_price = 1500.00
    total_price = unit_price * quantity
    ref = request.data.get('transaction_ref', 'MOCK_PAYMENT')

    bundle = TicketBundle.objects.create(
        owner=user,
        unlocks_total=quantity,
        unlocks_used=0,
        price_paid=total_price,
        status='ACTIVE',
        transaction_ref=ref,
    )

    try:
        from users.models import PaymentTransaction
        PaymentTransaction.objects.create(
            user=user,
            transaction_type='BIDDING_TICKET',
            amount=total_price,
            payment_method=request.data.get('payment_method', 'MOCK_PAYMENT'),
            reference_id=ref,
            status='COMPLETED'
        )
    except Exception as e:
        pass

    return Response({
        "message": f"{quantity} Bidding ticket(s) purchased successfully.",
        "bundle_id": bundle.id,
        "quantity": quantity,
        "unlocks_remaining": bundle.unlocks_remaining(),
        "total_credits_remaining": sum(b.unlocks_remaining() for b in TicketBundle.objects.filter(owner=user, status='ACTIVE')),
        "price_paid": str(bundle.price_paid),
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def unlock_project(request, project_id):
    """
    In the new ticketing system, projects and bids do not require unlock credits.
    Bidding tickets are used exclusively to publish tenders.
    """
    return Response({
        "already_unlocked": True,
        "unlocked": True,
        "message": "Proposals and contact info are freely accessible. Bidding tickets are only consumed when posting tenders."
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_project_unlock(request, project_id):
    """
    Returns project access status and current bidding ticket credit balance.
    Projects are accessible to their owners and professionals freely.
    """
    user = request.user

    try:
        project = ProjectPost.objects.get(id=project_id)
    except ProjectPost.DoesNotExist:
        return Response({"error": "Project not found."}, status=status.HTTP_404_NOT_FOUND)

    is_owner = (project.client == user)
    is_professional = (user.role == 'PROFESSIONAL')

    # Count available bidding post credits
    active_bundles = TicketBundle.objects.filter(owner=user, status='ACTIVE')
    credits_remaining = sum(b.unlocks_remaining() for b in active_bundles)

    return Response({
        "unlocked": True,
        "is_owner": is_owner,
        "is_professional": is_professional,
        "credits_remaining": credits_remaining,
        "needs_purchase": False,
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
