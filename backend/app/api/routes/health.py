from fastapi import APIRouter


router = APIRouter(tags=["health"])


@router.api_route("/health", methods=["GET", "HEAD"])
def health_check():
    return {"status": "ok"}
