import os
import json
import time
import threading
import pika
from fastapi import FastAPI
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
MODE = os.getenv("MODE", "SYNC")
RABBITMQ_HOST = os.getenv("RABBITMQ_HOST", "rabbitmq")

print(f"Starting Payment Service in {MODE} mode")

class PaymentRequest(BaseModel):
    order_id: str
    amount: float

def process_payment(order_id, amount):
    print(f"Processing payment for Order {order_id} (${amount})...")
    time.sleep(3)  # Simulate latency
    print(f"Payment for Order {order_id} COMPLETED.")
    return {"status": "PAID", "order_id": order_id}

# --- HTTP Endpoint (Sync) ---
@app.post("/pay")
def pay(request: PaymentRequest):
    return process_payment(request.order_id, request.amount)

# --- RabbitMQ Consumer (Async) ---
def start_consumer():
    print("Attempting to connect to RabbitMQ...")
    while True:
        try:
            connection = pika.BlockingConnection(pika.ConnectionParameters(host=RABBITMQ_HOST))
            channel = connection.channel()
            channel.queue_declare(queue='order.created')
            channel.queue_declare(queue='payment.completed')

            def callback(ch, method, properties, body):
                data = json.loads(body)
                print(f" [x] Received Order: {data}")
                
                # Process
                result = process_payment(data.get('order_id'), data.get('amount'))
                
                # Publish completion event
                ch.basic_publish(exchange='', routing_key='payment.completed', body=json.dumps(result))
                print(f" [x] Published payment.completed")

            channel.basic_consume(queue='order.created', on_message_callback=callback, auto_ack=True)
            print(" [*] Waiting for messages. To exit press CTRL+C")
            channel.start_consuming()
        except Exception as e:
            print(f"RabbitMQ connection failed: {e}. Retrying in 5s...")
            time.sleep(5)

if MODE == "ASYNC":
    # Start consumer in a background thread so FastAPI can still run (health checks etc)
    t = threading.Thread(target=start_consumer, daemon=True)
    t.start()

@app.get("/")
def read_root():
    return {"service": "payment-service", "mode": MODE}
