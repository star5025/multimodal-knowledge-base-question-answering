import base64
import json
from pathlib import Path

from app.core.config import get_settings


class OcrError(RuntimeError):
    pass


def _create_tencent_ocr_client(secret_id: str, secret_key: str, region: str):
    try:
        from tencentcloud.common import credential
        from tencentcloud.common.profile.client_profile import ClientProfile
        from tencentcloud.common.profile.http_profile import HttpProfile
        from tencentcloud.ocr.v20181119 import ocr_client, models
    except Exception as exc:
        raise OcrError("Tencent Cloud OCR SDK is not installed.") from exc

    cred = credential.Credential(secret_id, secret_key)
    http_profile = HttpProfile()
    http_profile.endpoint = "ocr.tencentcloudapi.com"
    client_profile = ClientProfile()
    client_profile.httpProfile = http_profile
    return ocr_client.OcrClient(cred, region, client_profile), models


def recognize_image_text(path: Path) -> str:
    settings = get_settings()
    if not settings.tencentcloud_secret_id or not settings.tencentcloud_secret_key:
        raise OcrError("Tencent Cloud OCR credentials are not configured.")

    client, models = _create_tencent_ocr_client(
        settings.tencentcloud_secret_id,
        settings.tencentcloud_secret_key,
        settings.tencentcloud_region,
    )
    request = models.GeneralBasicOCRRequest()
    request.from_json_string(json.dumps({"ImageBase64": base64.b64encode(path.read_bytes()).decode("utf-8")}))

    try:
        response = client.GeneralBasicOCR(request)
        data = json.loads(response.to_json_string())
    except Exception as exc:
        raise OcrError(f"Tencent Cloud OCR failed: {exc}") from exc

    return "\n".join(
        item.get("DetectedText", "")
        for item in data.get("TextDetections", [])
        if item.get("DetectedText")
    )
