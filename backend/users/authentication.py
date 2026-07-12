from rest_framework import authentication
from rest_framework import exceptions
from firebase_admin import auth as firebase_auth
from users.models import CustomUser

class FirebaseAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        if not auth_header:
            return None

        parts = auth_header.split(' ')
        if len(parts) != 2:
            return None

        prefix, token = parts
        if prefix.lower() != 'bearer':
            return None

        try:
            decoded_token = firebase_auth.verify_id_token(token)
            uid = decoded_token.get('uid')
            user = CustomUser.objects.get(firebase_uid=uid)
            return (user, None)
        except CustomUser.DoesNotExist:
            raise exceptions.AuthenticationFailed('User account does not exist in BuildMe.lk database.')
        except Exception as e:
            raise exceptions.AuthenticationFailed(str(e))
