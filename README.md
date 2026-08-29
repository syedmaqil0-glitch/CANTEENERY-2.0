# 🍽️ Canteenery

### **Order Smart. Skip the Queue.**

> **The Deterministic Kitchen Engine & Pre-Ordering System for Campus Canteens**

Canteenery is a smart campus canteen platform that allows students to **pre-order food, receive dynamically calculated pickup slots, track their orders in real time, and skip physical queues**.

Behind the scenes, a deterministic **Smart Queue Engine** analyzes kitchen workload, active orders, preparation times, item diversity, and bulk-order pressure to intelligently schedule incoming orders.

---

<div align="center">

### 🚀 Built for smarter campus dining

[![Hackathon](https://img.shields.io/badge/Hackathon-MVP-success?style=for-the-badge)](#)
[![Frontend](https://img.shields.io/badge/Frontend-Vanilla%20JS-yellow?style=for-the-badge)](#)
[![Backend](https://img.shields.io/badge/Backend-Node.js-green?style=for-the-badge)](#)
[![API](https://img.shields.io/badge/API-REST-blue?style=for-the-badge)](#)
[![Status](https://img.shields.io/badge/Status-Working-brightgreen?style=for-the-badge)](#)

</div>

---

## 🧭 Navigation

| 🚀 | Section |
|---|---|
| 📌 | [Problem](#-the-problem) |
| 💡 | [Solution](#-the-canteenery-solution) |
| ⚡ | [Key Features](#-key-features) |
| 🧠 | [Smart Queue Engine](#-smart-queue-engine) |
| 🏗️ | [Architecture](#️-system-architecture) |
| 🔄 | [Order Lifecycle](#-order-lifecycle) |
| 📁 | [Project Structure](#-project-structure) |
| ⚙️ | [Getting Started](#️-getting-started) |
| 🎬 | [Live Demo](#-live-demo-walkthrough) |
| 🧪 | [Testing](#-test-suite) |
| 🏆 | [Hackathon Mapping](#-hackathon-requirements) |

---

# 📌 The Problem

Traditional campus canteens struggle heavily during **breaks and peak lunch hours**.

### Students face:

- 🧍 Long physical queues
- ⏳ Unpredictable waiting times
- 📚 Missed lectures and reduced break time
- ❓ No clear information about when food will be ready
- 🍱 Food being prepared too early

### Kitchen staff face:

- 🔥 Sudden workload spikes
- 📦 Large bulk orders arriving simultaneously
- 📋 Difficult queue prioritization
- 🚫 Poor visibility into inventory
- 🍔 Orders with different preparation complexities

### The result?

```text
Student arrives
      ↓
Long queue
      ↓
Order placed
      ↓
Unknown waiting time
      ↓
Crowded canteen
      ↓
Potentially missed class
💡 The Canteenery Solution

Canteenery changes the traditional workflow.

Instead of:

ORDER → STAND IN QUEUE → WAIT → COLLECT

Canteenery enables:

ORDER
  ↓
SMART WORKLOAD ANALYSIS
  ↓
DYNAMIC PICKUP SLOT
  ↓
KITCHEN PREPARES ORDER
  ↓
LIVE TRACKING
  ↓
GRAB & GO 🚀

The system calculates a dynamic 15-minute pickup window instead of giving students an arbitrary waiting time.

⚡ Key Features
🧠 1. Smart Queue Engine

The heart of Canteenery.

The engine considers:

🍳 Dish preparation time
📦 Quantity of each item
🔀 Number of different dishes
👨‍🍳 Active kitchen workload
🧍 Orders already ahead
📊 Current workload tier
📦 Bulk-order pressure

The result is a deterministic and explainable pickup estimate.

📱 2. Student Ordering Portal

Students can:

Browse the live menu
Filter dishes by category
View availability
See stock levels
Add items to cart
Receive a pickup window
Place an order
Track their order
See their queue position
Inventory states
🟢 AVAILABLE
🟡 LOW STOCK
🔴 SOLD OUT
⚫ UNAVAILABLE
👨‍🍳 3. Kitchen Command Center

Kitchen staff get a dedicated dashboard.

┌─────────────────────────────────────┐
│        KITCHEN COMMAND CENTER       │
├─────────────────────────────────────┤
│                                     │
│  📋 Active Orders                   │
│  📦 Bulk Orders                     │
│  ⏳ Uncollected Orders              │
│  🍽️ Menu Management                │
│  📊 Kitchen Workload                │
│                                     │
└─────────────────────────────────────┘

Staff can transition orders through:

PLACED
   ↓
ACCEPTED
   ↓
PREPARING
   ↓
READY
   ↓
COLLECTED
🍽️ 4. Kitchen Menu Management

Kitchen administrators can manage the menu without changing code.

Admin capabilities
Action	Supported
➕ Add new dish	✅
✏️ Edit dish	✅
💰 Change price	✅
⏱️ Change preparation time	✅
🏷️ Change category	✅
📝 Edit description	✅
🖼️ Change dish image	✅
🟢 Enable dish	✅
🔴 Disable dish	✅
🗑️ Remove dish	✅

Historical orders remain protected even if a menu item is later modified or removed.

📦 5. Bulk Order Routing

Large orders shouldn't block normal orders.

Canteenery automatically identifies large orders.

Bulk conditions
Total quantity > 15
        OR
Single item quantity ≥ 10

When detected:

Normal Order
     │
     ├── Small → Standard Queue
     │
     └── Large → Bulk Queue
                    ↓
              Additional Buffer

This helps prevent one large order from clogging the entire kitchen queue.

⚡ 6. Interactive Smart Engine Lab

Canteenery includes an interactive engine laboratory at:

/engine.html

It allows developers and judges to experiment with:

Kitchen workload
Active queue size
Order quantity
Dish complexity
Bulk orders
Inventory conditions
Example scenarios
🟢 Low Traffic
🟡 Moderate Rush
🟠 Heavy Peak
📦 Bulk Tech Club Order
🔴 Sold Out Masala Dosa

This makes the queue algorithm demonstrable rather than hidden inside the code.

🧠 Smart Queue Engine

The engine calculates:

$$ T_{prep} = \max \left( 3,\, T_{base} + T_{queue} + T_{workload} + T_{bulk} \right) $$
1️⃣ Base Preparation Time
$$ T_{base} = \max(t_i) + \sum(q_i-1)\times1.5 + (N_{distinct}-1)\times1.0 $$

This accounts for:

Dominant dish preparation time
Additional quantities
Multiple dish types
2️⃣ Queue Delay
$$ T_{queue} = round \left( \frac{ \sum T_{active} }{2.5} \right) $$

The more work currently ahead in the kitchen, the longer the expected preparation time.

3️⃣ Workload Penalty
Kitchen Load	Penalty
< 40%	+0 min
40–69%	+2 min
70–89%	+5 min
≥ 90%	+8 min

This prevents the system from giving unrealistically optimistic pickup times during peak periods.

4️⃣ Bulk Penalty
Condition	Additional Time
Total quantity > 15	+10 min
Single item ≥ 10	+10 min
Total quantity > 6	+4 min
Total quantity > 3	+2 min
Otherwise	+0 min
🎯 Why Deterministic?

Canteenery does not simply say:

"Your order will be ready soon."

Instead, it can explain why a particular pickup slot was selected.

Example:

Estimated Preparation
────────────────────────

Base preparation       + 8 min
Active queue            + 4 min
Kitchen workload        + 2 min
Quantity adjustment     + 2 min
────────────────────────
Estimated total        = 16 min

Recommended pickup:
🕐 1:15 PM – 1:30 PM

This makes the system transparent and explainable.

🏗️ System Architecture
                         ┌──────────────────────┐
                         │      CANTEENERY      │
                         │   SMART PLATFORM     │
                         └──────────┬───────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
                    ▼                               ▼
          ┌───────────────────┐          ┌───────────────────┐
          │  STUDENT CLIENT   │          │  KITCHEN CLIENT   │
          │                   │          │                   │
          │ menu.html         │          │ kitchen.html      │
          │ checkout.html     │          │ engine.html       │
          │ tracking.html     │          │ menu management   │
          └─────────┬─────────┘          └─────────┬─────────┘
                    │                              │
                    └──────────────┬───────────────┘
                                   │
                              REST API
                                   │
                                   ▼
                    ┌────────────────────────────┐
                    │      NODE.JS BACKEND       │
                    │         server.js          │
                    ├────────────────────────────┤
                    │                            │
                    │ Shared State               │
                    │ Menu Management            │
                    │ Order Management            │
                    │ Inventory Validation        │
                    │ Sequential Order IDs        │
                    │ REST Endpoints              │
                    │                            │
                    └────────────────────────────┘
🔄 Order Lifecycle
                    ┌─────────────┐
                    │   PLACED    │
                    └──────┬──────┘
                           ↓
                    ┌─────────────┐
                    │  ACCEPTED   │
                    └──────┬──────┘
                           ↓
                    ┌─────────────┐
                    │ PREPARING   │
                    └──────┬──────┘
                           ↓
                    ┌─────────────┐
                    │    READY    │
                    └──────┬──────┘
                           ↓
                    ┌─────────────┐
                    │  COLLECTED  │
                    └─────────────┘


              If student doesn't collect:

                    READY
                      ↓
                UNCOLLECTED
                      ↓
                   HOLDING
                      ↓
                  DISCARDED
🌐 Multi-Client Synchronization

Canteenery uses a shared REST backend so that different clients can observe the same application state.

       STUDENT BROWSER
              │
              │ POST /api/orders
              ▼
      ┌─────────────────┐
      │  NODE.JS SERVER │
      └────────┬────────┘
               │
               │ Shared State
               │
       ┌───────┴────────┐
       │                │
       ▼                ▼
 KITCHEN DASHBOARD   STUDENT TRACKING

The clients periodically reconcile state with the backend.

Client
  ↓
GET API
  ↓
Updated State
  ↓
UI Re-render
  ↓
Repeat
🆔 Sequential Order Identification

Orders use a human-readable identifier:

#SC-1001
#SC-1002
#SC-1003
#SC-1004

The server is responsible for generating the sequence so that multiple clients do not accidentally create conflicting order numbers.

📁 Project Structure
CANTEENERY/
│
├── index.html
├── menu.html
├── checkout.html
├── tracking.html
├── kitchen.html
├── engine.html
│
├── server.js
│
├── js/
│   ├── store.js
│   ├── app.js
│   ├── menu.js
│   ├── checkout.js
│   ├── tracking.js
│   └── kitchen.js
│
└── tests/
    ├── test_smart_engine.js
    ├── test_real_backend_sync.js
    ├── test_menu_management.js
    ├── test_flow.js
    └── test_live_demo_sequence.js
⚙️ Getting Started
Prerequisites

Make sure you have:

Node.js v16+
Modern browser
Git
1. Clone the repository
git clone https://github.com/your-username/canteenery.git
cd canteenery
2. Start the server
node server.js

You should see the application running on:

http://localhost:3000
3. Open the application
🏠 Student Portal
http://localhost:3000/
🍔 Student Menu
http://localhost:3000/menu.html
👨‍🍳 Kitchen Command Center
http://localhost:3000/kitchen.html
⚡ Smart Engine Lab
http://localhost:3000/engine.html
🎬 Live Demo Walkthrough

The best way to demonstrate Canteenery is using two browser windows.

┌──────────────────────────┐
│     STUDENT WINDOW       │
└──────────────────────────┘

1. Open menu
2. Add food
3. Open checkout
4. View pickup calculation
5. Place order
          │
          │
          ▼
┌──────────────────────────┐
│     KITCHEN WINDOW       │
└──────────────────────────┘

6. Order appears
7. Accept order
8. Start preparing
9. Mark ready
          │
          │
          ▼
┌──────────────────────────┐
│     STUDENT WINDOW       │
└──────────────────────────┘

10. Tracking updates
11. Student sees READY
12. Student collects
🎤 Best demo moment

Change the kitchen workload inside the Engine Lab:

20% Load
   ↓
Fast pickup

60% Load
   ↓
Moderate delay

85% Load
   ↓
Higher delay

95% Load
   ↓
Critical workload

This visually demonstrates that the system is not using a static timer.

🧪 Test Suite

Canteenery includes automated verification for the core system.

Run:

node tests/test_smart_engine.js
node tests/test_real_backend_sync.js
node tests/test_live_demo_sequence.js
🔍 Test Coverage
Test	Purpose
test_smart_engine.js	Queue mathematics
test_real_backend_sync.js	REST synchronization
test_menu_management.js	Menu CRUD
test_flow.js	Order lifecycle
test_live_demo_sequence.js	End-to-end demo
Core areas tested
✅ Preparation calculations
✅ Workload tiers
✅ Queue delays
✅ Bulk order handling
✅ Inventory validation
✅ Order lifecycle
✅ Menu CRUD
✅ Multi-client synchronization
✅ Sequential order IDs
🏆 Hackathon Requirements
Requirement	Canteenery Implementation
Dynamic pickup slots	🧠 Smart Queue Engine
Kitchen workload management	📊 Workload tiers
Inventory awareness	📦 Live inventory validation
Bulk order handling	🚚 Dedicated bulk routing
Order tracking	📱 Live tracking
Kitchen dashboard	👨‍🍳 Command Center
Menu administration	🍽️ Menu Management
Multi-client synchronization	🌐 REST API
Explainable scheduling	🔍 Transparent calculation
💻 Technology Stack
Layer	Technology
Frontend	HTML5
Styling	Tailwind CSS
Logic	Vanilla JavaScript
Backend	Node.js
Communication	REST API
State	Shared server state
Testing	Node.js test scripts
🔮 Future Improvements

Canteenery is currently designed as a hackathon MVP, but the architecture can be extended with:

💳 Real online payment gateway
🔐 Authentication & role-based access
🗄️ Persistent database
📲 Progressive Web App
🔔 Push notifications
🤖 Predictive demand forecasting
📈 Kitchen analytics dashboard
🧑‍🍳 Multiple kitchen/station support
☁️ Cloud deployment
📊 Historical workload analytics
🎯 Vision

Canteenery is more than an online food-ordering interface.

The goal is to turn a chaotic campus canteen into a predictable, data-driven micro kitchen.

          BEFORE CANTEENERY

      👨‍🎓 👨‍🎓 👨‍🎓 👨‍🎓 👨‍🎓
          ↓
      LONG QUEUE
          ↓
      UNCERTAIN WAIT
          ↓
      MISSED CLASS


          WITH CANTEENERY

      📱 PRE-ORDER
           ↓
      🧠 SMART ENGINE
           ↓
      ⏱️ PICKUP SLOT
           ↓
      👨‍🍳 KITCHEN PREP
           ↓
      🚀 GRAB & GO
👥 Team
Canteenery

Built with ❤️ for smarter campus dining.

Hackathon Project

Order Smart. Skip the Queue.

<div align="center">
⭐ If you like Canteenery, consider starring the repository!
🍽️ Canteenery
Order Smart. Skip the Queue.
</div> ```
