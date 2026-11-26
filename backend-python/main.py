"""FastAPI application entry point."""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from routes.user_routes import router as user_router
from routes.post_routes import router as post_router
from routes.system_routes import router as system_router

app = FastAPI(title="React Reg API")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000"], allow_credentials=True,
                   allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                   allow_headers=["Content-Type", "Authorization"])

@app.exception_handler(HTTPException)
async def api_error_response(request, exc):
    return JSONResponse(status_code=exc.status_code, content={"message": exc.detail})

app.include_router(system_router)
app.include_router(user_router)
app.include_router(post_router)
