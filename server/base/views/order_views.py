from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from base.models import Order, OrderItem
from rest_framework.response import Response

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def getMyOrders(request):
    user = request.user
    orders = Order.objects.filter(user=user).order_by('-createdAt') # 최신순
    data = []

    for order in orders:
        items = OrderItem.objects.filter(order=order)
        item_list = [
            {
                'name': item.name,
                'qty': item.qty,
                'price': item.price,
                'image': item.image,
            } for item in items
        ]

        data.append({
            'orderId': order._id,
            'createdAt': order.createdAt,
            'totalPrice': order.totalPrice,
            'isPaid': order.isPaid,
            'paidAt': order.paidAt,
            'items': item_list,
        })

    return Response(data)
