<div align="center">

# 🍽️ Canteenery

### **Order smart. Skip the queue.**

**Smart Canteen Pre-Ordering & Kitchen Queue Engine**

A campus canteen platform that allows students to pre-order food while dynamically estimating preparation times and assigning intelligent pickup slots based on real-time kitchen workload, queue pressure, batching overhead, order size, and live inventory.

<br>

[🚀 Features](#-features) •
[🧠 Smart Queue Engine](#-smart-queue-engine-formula) •
[🏗️ Architecture](#-system-architecture) •
[👨‍🍳 Kitchen Command Center](#-kitchen-command-center) •
[🎬 Live Demo Flow](#-live-demo-walkthrough) •
[⚙️ Getting Started](#-getting-started) •
[🧪 Test Suite](#-test-suite--verification)

<br>

![Status](https://img.shields.io/badge/status-Hackathon%20MVP-success?style=for-the-badge)
![Frontend](https://img.shields.io/badge/frontend-Vanilla%20JS-yellow?style=for-the-badge)
![Styling](https://img.shields.io/badge/styling-Tailwind%20CSS-blue?style=for-the-badge)
![Backend](https://img.shields.io/badge/backend-Node.js%20REST%20API-green?style=for-the-badge)
![Tests](https://img.shields.io/badge/tests-190%2B%20Passing-brightgreen?style=for-the-badge)

</div>

---

## 🥡 The Problem

Campus canteens face severe congestion during peak morning breaks and lunch hours:
* **Unpredictable Wait Times**: Students wait in long physical queues, often risking being late or missing lectures.
* **Kitchen Overload**: The kitchen receives dozens of ad-hoc orders simultaneously without any workload smoothing or batch prioritization.
* **Food Waste & Uncollected Orders**: Food prepared too early goes cold or is missed by students rushing between classes.
* **Static Pickup Estimates**: Traditional food apps assign arbitrary 15-minute windows without considering current kitchen pressure, parallel cooking capacity, or dish complexity.

---

## ⚡ The Canteenery Solution

Instead of treating every order equally, **Canteenery** uses an intelligent queue engine to calculate **deterministic, transparent, and dynamic pickup windows**:

```text
Student Selects Items
        ↓
Pre-Checkout Inventory & Availability Validation
        ↓
Smart Queue Engine Evaluates:
  • Dominant Dish Preparation Time
  • Batching & Recipe Diversity Overhead
  • Active Orders Ahead in Queue
  • Live Kitchen Workload Tier (LOW / MODERATE / HIGH / CRITICAL)
  • Bulk Order / Large Quantity Penalties
        ↓
Dynamic Pickup Window Assigned (15-Min Slots)
        ↓
Atomic Sequential Order ID (#SC-XXXX) Created on Server
        ↓
Real-Time Multi-Device Sync (3s Reconciled Polling)
        ↓
Kitchen Prepares Meal → Student Tracks 5-Stage Live Status → Pickup Without Queuing!
```

---

## 🚀 Features

### 1. 🧠 Intelligent Smart Queue Engine
* **Dynamic Time Estimation**: Evaluates item complexity, queue backlog, and current workload percentage.
* **Deterministic Workload Tiers**:
  * `LOW (<40%)`: +0 min wait, fast-tracked prep.
  * `MODERATE (40–69%)`: +2 min buffer, optimal kitchen pacing.
  * `HIGH (70–89%)`: +5 min buffer, pushes recommended pickup slot to the next window.
  * `CRITICAL (≥90%)`: +8 min surge buffer.
* **Explainable AI/Logic Output**: Every checkout displays clear bullet points explaining exactly why a pickup slot was chosen.
* **Bulk Order Routing**: Detects orders $>15$ items or single items $\ge 10$ qty, automatically applies a $+10$ min batching buffer and routes them to the dedicated **Bulk Counter**.

### 2. 📱 Student Pre-Ordering & Live Tracking
* **Live Menu Browsing**: Filter by category (*Breakfast, South Indian, Chinese, Non-Veg, Snacks, Beverages*) with Veg/Non-Veg badges.
* **Real-time Inventory Shields**: Prevents ordering out-of-stock (`SOLD OUT`) or kitchen-paused (`UNAVAILABLE`) dishes.
* **5-Stage Live Status Engine**:
  * `PLACED` $\rightarrow$ `ACCEPTED` $\rightarrow$ `PREPARING` $\rightarrow$ `READY` $\rightarrow$ `COLLECTED`
  * Holding & Uncollected Support: `NOT_COLLECTED` $\rightarrow$ `HOLDING` $\rightarrow$ `DISCARDED`
* **Real-Time Queue Position**: Displays live queue ranking (`#1`, `#2`, `#3` in line) updated dynamically as kitchen marks prior orders complete.

### 3. 👨‍🍳 Kitchen Command Center (`/kitchen.html`)
* **Live Order Kanban & Queues**: Categorized views for **Active Queue**, **Bulk Orders**, **Uncollected / Holding Counter**, and **Inventory Controls**.
* **One-Click State Transitions**: Quickly advance orders through lifecycle stages with immediate cross-device student tracking updates.
* **Holding Counter Workflow**: Tracks uncollected orders with safe 15-minute warm holding windows before discarding.

### 4. 🍽️ Kitchen Admin Menu Management
* **No-Code Dish Management**: Add new items, edit names, prices, prep times, categories, descriptions, and image URLs with live image preview.
* **Quick Availability Toggle**: Instantly pause or resume dish availability on the student menu with a single click.
* **Historical Order Snapshot Protection**: Modifying or removing a menu item preserves all existing and past student orders without data corruption.

### 5. ⚡ Interactive Smart Engine Lab (`/engine.html`)
* An interactive sandbox allowing judges and developers to test the Smart Queue Engine under simulated loads:
  * Adjust kitchen workload sliders ($0\%\text{--}100\%$) and active queue sliders ($0\text{--}10$ orders ahead).
  * Test preset scenarios (*Low Traffic, Moderate Rush, Heavy Peak, Bulk Tech Club Order, Sold Out Masala Dosa*).
  * Inspect live mathematical breakdowns and slot distributions.

### 6. 🌐 Real Shared REST API Backend
* **Cross-Browser & Multi-Device Synchronization**: Students ordering on mobile/Edge seamlessly sync with kitchen dashboards open in Chrome/Desktop.
* **Atomic Server Sequence Counter**: Generates unique, collision-free `#SC-XXXX` order IDs on the server even under concurrent order spikes.
* **Automatic Background Polling & Reconciliation**: Background polling every 3 seconds ensures 100% sync without manual page refreshes.

---

## 🧠 Smart Queue Engine Formula

The total estimated preparation time $T_{\text{prep}}$ is calculated deterministically:

$$T_{\text{prep}} = \max\Big(3,\; T_{\text{base}} + T_{\text{queue}} + T_{\text{workload}} + T_{\text{bulk}}\Big)$$

Where:
1. **$T_{\text{base}}$ (Base Prep & Batching)**:
   $$T_{\text{base}} = \max(t_i) + \Big(\sum (q_i - 1) \times 1.5\Big) + \Big((N_{\text{distinct}} - 1) \times 1.0\Big)$$
2. **$T_{\text{queue}}$ (Queue Delay)**:
   $$T_{\text{queue}} = \text{round}\left(\frac{\sum_{\text{active}} t_{\text{order}}}{2.5}\right)$$
3. **$T_{\text{workload}}$ (Workload Penalty)**:
   $$T_{\text{workload}} = \begin{cases} 0\text{ min}, & \text{if Load} < 40\% \\ 2\text{ min}, & \text{if } 40\% \le \text{Load} < 70\% \\ 5\text{ min}, & \text{if } 70\% \le \text{Load} < 90\% \\ 8\text{ min}, & \text{if Load} \ge 90\% \end{cases}$$
4. **$T_{\text{bulk}}$ (Bulk & Size Buffer)**:
   $$T_{\text{bulk}} = \begin{cases} 10\text{ min}, & \text{if total qty} > 15 \text{ or single item qty} \ge 10 \\ 4\text{ min}, & \text{if total qty} > 6 \\ 2\text{ min}, & \text{if total qty} > 3 \\ 0\text{ min}, & \text{otherwise} \end{cases}$$

---

## 🏗️ System Architecture

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        CANTEENERY APPLICATION                          │
└────────────────────────────────────────────────────────────────────────┘
         │                                               │
         ▼                                               ▼
┌─────────────────────────────────┐   ┌──────────────────────────────────┐
│         STUDENT CLIENT          │   │         KITCHEN CLIENT           │
│  (menu.html, checkout.html,     │   │   (kitchen.html, engine.html)    │
│   order-confirmed, tracking)    │   │                                  │
└─────────────────────────────────┘   └──────────────────────────────────┘
         │                                               │
         │  GET /api/menu                                │  GET /api/orders
         │  POST /api/orders                             │  PATCH /api/orders/:id
         │  (3s Background Poll)                         │  POST /api/menu (CRUD)
         ▼                                               ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    NODE.JS REST BACKEND (server.js)                    │
│  ────────────────────────────────────────────────────────────────────  │
│  • In-Memory Canonical Store (Menu, Orders, Active Queue)              │
│  • Atomic Sequential ID Counter (#SC-1053, #SC-1054, ...)              │
│  • Server-side Inventory Pre-check & Atomic Decrement                  │
│  • High-performance Static Asset Server (HTML/JS/CSS)                  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```text
CANTEENERY/
├── index.html                      # Student Home & Live Canteen Metrics
├── menu.html                       # Student Menu with Category Filters & Badges
├── checkout.html                   # Smart Checkout & Pickup Slot Selector
├── order-confirmed.html            # Order Confirmation Screen with Dynamic Breakdown
├── tracking.html                   # Live 5-Stage Order Tracking & Queue Position
├── kitchen.html                    # Kitchen Admin Dashboard & Menu Management
├── engine.html                     # Interactive Smart Queue Engine Visualizer
├── about.html                      # System Overview & Architecture Docs
│
├── server.js                       # Node.js Static Server + Shared REST API Backend
│
├── js/
│   ├── store.js                    # Central Reactive Store & Smart Queue Engine
│   ├── app.js                      # Shared UI Helpers, Navigation & Cart Badges
│   ├── menu.js                     # Menu Rendering, Filtering & Inventory Badges
│   ├── checkout.js                 # Cart Management & Pickup Slot Engine Integration
│   ├── order-confirmed.js          # Order Confirmation Logic & Safe Fallbacks
│   ├── tracking.js                 # 5-Stage Status Visualizer & Live Queue Tracker
│   ├── kitchen.js                  # Kitchen Queue Kanban, Inventory & Menu CRUD
│   └── engine.js                   # Interactive Engine Visualizer Controls
│
└── tests/ (Root Test Suites)
    ├── test_real_backend_sync.js   # Multi-client cross-browser REST sync test
    ├── test_smart_engine.js        # Mathematical Smart Queue Engine unit tests
    ├── test_menu_management.js     # Menu CRUD & snapshot isolation tests
    ├── test_flow.js                # State machine & lifecycle transition tests
    ├── test_final_polish.js        # Route checks & inventory invariant tests
    ├── test_live_demo_sequence.js  # 20-step complete end-to-end user journey
    └── test_claude_audit_verification.js # Master 12-scenario regression audit
```

---

## ⚙️ Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/) (v16 or higher)

### Installation & Launch

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/canteenery.git
   cd canteenery
   ```

2. **Start the Canteenery Server**:
   ```bash
   node server.js
   ```

3. **Open the Application in your Browser**:
   * 🏠 **Student Portal**: [http://localhost:3000/](http://localhost:3000/)
   * 🍔 **Menu & Ordering**: [http://localhost:3000/menu.html](http://localhost:3000/menu.html)
   * 👨‍🍳 **Kitchen Dashboard**: [http://localhost:3000/kitchen.html](http://localhost:3000/kitchen.html)
   * 🍽️ **Kitchen Menu Management**: [http://localhost:3000/kitchen.html#menu-management](http://localhost:3000/kitchen.html#menu-management)
   * ⚡ **Smart Queue Engine Lab**: [http://localhost:3000/engine.html](http://localhost:3000/engine.html)

---

## 🎬 Live Demo Walkthrough

Try this simple multi-tab test to experience real-time cross-device sync:

1. **Open two different browser windows side-by-side**:
   * Window A: **[http://localhost:3000/menu.html](http://localhost:3000/menu.html)** (Student)
   * Window B: **[http://localhost:3000/kitchen.html](http://localhost:3000/kitchen.html)** (Kitchen Admin)
2. **On Window A (Student)**:
   * Add 2 x *Veg Sandwich* and 1 x *Cold Coffee* to cart.
   * Proceed to Checkout — observe the live **60% MODERATE** kitchen load and dynamic pickup slot.
   * Place Order.
3. **On Window B (Kitchen)**:
   * Within **3 seconds**, watch order `#SC-1053` appear at the top of the kitchen queue automatically.
   * Click **Accept Order** $\rightarrow$ **Start Preparing** $\rightarrow$ **Mark Ready**.
4. **On Window A (Student Tracking)**:
   * Watch the 5-stage progress timeline advance from *Placed* $\rightarrow$ *Preparing* $\rightarrow$ *Ready for Pickup!* live!

---

## 🧪 Test Suite & Verification

The project includes an automated test suite comprising over **190 assertions** across 7 dedicated test suites:

```bash
# Run all test suites:
node test_real_backend_sync.js ; node test_smart_engine.js ; node test_flow.js ; node test_menu_management.js ; node test_final_polish.js ; node test_live_demo_sequence.js ; node test_claude_audit_verification.js
```

### Test Coverage Summary
* `test_real_backend_sync.js`: Multi-client cross-device sync, atomic sequential order IDs, concurrent placement with 0 collisions.
* `test_smart_engine.js`: Base prep, queue delay, workload tier penalties, and 15-minute slot calculations.
* `test_flow.js`: Complete 5-stage lifecycle state machine transitions and holding counter workflow.
* `test_menu_management.js`: Adding dishes, price/prep time modifications, quick availability toggles, and historical order snapshot safety.
* `test_live_demo_sequence.js`: 20-step deterministic end-to-end user simulation.
* `test_claude_audit_verification.js`: Master 12-scenario QA regression verification.

---

## 👥 Authors & Acknowledgments

* **Canteenery Team** — Built with ❤️ for smarter campus dining.
* Approved Visual Design & System Design tokens inspired by **Google Stitch**.

---

<div align="center">
  <sub>Built for the Hackathon • Order Smart. Skip the Queue.</sub>
</div>
