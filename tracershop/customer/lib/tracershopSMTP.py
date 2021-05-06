from smtplib import SMTP
from email.mime.text import MIMEText

from customer.constants import TRACERSHOPNAME

from customer.lib.SQL import SQLController as SQL

def SendResetPasswordEmail(user, ResetPasswordRequest):


  sender = "no-reply-tracershop-int@regionh.dk"




  message = f"""
  Nogle har ønsket at genskabe kodeordet for brugeren: {user.username}
  
  Hvis det er dig så klik på linket neden for:
  {TRACERSHOPNAME}/resetPassword/{str(ResetPasswordRequest.Reference)}

  Dette request udløber kl:{ResetPasswordRequest.expire.strftime("%H:%M")}
  """
  mail = MIMEText(message.encode("utf-8"), _charset="utf-8")
  
  mail['Subject'] = "Genskabning af Password"
  mail['From'] = sender
  mail['To'] = user.email_1
  
  ServerConfiguration = SQL.getServerConfig()

  with SMTP(ServerConfiguration.SMTPServer) as smtp:
    smtp.sendmail(sender, [user.email_1], mail.as_string())



