# Webhook Integration Architecture for Shopee & TikTok Shop

## 1. Overview
This document outlines the production-ready architecture for integrating the Garage Radiator ERP system with external e-commerce platforms (Shopee, TikTok Shop) using webhooks. The goal is to ensure reliable, scalable, and fault-tolerant order synchronization.

## 2. Architecture Components

### 2.1. Webhook Listener (API Gateway / Ingress)
- **Role:** The public-facing endpoint that receives HTTP POST requests from Shopee and TikTok Shop.
- **Responsibilities:**
  - Authenticate and validate webhook signatures (HMAC/SHA256) to ensure the request is genuinely from the platform.
  - Parse the incoming JSON payload.
  - Immediately acknowledge the request (HTTP 200 OK) to prevent the platform from retrying and causing duplicate events.
  - Publish the raw event payload to the Message Queue.

### 2.2. Message Queue (RabbitMQ / Kafka / AWS SQS)
- **Role:** Acts as a buffer between the fast webhook listener and the slower processing workers.
- **Responsibilities:**
  - Decouple the reception of webhooks from their processing.
  - Ensure message durability (messages are persisted to disk until processed).
  - Handle traffic spikes (e.g., during sales events like 11.11) without overwhelming the ERP database.

### 2.3. Processing Workers (Consumer Microservices)
- **Role:** Background services that consume messages from the queue and perform the actual business logic.
- **Responsibilities:**
  - Transform platform-specific order data into the standardized ERP order format.
  - Perform SKU mapping (matching platform SKUs to internal ERP SKUs).
  - Deduplicate events (checking if the order ID already exists in the database).
  - Update inventory levels and create the order record in the database.
  - Acknowledge (ACK) the message in the queue upon successful processing.

### 2.4. Dead-Letter Queue (DLQ)
- **Role:** A secondary queue for messages that fail to process after multiple retries.
- **Responsibilities:**
  - Store messages that encountered unrecoverable errors (e.g., missing SKU mapping, invalid data format, database connection failure).
  - Allow administrators to manually review, fix (e.g., via the "Fix Mapping" modal in the UI), and requeue these messages.

### 2.5. Database (PostgreSQL / SQL Server)
- **Role:** The central source of truth for the ERP system.
- **Responsibilities:** Store orders, inventory, products, and SKU mapping tables.

---

## 3. Data Flow: From Platform Order to Confirmed ERP Order

1. **Order Creation:** A customer places an order on Shopee or TikTok Shop.
2. **Webhook Trigger:** The platform sends an HTTP POST request containing the order details to the ERP's Webhook Listener endpoint.
3. **Validation & Queuing:**
   - The Webhook Listener validates the signature.
   - If valid, it pushes the raw JSON payload to the `orders_incoming_queue`.
   - It returns an HTTP 200 OK to the platform.
4. **Consumption:** A Processing Worker pulls the message from the `orders_incoming_queue`.
5. **Processing & Mapping:**
   - The worker checks if the order has already been processed (Idempotency check).
   - It attempts to map the platform SKU to the internal ERP SKU using the `sku_mappings` table.
6. **Success Path:**
   - If mapping is successful and inventory is available, the worker creates the order in the database and deducts the inventory.
   - The worker ACKs the message, removing it from the queue.
7. **Failure Path (Retry & DLQ):**
   - If a transient error occurs (e.g., DB timeout), the worker NACKs the message, and it is retried (e.g., using exponential backoff).
   - If a non-transient error occurs (e.g., "SKU not found"), or max retries are reached, the message is routed to the `orders_dlq` (Dead-Letter Queue).
8. **Manual Intervention:**
   - The ERP administrator views the DLQ via the "Errors (DLQ)" tab in the Orders UI.
   - The admin fixes the issue (e.g., maps the unknown SKU to an existing product).
   - The admin clicks "Retry", which pushes the message from the DLQ back into the `orders_incoming_queue` for reprocessing.

## 4. Robustness & Fault Tolerance

- **Idempotency:** Every worker operation must be idempotent. If a message is processed twice (e.g., due to a network blip during ACK), the system should recognize the duplicate order ID and safely ignore it.
- **Exponential Backoff:** Retries should not happen immediately. The system should wait progressively longer between retries (e.g., 1s, 5s, 30s, 2m) to allow transient issues to resolve.
- **Monitoring & Alerts:** Set up monitoring (e.g., Prometheus/Grafana) on queue depth. If the DLQ grows beyond a threshold, alert the engineering team.
