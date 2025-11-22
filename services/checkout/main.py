import os
import json
import time
import httpx
import pika
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
MODE = os.getenv("MODE", "SYNC")  # SYNC or ASYNC
PAYMENT_SERVICE_URL = os.getenv("PAYMENT_SERVICE_URL", "http://payment-service:8000/pay")
RABBITMQ_HOST = os.getenv("RABBITMQ_HOST", "rabbitmq")

print(f"Starting Checkout Service in {MODE} mode")

# RabbitMQ Connection (Lazy initialization)
connection = None
channel = None

def get_rabbitmq_channel():
    global connection, channel
    if connection is None or connection.is_closed:
        try:
            connection = pika.BlockingConnection(pika.ConnectionParameters(host=RABBITMQ_HOST))
            channel = connection.channel()
            channel.queue_declare(queue='order.created')
        except Exception as e:
            print(f"Failed to connect to RabbitMQ: {e}")
            return None
    return channel

class Order(BaseModel):
    order_id: str
    amount: float

@app.post("/checkout")
async def checkout(order: Order):
    if MODE == "SYNC":
        # Synchronous: Call Payment Service directly
        try:
            async with httpx.AsyncClient() as client:
                print(f"Calling Payment Service synchronously for order {order.order_id}...")
                response = await client.post(PAYMENT_SERVICE_URL, json=order.dict(), timeout=10.0)
                response.raise_for_status()
                return response.json()
        except httpx.RequestError as exc:
            raise HTTPException(status_code=503, detail=f"Payment service unreachable: {exc}")
        except httpx.HTTPStatusError as exc:
            raise HTTPException(status_code=exc.response.status_code, detail="Payment failed")
            
    elif MODE == "ASYNC":
        # Asynchronous: Publish to RabbitMQ
        ch = get_rabbitmq_channel()
        if not ch:
            raise HTTPException(status_code=503, detail="Messaging service unavailable")
        
        message = json.dumps(order.dict())
        ch.basic_publish(exchange='', routing_key='order.created', body=message)
        print(f"Published order {order.order_id} to queue")
        
        return {"status": "ORDER_ACCEPTED", "message": "Order received and processing started."}
    
    else:
        raise HTTPException(status_code=500, detail="Invalid Configuration")

@app.get("/")
def read_root():
    return {"service": "checkout-service", "mode": MODE}
