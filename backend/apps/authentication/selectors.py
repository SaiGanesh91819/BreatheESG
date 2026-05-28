from django.contrib.auth import get_user_model

User = get_user_model()

def user_list_active():
    """Selector function returning active database user records."""
    return User.objects.filter(is_active=True)

def user_get_by_id(*, user_id):
    """Selector function returning a specific database user record."""
    try:
        return User.objects.get(id=user_id)
    except User.DoesNotExist:
        return None
