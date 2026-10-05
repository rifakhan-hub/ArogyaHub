from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException


class AppError(Exception):
    def __init__(self, status: int, code: str, message: str):
        self.status = status
        self.code = code
        self.message = message


def error_response(status: int, code: str, message: str) -> JSONResponse:
    return JSONResponse({"error": {"code": code, "message": message}}, status_code=status)


def add_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    def app_error(request: Request, exc: AppError):
        return error_response(exc.status, exc.code, exc.message)

    @app.exception_handler(RequestValidationError)
    def validation_error(request: Request, exc: RequestValidationError):
        return error_response(422, "VALIDATION_ERROR", exc.errors()[0]["msg"])

    @app.exception_handler(HTTPException)
    def http_error(request: Request, exc: HTTPException):
        return error_response(exc.status_code, f"HTTP_{exc.status_code}", str(exc.detail))
