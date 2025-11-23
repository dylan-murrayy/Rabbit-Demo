# Mastering Microservices: The Sync vs Async Showdown

> **"Why is my microservice architecture slower than my monolith?"**

![Dashboard Home](images/home.png)

This project is a hands-on demonstration of the two most common communication patterns in microservices: **Synchronous (HTTP)** and **Asynchronous (Message Queues)**.

It includes a **Side-by-Side Visualization** so you can *feel* the difference in latency and user experience.

---

## What You Will Learn
By building and running this project, you will understand:
1.  **Coupling**: Why Service A shouldn't crash just because Service B is down.
2.  **Latency**: How blocking calls stack up and kill performance.
3.  **Event-Driven Architecture**: How to use RabbitMQ to decouple services.
4.  **Developer Experience**: How to visualize these concepts for your team.

---

---

## 📖 The Story of Scaling: When to Switch?

Imagine you are building **"TicketMaster for Hamsters"**.

### Phase 1: The MVP (100 Users)
You build everything **Synchronously**.
*   User clicks "Buy Ticket".
*   Server calls Bank API (3s).
*   Server calls Email API (2s).
*   User waits 5 seconds. 😴
*   **Verdict**: It's fine. It's simple. It works.

### Phase 2: The Viral Hit (10,000 Users)
Your site goes viral. 10,000 people try to buy tickets at once.
*   Your server has 50 threads.
*   All 50 threads are stuck waiting for the Bank API.
*   User #51 gets a "Connection Refused" error. 💥
*   **The Problem**: Your app isn't doing work; it's just *waiting*.

### Phase 3: The Async Revolution
You switch to **Asynchronous** queues.
*   User clicks "Buy Ticket".
*   Server says "Request Received!" (Instant). ⚡️
*   Server puts a message in RabbitMQ.
*   Worker process handles the Bank and Email in the background.
*   **Verdict**: Your server can handle 10,000 requests/second because it never waits.

---

## 🏗 The Architecture

### 1. The "Sync" Trap (Blocking)
This is how most people start. Service A calls Service B directly.
*   **The Problem**: If Payment takes 3 seconds, Checkout takes 3 seconds. The user waits.
*   **The Risk**: If Payment is down, Checkout throws a 500 Error.

```mermaid
sequenceDiagram
    participant User
    participant Checkout
    participant Payment
    User->>Checkout: POST /checkout
    Note right of User: ⏳ WAITING...
    Checkout->>Payment: POST /pay
    Note right of Checkout: 🛑 BLOCKED
    Payment-->>Checkout: 200 OK (After 3s)
    Checkout-->>User: 200 OK
```

### 2. The "Async" Solution (Non-Blocking)
This is how you scale. Service A sends a message and moves on.
*   **The Benefit**: Checkout responds instantly. The user is happy.
*   **The Resilience**: If Payment is down, the message waits in the Queue. Nothing is lost.

```mermaid
sequenceDiagram
    participant User
    participant Checkout
    participant Queue
    participant Payment
    User->>Checkout: POST /checkout
    Checkout->>Queue: Publish "Order Created"
    Checkout-->>User: 202 Accepted (Instant!)
    Note right of User: ✅ DONE
    Queue->>Payment: Consume Message
    Note right of Payment: ⚙️ Processing in Background...
```

---

## Code Deep Dive
See how simple the code difference is?

### Synchronous (The "Bad" Way)
```python
# services/checkout/main.py (Sync Mode)
import httpx

def checkout(order):
    # 🛑 BLOCKS here until Payment responds
    response = httpx.post("http://payment-service/pay", json=order)
    return response.json()
```

### Asynchronous (The "Good" Way)
```python
# services/checkout/main.py (Async Mode)
import pika

def checkout(order):
    # 🚀 SENDS message and returns immediately
    channel.basic_publish(exchange='', routing_key='order.created', body=json.dumps(order))
    return {"status": "Processing in background"}
```

---

## Run the Demo (The Showdown)

We've built a special **Side-by-Side Mode** that runs both architectures at the same time so you can race them.

### 1. Start the Stack
```bash
docker compose -p rabbit-demo-combined -f docker-compose.combined.yml up --build
```

### 2. Open the Dashboard
Go to **http://localhost:3000**

### 3. The Challenge
1.  Click **"Trigger Sync Checkout"** (Left).
    *   *Observation*: The UI freezes. You can't do anything for 3 seconds.
    *   *Why*: The browser is waiting for the server, which is waiting for the payment service.
2.  Click **"Trigger Async Checkout"** (Right).
    *   *Observation*: Instant success!
    *   *Why*: The server offloaded the work to RabbitMQ and replied instantly.

---

## Under the Hood Concepts

![Under the Hood](images/Under-the-hood.png)

### Resource Exhaustion
In the Sync model, every waiting request holds a thread or connection open. If you have 1000 users, you need 1000 threads. In Async, you can handle 1000 users with just a few threads because you aren't waiting.

### Load Leveling
If 1000 orders come in at once:
*   **Sync**: Your Payment service crashes under the load.
*   **Async**: The Queue fills up. The Payment service processes them one by one at its own pace. The system survives.

---

## 🧠 The Decision Matrix

![Decision Matrix](images/decision-matrix.png)

| Feature | Synchronous (HTTP) | Asynchronous (Queues) |
| :--- | :--- | :--- |
| **Latency** | **High** (Additive: A + B + C) | **Low** (Constant: A only) |
| **Coupling** | **Tight** (If B fails, A fails) | **Loose** (If B fails, A is fine) |
| **Complexity** | **Low** (Easy to trace) | **Medium** (Requires Broker) |
| **Best For** | Login, Search, GET requests | Emails, Reports, Heavy Processing |

---

## 📚 Glossary of Terms

---

## 📚 Glossary of Terms

| Term | Definition | Analogy |
| :--- | :--- | :--- |
| **Message Broker** | The system that manages queues and exchanges (RabbitMQ). | **The Post Office** (Receives, sorts, and holds mail). |
| **Producer** | The service that sends the message (Checkout). | The customer dropping a letter in the mailbox. |
| **Consumer** | The service that processes the message (Payment). | The mail carrier delivering the letter. |
| **Message Queue** | A buffer that holds messages until they can be processed. | The line of ticket orders at the counter. |
| **Exchange** | The post office that routes messages to the correct queue. | The mail sorting center. |
| **Backpressure** | The ability to say "I'm full, stop sending" (or buffering). | A dam holding back a flood. |
| **Idempotency** | Handling the same message twice without side effects. | Pressing "Call Elevator" 10 times doesn't send 10 elevators. |
| **Ack (Acknowledgement)** | The signal that a message was successfully processed. | Signing for a package delivery. |