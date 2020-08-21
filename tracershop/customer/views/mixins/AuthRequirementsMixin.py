from django.core.exceptions import PermissionDenied

class AdminRequiredMixin:
  def dispatch(self, request, *args, **kwargs):
    if request.user:
      if request.user.is_admin:
        return super().dispatch(request,*args,**kwargs)

    raise PermissionDenied


class StaffRequiredMixin:
  def dispatch(self, request, *args, **kwargs):
    if request.user:
      if request.user.is_admin or request.user.is_staff:
        return super().dispatch(request,*args,**kwargs)

    raise PermissionDenied