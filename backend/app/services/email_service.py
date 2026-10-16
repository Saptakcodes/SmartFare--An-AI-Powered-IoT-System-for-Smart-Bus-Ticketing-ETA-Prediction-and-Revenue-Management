import logging

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


def _send_email(to: str, subject: str, body: str) -> None:
    # If no API key is set, log to console (dev fallback)
    if not settings.BREVO_API_KEY:
        logger.warning(
            "\n=====================================\n"
            "[DEV EMAIL] To: %s\nSubject: %s\n%s\n"
            "=====================================\n",
            to,
            subject,
            body,
        )
        return

    url = "https://api.brevo.com/v3/smtp/email"
    headers = {
        "accept": "application/json",
        "api-key": settings.BREVO_API_KEY,
        "content-type": "application/json",
    }
    payload = {
        "sender": {"email": settings.EMAIL_FROM, "name": "SmartFare"},
        "to": [{"email": to}],
        "subject": subject,
        "htmlContent": f"<html><body><pre>{body}</pre></body></html>",
    }

    try:
        with httpx.Client(timeout=10.0) as client:
            response = client.post(url, json=payload, headers=headers)
            response.raise_for_status()
            logger.info("Email sent to %s via Brevo", to)
    except httpx.HTTPStatusError as e:
        logger.error("Brevo API error: %s - %s", e.response.status_code, e.response.text)
    except Exception as e:
        logger.error("Unexpected error sending email: %s", e)


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