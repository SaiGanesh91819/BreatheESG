from django.contrib.auth import get_user_model

User = get_user_model()

def create_user(*, username, email=None, password=None, first_name='', last_name='', role='analyst'):
    """Service function to create a new user with standard encryption parameters."""
    user = User(
        username=username,
        email=email,
        first_name=first_name,
        last_name=last_name,
        role=role
    )
    if password:
        user.set_password(password)
    else:
        user.set_unusable_password()
        
    user.save()
    return user
