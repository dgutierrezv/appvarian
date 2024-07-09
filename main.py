from fastapi import FastAPI, Request, Form, Depends
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from starlette.middleware.sessions import SessionMiddleware
from fastapi.staticfiles import StaticFiles

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")

app.add_middleware(SessionMiddleware, secret_key="your_secret_key")
app.mount("/static", StaticFiles(directory="static"), name="static")

templates = Jinja2Templates(directory="templates")

# MongoDB Configuration
client = AsyncIOMotorClient("mongodb+srv://dgutierrez:ExMv2hxPlRFbxO5F@cluster0.tbkpj5f.mongodb.net/")
db = client.stock_db
collection = db.parts

@app.get("/", response_class=HTMLResponse)
async def read_login(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})

@app.post("/login", response_class=HTMLResponse)
async def login(request: Request, username: str = Form(...), password: str = Form(...)):
    if username == "varian" and password == "1e$civres":
        request.session["user"] = username
        return RedirectResponse(url="/stock", status_code=302)
    return templates.TemplateResponse("login.html", {"request": request, "error": "Invalid credentials"})

@app.get("/stock", response_class=HTMLResponse)
async def read_stock(request: Request):
    if "user" not in request.session:
        return RedirectResponse(url="/", status_code=302)
    parts = await collection.find().to_list(100)
    return templates.TemplateResponse("stock.html", {"request": request, "parts": parts})

@app.post("/add_part", response_class=HTMLResponse)
async def add_part(request: Request, part_number: str = Form(...), description: str = Form(...), quantity: int = Form(...), warehouse: str = Form(...)):
    part = {"part_number": part_number, "description": description, "quantity": quantity, "warehouse": warehouse}
    await collection.insert_one(part)
    return RedirectResponse(url="/stock", status_code=302)

@app.post("/update_part", response_class=HTMLResponse)
async def update_part(request: Request, id: str = Form(...), part_number: str = Form(...), description: str = Form(...), quantity: int = Form(...), warehouse: str = Form(...)):
    await collection.update_one({"_id": ObjectId(id)}, {"$set": {"part_number": part_number, "description": description, "quantity": quantity, "warehouse": warehouse}})
    return RedirectResponse(url="/stock", status_code=302)

@app.post("/delete_part", response_class=HTMLResponse)
async def delete_part(request: Request, id: str = Form(...)):
    await collection.delete_one({"_id": ObjectId(id)})
    return RedirectResponse(url="/stock", status_code=302)

@app.post("/search", response_class=HTMLResponse)
async def search(request: Request, query: str = Form(...)):
    parts = await collection.find({
        "$or": [
            {"part_number": {"$regex": query, "$options": "i"}},
            {"description": {"$regex": query, "$options": "i"}},
            {"warehouse": {"$regex": query, "$options": "i"}}
        ]
    }).to_list(100)
    return templates.TemplateResponse("stock.html", {"request": request, "parts": parts})

@app.get("/logout", response_class=HTMLResponse)
async def logout(request: Request):
    request.session.clear()
    return RedirectResponse(url="/", status_code=302)
