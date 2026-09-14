from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction as db_transaction
from django.contrib.auth import get_user_model

from .models import TicketBundle, ProjectUnlock, ProjectPost, QSConnectionUnlock

User = get_user_model()


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def purchase_ticket_bundle(request):
    """
    Purchase bidding tickets, QS consultation tickets, or Ticket Pro Plans.
    
    ticket_type options:
      - 'BIDDING': LKR 1,500 per ticket
      - 'QS': LKR 2,500 per ticket
      - 'PRO_STARTER': LKR 3,500 (1 Bidding Ticket + 1 QS Ticket)
      - 'PRO_MASTER': LKR 7,000 (3 Bidding Tickets + 2 QS Tickets)
    """
    user = request.user

    # Professionals / admins don't purchase client tickets
    if user.role in ('PROFESSIONAL', 'ADMIN'):
        return Response(
            {"error": "Only clients can purchase tickets."},
            status=status.HTTP_400_BAD_REQUEST
        )

    ticket_type = request.data.get('ticket_type', 'BIDDING')
    ref = request.data.get('transaction_ref', 'MOCK_PAYMENT')
    payment_method = request.data.get('payment_method', 'MOCK_PAYMENT')

    try:
        from users.models import PaymentTransaction
    except ImportError:
        PaymentTransaction = None

    if ticket_type == 'PRO_STARTER':
        # Combo: 1 Bidding + 1 QS for LKR 3,500 (save LKR 500)
        total_price = 3500.00
        with db_transaction.atomic():
            bidding_bundle = TicketBundle.objects.create(
                owner=user,
                ticket_type='BIDDING',
                unlocks_total=1,
                unlocks_used=0,
                price_paid=1500.00,
                status='ACTIVE',
                transaction_ref=ref,
            )
            qs_bundle = TicketBundle.objects.create(
                owner=user,
                ticket_type='QS',
                unlocks_total=1,
                unlocks_used=0,
                price_paid=2000.00,
                status='ACTIVE',
                transaction_ref=ref,
            )
            if PaymentTransaction:
                PaymentTransaction.objects.create(
                    user=user,
                    transaction_type='TICKET_PRO_PLAN',
                    amount=total_price,
                    payment_method=payment_method,
                    reference_id=ref,
                    status='COMPLETED'
                )

        bidding_credits = sum(b.unlocks_remaining() for b in TicketBundle.objects.filter(owner=user, ticket_type='BIDDING', status='ACTIVE'))
        qs_credits = sum(b.unlocks_remaining() for b in TicketBundle.objects.filter(owner=user, ticket_type='QS', status='ACTIVE'))

        return Response({
            "message": "Ticket Pro Plan (Starter Combo) activated successfully! 1 Bidding Ticket + 1 QS Ticket added.",
            "ticket_type": "PRO_STARTER",
            "price_paid": str(total_price),
            "bidding_credits_remaining": bidding_credits,
            "qs_credits_remaining": qs_credits,
            "total_credits_remaining": bidding_credits + qs_credits,
        }, status=status.HTTP_201_CREATED)

    elif ticket_type == 'PRO_MASTER':
        # Combo: 3 Bidding + 2 QS for LKR 7,000 (save LKR 2,500)
        total_price = 7000.00
        with db_transaction.atomic():
            bidding_bundle = TicketBundle.objects.create(
                owner=user,
                ticket_type='BIDDING',
                unlocks_total=3,
                unlocks_used=0,
                price_paid=3500.00,
                status='ACTIVE',
                transaction_ref=ref,
            )
            qs_bundle = TicketBundle.objects.create(
                owner=user,
                ticket_type='QS',
                unlocks_total=2,
                unlocks_used=0,
                price_paid=3500.00,
                status='ACTIVE',
                transaction_ref=ref,
            )
            if PaymentTransaction:
                PaymentTransaction.objects.create(
                    user=user,
                    transaction_type='TICKET_PRO_PLAN',
                    amount=total_price,
                    payment_method=payment_method,
                    reference_id=ref,
                    status='COMPLETED'
                )

        bidding_credits = sum(b.unlocks_remaining() for b in TicketBundle.objects.filter(owner=user, ticket_type='BIDDING', status='ACTIVE'))
        qs_credits = sum(b.unlocks_remaining() for b in TicketBundle.objects.filter(owner=user, ticket_type='QS', status='ACTIVE'))

        return Response({
            "message": "Ticket Pro Plan (Master Builder) activated successfully! 3 Bidding Tickets + 2 QS Tickets added.",
            "ticket_type": "PRO_MASTER",
            "price_paid": str(total_price),
            "bidding_credits_remaining": bidding_credits,
            "qs_credits_remaining": qs_credits,
            "total_credits_remaining": bidding_credits + qs_credits,
        }, status=status.HTTP_201_CREATED)

    elif ticket_type == 'QS':
        # Standard QS Ticket: LKR 2,500 each
        try:
            quantity = int(request.data.get('quantity', 1))
            if quantity < 1:
                quantity = 1
        except (ValueError, TypeError):
            quantity = 1

        unit_price = 2500.00
        total_price = unit_price * quantity

        with db_transaction.atomic():
            bundle = TicketBundle.objects.create(
                owner=user,
                ticket_type='QS',
                unlocks_total=quantity,
                unlocks_used=0,
                price_paid=total_price,
                status='ACTIVE',
                transaction_ref=ref,
            )
            if PaymentTransaction:
                PaymentTransaction.objects.create(
                    user=user,
                    transaction_type='QS_TICKET',
                    amount=total_price,
                    payment_method=payment_method,
                    reference_id=ref,
                    status='COMPLETED'
                )

        qs_credits = sum(b.unlocks_remaining() for b in TicketBundle.objects.filter(owner=user, ticket_type='QS', status='ACTIVE'))

        return Response({
            "message": f"{quantity} Quantity Surveyor (QS) Ticket(s) purchased successfully.",
            "bundle_id": bundle.id,
            "quantity": quantity,
            "ticket_type": "QS",
            "unlocks_remaining": bundle.unlocks_remaining(),
            "qs_credits_remaining": qs_credits,
            "price_paid": str(bundle.price_paid),
        }, status=status.HTTP_201_CREATED)

    else:
        # Default: Standard Bidding Ticket: LKR 1,500 each
        try:
            quantity = int(request.data.get('quantity', 1))
            if quantity < 1:
                quantity = 1
        except (ValueError, TypeError):
            quantity = 1

        unit_price = 1500.00
        total_price = unit_price * quantity

        with db_transaction.atomic():
            bundle = TicketBundle.objects.create(
                owner=user,
                ticket_type='BIDDING',
                unlocks_total=quantity,
                unlocks_used=0,
                price_paid=total_price,
                status='ACTIVE',
                transaction_ref=ref,
            )
            if PaymentTransaction:
                PaymentTransaction.objects.create(
                    user=user,
                    transaction_type='BIDDING_TICKET',
                    amount=total_price,
                    payment_method=payment_method,
                    reference_id=ref,
                    status='COMPLETED'
                )

        bidding_credits = sum(b.unlocks_remaining() for b in TicketBundle.objects.filter(owner=user, ticket_type='BIDDING', status='ACTIVE'))

        return Response({
            "message": f"{quantity} Bidding ticket(s) purchased successfully.",
            "bundle_id": bundle.id,
            "quantity": quantity,
            "ticket_type": "BIDDING",
            "unlocks_remaining": bundle.unlocks_remaining(),
            "bidding_credits_remaining": bidding_credits,
            "total_credits_remaining": sum(b.unlocks_remaining() for b in TicketBundle.objects.filter(owner=user, status='ACTIVE')),
            "price_paid": str(bundle.price_paid),
        }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_ticket_bundles(request):
    """List all ticket bundles owned by the current user with detailed credit breakdown."""
    bundles = TicketBundle.objects.filter(owner=request.user).order_by('-purchased_at')
    data = [
        {
            "id": b.id,
            "ticket_type": b.ticket_type,
            "ticket_type_display": b.get_ticket_type_display(),
            "status": b.status,
            "unlocks_total": b.unlocks_total,
            "unlocks_used": b.unlocks_used,
            "unlocks_remaining": b.unlocks_remaining(),
            "price_paid": str(b.price_paid),
            "purchased_at": b.purchased_at,
        }
        for b in bundles
    ]

    active_bundles = [b for b in data if b["status"] == "ACTIVE"]
    bidding_credits = sum(b["unlocks_remaining"] for b in active_bundles if b.get("ticket_type") == "BIDDING")
    qs_credits = sum(b["unlocks_remaining"] for b in active_bundles if b.get("ticket_type") == "QS")
    total_credits = sum(b["unlocks_remaining"] for b in active_bundles)

    return Response({
        "bundles": data,
        "bidding_credits_remaining": bidding_credits,
        "qs_credits_remaining": qs_credits,
        "total_credits_remaining": total_credits
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def check_qs_connection(request, qs_id):
    """
    Check if the current client has unlocked contact with the given QS professional.
    Also returns available QS ticket credits for the user.
    """
    user = request.user
    unlocked = False
    qs_credits = 0

    is_owner = False
    if user and user.is_authenticated:
        if user.id == qs_id:
            unlocked = True
            is_owner = True
        else:
            unlocked = QSConnectionUnlock.objects.filter(client=user, qs_professional_id=qs_id).exists()
        active_qs_bundles = TicketBundle.objects.filter(owner=user, ticket_type='QS', status='ACTIVE')
        qs_credits = sum(b.unlocks_remaining() for b in active_qs_bundles)

    return Response({
        "unlocked": unlocked,
        "is_owner": is_owner,
        "qs_credits_remaining": qs_credits,
        "ticket_price": 2500.00,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def unlock_qs_connection(request):
    """
    Client spends 1 QS Ticket credit to unlock direct contact with a Quantity Surveyor.
    """
    user = request.user
    if getattr(user, 'role', '') != 'CLIENT':
        return Response(
            {"error": "Only clients can unlock Quantity Surveyor contacts."},
            status=status.HTTP_400_BAD_REQUEST
        )

    qs_id = request.data.get('qs_id')
    if not qs_id:
        return Response({"error": "qs_id is required."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        qs_user = User.objects.select_related('professional_profile').get(id=qs_id)
    except User.DoesNotExist:
        return Response({"error": "Professional not found."}, status=status.HTTP_404_NOT_FOUND)

    prof_profile = getattr(qs_user, 'professional_profile', None)
    if not prof_profile or prof_profile.profession_type != 'QS':
        return Response({"error": "Target professional is not a Quantity Surveyor."}, status=status.HTTP_400_BAD_REQUEST)

    # Check if already unlocked
    if QSConnectionUnlock.objects.filter(client=user, qs_professional=qs_user).exists():
        active_qs_bundles = TicketBundle.objects.filter(owner=user, ticket_type='QS', status='ACTIVE')
        return Response({
            "unlocked": True,
            "already_unlocked": True,
            "message": "You are already connected with this Quantity Surveyor.",
            "qs_credits_remaining": sum(b.unlocks_remaining() for b in active_qs_bundles),
        }, status=status.HTTP_200_OK)

    # Find active QS bundle with remaining credits
    bundle = (
        TicketBundle.objects
        .filter(owner=user, ticket_type='QS', status='ACTIVE')
        .order_by('purchased_at')
        .first()
    )

    if not bundle or not bundle.is_usable():
        return Response(
            {
                "error": "A QS Consultation Ticket (LKR 2,500) is required to connect with this Quantity Surveyor.",
                "needs_ticket": True,
                "ticket_price": 2500.00,
            },
            status=status.HTTP_402_PAYMENT_REQUIRED
        )

    with db_transaction.atomic():
        bundle.unlocks_used += 1
        if bundle.unlocks_remaining() == 0:
            bundle.status = 'EXHAUSTED'
        bundle.save(update_fields=['unlocks_used', 'status'])

        QSConnectionUnlock.objects.create(
            client=user,
            qs_professional=qs_user,
            bundle=bundle,
        )

    active_qs_bundles = TicketBundle.objects.filter(owner=user, ticket_type='QS', status='ACTIVE')
    return Response({
        "success": True,
        "unlocked": True,
        "message": f"Successfully connected with {qs_user.get_full_name() or qs_user.username}! Contact details unlocked.",
        "qs_credits_remaining": sum(b.unlocks_remaining() for b in active_qs_bundles),
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def unlock_project(request, project_id):
    """
    In the ticketing system, bidding tickets are used exclusively to publish tenders.
    Reviewing bids is freely accessible.
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
    """
    user = request.user

    try:
        project = ProjectPost.objects.get(id=project_id)
    except ProjectPost.DoesNotExist:
        return Response({"error": "Project not found."}, status=status.HTTP_404_NOT_FOUND)

    is_owner = (project.client == user)
    is_professional = (user.role == 'PROFESSIONAL')

    active_bundles = TicketBundle.objects.filter(owner=user, ticket_type='BIDDING', status='ACTIVE')
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
