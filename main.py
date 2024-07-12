from fastapi import FastAPI, Request, Form, Depends, HTTPException, status, Query
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from starlette.middleware.sessions import SessionMiddleware
from fastapi.staticfiles import StaticFiles

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")

app.add_middleware(SessionMiddleware, secret_key="your_secret_key")

templates = Jinja2Templates(directory="templates")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# MongoDB Configuration
client = AsyncIOMotorClient("mongodb+srv://dgutierrez:ExMv2hxPlRFbxO5F@cluster0.tbkpj5f.mongodb.net/")
db = client.stock_db
collection = db.parts

fake_users_db = {
    "varian": {
        "username": "varian",
        "full_name": "Varian User",
        "email": "varian@example.com",
        "hashed_password": "1e$civres",
        "disabled": False,
    }
}

def fake_hash_password(password: str):
    return password

def authenticate_user(fake_db, username: str, password: str):
    user = fake_db.get(username)
    if not user:
        return False
    if not fake_hash_password(password) == user["hashed_password"]:
        return False
    return user

@app.post("/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(fake_users_db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return {"access_token": user["username"], "token_type": "bearer"}

async def get_current_user(token: str = Depends(oauth2_scheme)):
    user = authenticate_user(fake_users_db, token, token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

@app.get("/", response_class=HTMLResponse)
async def read_login(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})

@app.post("/login", response_class=HTMLResponse)
async def login(request: Request, username: str = Form(...), password: str = Form(...)):
    if not username or not password:
        return templates.TemplateResponse("login.html", {"request": request, "error": "Both fields are required"})
    user = authenticate_user(fake_users_db, username, password)
    if not user:
        return templates.TemplateResponse("login.html", {"request": request, "error": "Invalid credentials"})
    request.session["user"] = username
    return RedirectResponse(url="/stock", status_code=302)

@app.get("/stock", response_class=HTMLResponse)
async def read_stock(request: Request):
    if "user" not in request.session:
        return RedirectResponse(url="/", status_code=302)
    return templates.TemplateResponse("stock.html", {"request": request})

@app.post("/add_part", response_class=HTMLResponse)
async def add_part(request: Request, part_number: str = Form(...), description: str = Form(...), quantity: int = Form(...), warehouse: str = Form(...)):
    existing_part = await collection.find_one({"part_number": part_number, "warehouse": warehouse})
    if existing_part:
        parts = await collection.find().to_list(100)
        return templates.TemplateResponse("stock.html", {"request": request, "parts": parts, "error": "Número de parte ya existe en la bodega"})
    
    part = {"part_number": part_number, "description": description, "quantity": quantity, "warehouse": warehouse}
    await collection.insert_one(part)
    parts = await collection.find(part).to_list(100)
    return templates.TemplateResponse("stock.html", {"request": request, "parts": parts,  "success_add": "Parte agregada correctamente"})


@app.post("/update_part", response_class=HTMLResponse)
async def update_part(request: Request, id: str = Form(...), part_number: str = Form(...), description: str = Form(...), quantity: int = Form(...), warehouse: str = Form(...)):
    await collection.update_one({"_id": ObjectId(id)}, {"$set": {"part_number": part_number, "description": description, "quantity": quantity, "warehouse": warehouse}})
    parts = await collection.find({"part_number": part_number, "description": description, "quantity": quantity, "warehouse": warehouse}).to_list(100)
    return templates.TemplateResponse("stock.html", {"request": request, "parts": parts,  "success_update": "Parte actualizada correctamente"})

@app.post("/delete_part", response_class=HTMLResponse)
async def delete_part(request: Request, id: str = Form(...)):
    result = await collection.delete_one({"_id": ObjectId(id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Part not found")
    parts = await collection.find().to_list(100)
    return templates.TemplateResponse("stock.html", {"request": request, "success_delete": "Parte eliminada correctamente"})

@app.get("/search", response_class=HTMLResponse)
@app.post("/search", response_class=HTMLResponse)
async def search(request: Request, query: str = Query(None), form_query: str = Form(None)):
    if request.method == "POST":
        query = form_query
    parts = await collection.find({
        "$or": [
            {"part_number": {"$regex": query, "$options": "i"}},
            {"description": {"$regex": query, "$options": "i"}},
            {"warehouse": {"$regex": query, "$options": "i"}}
        ]
    }).to_list(100)
    return templates.TemplateResponse("stock.html", {"request": request, "parts": parts})

@app.get("/clean", response_class=HTMLResponse)
async def clean(request: Request):
    return templates.TemplateResponse("stock.html", {"request": request})

@app.get("/logout", response_class=HTMLResponse)
async def logout(request: Request):
    request.session.clear()
    return RedirectResponse(url="/", status_code=302)
