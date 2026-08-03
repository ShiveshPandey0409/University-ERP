"""SabPaisa payment gateway — reimplemented from App_Code/EncryptionDecryption.cs.

AES-CBC / PKCS7, key & IV are the UTF-8 bytes of authKey/authIV (16 chars = AES-128),
request/response bodies are `k=v&k=v` strings, Base64-encoded.
"""
import base64
from urllib.parse import parse_qsl

from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad

from app.core.config import settings


def _cipher() -> "AES":
    return AES.new(
        settings.sabpaisa_auth_key.encode("utf-8"),
        AES.MODE_CBC,
        settings.sabpaisa_auth_iv.encode("utf-8"),
    )


def encrypt(plaintext: str) -> str:
    ct = _cipher().encrypt(pad(plaintext.encode("utf-8"), AES.block_size))
    return base64.b64encode(ct).decode("utf-8")


def decrypt(cipher_b64: str) -> str:
    raw = base64.b64decode(cipher_b64)
    return unpad(_cipher().decrypt(raw), AES.block_size).decode("utf-8")


def build_redirect(*, client_txn_id: str, amount: str, payer_name: str,
                   payer_email: str, payer_mobile: str, payer_address: str) -> dict:
    """Build the auto-POST payload for the SabPaisa init URL."""
    params = {
        "payerName": payer_name,
        "payerEmail": payer_email or "na@na.com",
        "payerMobile": payer_mobile or "9999999999",
        "payerAddress": payer_address,
        "clientCode": settings.sabpaisa_client_code,
        "transUserName": settings.sabpaisa_trans_user,
        "transUserPassword": settings.sabpaisa_trans_pass,
        "clientTxnId": client_txn_id,
        "amount": amount,
        "amountType": "INR",
        "channelId": "W",
        "mcc": "8795",
        "callbackUrl": settings.sabpaisa_callback_url,
    }
    query = "&".join(f"{k}={v}" for k, v in params.items())
    return {
        "url": settings.sabpaisa_init_url,
        "encData": encrypt(query),
        "clientCode": settings.sabpaisa_client_code,
    }


def parse_response(enc_response: str) -> dict:
    """Decrypt & parse the gateway's encResponse into a dict."""
    return dict(parse_qsl(decrypt(enc_response)))
