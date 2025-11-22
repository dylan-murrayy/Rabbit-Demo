# Sync vs Async Microservices Demo

This project demonstrates the difference between **Synchronous** (tightly coupled) and **Asynchronous** (loosely coupled) microservice architectures.

## 🏗 Architecture

### Part 1: Synchronous (Baseline)
- **Checkout Service** calls **Payment Service** directly via HTTP.
- **Behavior**: Blocking. If Payment is slow (simulated 3s delay), Checkout is slow. If Payment is down, Checkout fails.

### Part 2: Asynchronous (RabbitMQ)
- **Checkout Service** publishes an `order.created` event to **RabbitMQ**.
- **Payment Service** consumes the event and processes it in the background.
- **Behavior**: Non-blocking. Checkout returns immediately. Payment processes at its own pace.

## 🚀 How to Run

### 1. Synchronous Mode
Start the services:
```bash
docker-compose up --build
```

**Test it:**
```bash
# This will take ~3 seconds to respond
curl -X POST http://localhost:8000/checkout \
  -H "Content-Type: application/json" \
  -d '{"order_id": "123", "amount": 99.99}'
```

**Simulate Failure:**
Stop the payment service:
```bash
docker-compose stop payment-service
```
Try the curl command again. It will fail immediately.

---

### 2. Asynchronous Mode
Stop previous containers first (`docker-compose down`).

Start the async stack:
```bash
docker-compose -f docker-compose.async.yml up --build
```

**Test it:**
```bash
# This will respond IMMEDIATELY
curl -X POST http://localhost:8000/checkout \
  -H "Content-Type: application/json" \
  -d '{"order_id": "456", "amount": 50.00}'
```

Check the logs to see the payment processing happening in the background:
```bash
docker-compose -f docker-compose.async.yml logs -f payment-service
```

## 📂 Project Structure
- `services/checkout`: FastAPI app (Producer in Async mode)
- `services/payment`: FastAPI app (Consumer in Async mode)
- `docker-compose.yml`: Sync configuration
- `docker-compose.async.yml`: Async configuration with RabbitMQ
