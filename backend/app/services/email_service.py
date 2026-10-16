import logging
import smtplib
from email.mime.text import MIMEText

from app.core.config import settings

logger = logging.getLogger(__name__)


def _send_email(to: str, subject: str, body: str) -> None:
    if not settings.EMAIL_ADDRESS or not settings.EMAIL_PASSWORD:
        # Dev mode: print to console
        logger.warning(
            "\n=====================================\n"
            "[DEV EMAIL] To: %s\nSubject: %s\n%s\n"
            "=====================================\n",
            to,
            subject,
            body,
        )
        return

    msg = MIMEText(body)
    msg["Subject"] = subject
    msg["From"] = settings.EMAIL_ADDRESS
    msg["To"] = to

    # Use SMTP_SSL for port 465
    with smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT) as server:
        server.ehlo()
        server.login(settings.EMAIL_ADDRESS, settings.EMAIL_PASSWORD)
        server.sendmail(settings.EMAIL_ADDRESS, to, msg.as_string())


def send_otp_email(to: str, otp: str, purpose: str = "registration") -> None:
    if purpose == "registration":
        subject = "SmartFare — Verify your email"
        intro = "Welcome to SmartFare. Use this code to verify your email:"
    elif purpose == "password_reset":
        subject = "SmartFare — Password reset code"
        intro = "Use this code to reset your password:"
    else:
        subject = "SmartFare — Verification code"
        intro = "Use this code:"

    body = f"""Hello,

{intro}

    {otp}

This code expires in 10 minutes.

If you didn't request this, ignore this email.

— SmartFare
"""
    _send_email(to, subject, body)