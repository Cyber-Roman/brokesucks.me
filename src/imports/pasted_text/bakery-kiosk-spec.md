# TASK: Create a complete professional Figma project and system specification for a Bakery Self-Ordering Platform

You are a Senior Product Designer, Senior UX/UI Designer, Product Manager, Business Analyst and System Architect.

Your task is to create a COMPLETE professional Figma project with all screens, user flows, database structure, UX logic, component system, design system, responsive layouts, administrator functions and technical specifications.

The project is a self-service bakery ordering system designed for iPads and touch screens located inside bakeries and cafés.

The design must be modern, premium, clean and inspired by McDonald's self-order kiosks while maintaining a bakery atmosphere.

Reference inspiration:

* Self-order kiosks
* Bakery environments
* Touch-first UX
* Large buttons
* Fast ordering process
* Minimal number of clicks

Color palette:

* Warm Yellow (#E8C15A or similar)
* White
* Dark Brown
* Light Beige
* Soft shadows
* Rounded corners

Design style:

* Modern Scandinavian bakery
* Premium but simple
* Touchscreen optimized
* Suitable for customers of all ages

---

BUSINESS IDEA

The purpose of the system is to reduce queues, improve customer experience, increase average order value and allow cafés and bakeries to operate with fewer employees.

Example:

Normally:

* One employee takes orders
* One employee makes coffee
* Long queues form

With this system:

* Customers place orders themselves on an iPad
* Employee only prepares food and drinks
* One employee can handle the shift more efficiently
* Customers can sit down immediately and wait for their order

Psychological benefits:

Customers are often pressured by people waiting behind them in line.

Because of this:

* They rush decisions
* Buy fewer items
* Forget products
* Feel stressed

With self-ordering:

* No pressure
* More time to browse
* Better experience
* Higher average order value

---

USER TYPES

1. Customer
2. Employee
3. Administrator

---

SITE STRUCTURE

Create 3 main sections:

/customers
/order
/admin

---

CUSTOMERS PAGE

When website opens or refreshes:

ALWAYS reset session:

* Empty basket
* Total = 0
* No selected products
* No previous state

Before customer can access menu:

Show FULL SCREEN MODAL.

Question:

"Where would you like to enjoy your order?"

Option 1:
SIT HERE

Option 2:
TAKEAWAY

UI requirements:

* Full screen popup
* Split layout
* Yellow button occupies 50%
* White button with brown text occupies 50%
* Large touch targets

Pricing logic:

Sit Here prices = Base Price + 10 NOK

Takeaway prices = Base Price

After selection:

Customer enters menu.

---

CUSTOMER PAGE LAYOUT

LEFT SIDE

Shopping cart panel

Contains:

* Selected products
* Quantity
* Individual prices
* Total price

Bottom left:

Large ORDER button

Style similar to reference image.

Initially:

Total = 0

Cart empty.

---

RIGHT SIDE

Product grid.

Layout:

4 products per row.

Each product card contains:

* Product image
* Product name
* Price
* Add button

Categories:

* Buns
* Coffee
* Sandwiches
* Bread

Customer should be able to place order within 3-4 touches maximum.

Fast UX is extremely important.

---

ORDER FLOW

When customer clicks ORDER:

Show popup:

"Please enter your name"

Input:
Customer Name

Button:
Submit Order

After submission:

Show:

"Thank you for your order"

Order instantly appears inside Order section.

---

ORDER PAGE

Employee dashboard.

Protected page.

Require login:

PIN: 753596
PASSWORD: passvord

After login:

Show two tabs:

1. NEW
2. READY

---

NEW TAB

All incoming orders appear here immediately in real-time.

Order cards should show:

* Order Number
* Customer Name
* Sit Here / Takeaway
* Ordered products
* Quantities
* Total
* Time

Employee can:

* Mark Ready

When pressed:

Move order to READY tab.

---

READY TAB

Contains completed orders.

Display:

* Order Number
* Customer Name
* Time completed
* Order details

---

ADMIN PAGE

Protected page.

Require login:

PIN: 529641
PASSWORD: passivordik

---

ADMIN FUNCTIONS

Menu management:

* Create products
* Edit products
* Delete products

For every product:

* Name
* Category
* Description
* Image
* Base price
* Sit Here price
* Takeaway price
* Availability

---

CATEGORY MANAGEMENT

Admin can reorder categories.

Example:

Current:

* Buns
* Coffee
* Sandwiches
* Bread

Admin can change to:

* Coffee
* Bread
* Buns
* Sandwiches

Changes instantly affect customer page.

---

PRODUCT VISIBILITY

Admin can:

* Show product
* Hide product
* Mark out of stock

Out of stock items should not be orderable.

---

LIVE ANALYTICS

Admin dashboard should display:

* Total orders today
* Revenue today
* Most ordered products
* Most ordered category
* Peak ordering times

---

DATABASE DESIGN

Create complete database schema.

Tables:

Users
Products
Categories
Orders
OrderItems
Settings
StoreConfiguration
Analytics

Include:

Primary Keys
Foreign Keys
Relationships

---

REAL-TIME REQUIREMENTS

Use real-time synchronization.

When customer places order:

Order appears instantly on employee screen without refresh.

---

FIGMA REQUIREMENTS

Create:

* Full user flow
* Wireframes
* High fidelity screens
* Design system
* Typography system
* Component library
* Buttons
* Inputs
* Cards
* Order states
* Admin dashboard
* Employee dashboard
* Empty states
* Loading states
* Error states

Create professional production-ready Figma project suitable for developers.

The final design should feel like a commercial SaaS product that could be sold to bakeries and cafés throughout Norway and Europe.
