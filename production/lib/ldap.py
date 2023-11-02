import ldap

# Django

from django.conf import settings

def get_connection():
  connection = ldap.initialize(settings.AUTH_LDAP_SERVER_URI)
  connection.set_option(ldap.OPT_X_TLS_CACERTFILE, settings.LDAP_CERT_PATH)
  connection.set_option(ldap.OPT_X_TLS_REQUIRE_CERT, ldap.OPT_X_TLS_NEVER)
  connection.set_option(ldap.OPT_X_TLS_NEWCTX, 0)
  connection.bind_s(settings.AUTH_LDAP_BIND_DN, settings.AUTH_LDAP_BIND_PASSWORD)

  return connection


def ldap_search(username):
  connection = get_connection()
  res = connection.search_s("OU=Region Hovedstaden,dc=regionh,dc=top,dc=local",
                      ldap.SCOPE_SUBTREE,
                      f"(cn={username})")
  connection.unbind_s()
  return res