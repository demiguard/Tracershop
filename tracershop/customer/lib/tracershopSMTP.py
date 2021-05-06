from smtplib import SMTP

from customer.constants import TRACERSHOPNAME

from customer.lib.SQLController as SQL

def SendResetPasswordEmail(user, ResetPasswordRequest):

  sender = "no-reply-tracershop-int@regionh.dk"

  message = f"""From: Tracershop-int <no-reply-tracershop-int@regionh.dk>
  To: {user.username} <{user.email_1}>
  Subject: Genskabning af password

  Nogle har ønsket at genskabe kodeordet for brugeren: {user.username}
  Hvis det er dig så klik på linket neden for:
  {TRACERSHOPNAME}/resetPassword/{str(ResetPasswordRequest.Reference)}

  Dette request udløber kl:{ResetPasswordRequest.expire.strftime("%H:%m")}
  """ 
  ServerConfiguration = SQL.getServerConfig

  with SMTP(ServerConfiguration.SMTPServer) as smtp:
    smtp.sendmail(sender, [user.email_1], message)



