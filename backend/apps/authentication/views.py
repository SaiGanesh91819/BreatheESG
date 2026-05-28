from rest_framework import views, status, response
from django.contrib.auth import authenticate, login, logout
from rest_framework.permissions import AllowAny, IsAuthenticated
from .serializers import LoginSerializer, RegisterSerializer, UserSerializer

class RegisterView(views.APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        login(request, user)
        return response.Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)

class LoginView(views.APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = authenticate(
            username=serializer.validated_data['username'],
            password=serializer.validated_data['password']
        )
        
        if not user:
            return response.Response(
                {"detail": "Invalid credentials provided."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        login(request, user)
        return response.Response(UserSerializer(user).data)

class LogoutView(views.APIView):
    permission_classes = [AllowAny] # Support stateless logout easily

    def post(self, request):
        logout(request)
        return response.Response({"detail": "Successfully logged out."}, status=status.HTTP_200_OK)

class MeView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return response.Response(UserSerializer(request.user).data)
