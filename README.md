# QUICKSLOT - Smart Car Parking System

## Project Description

QUICKSLOT is a smart car parking pre-booking web application designed to help users find and reserve parking slots in advance. The system allows users to search nearby parking lots, view parking prices and distance, select a suitable time slot, make a simulated payment, and receive a digital parking ticket with a QR code.

This project solves common urban parking issues such as difficulty in finding parking, time wastage, traffic congestion, and manual ticket handling.

## Aim of the Project

The aim of QUICKSLOT is to provide a simple, efficient, and user-friendly platform for pre-booking parking spaces. It helps users reserve parking slots before reaching the location and allows parking operators to manage slots in a more organized way.

## What the Project Does

- Allows users to log in using name and mobile number
- Displays available parking lots with distance and hourly rate
- Lets users select date, start time, and duration
- Allows users to book available parking slots
- Calculates total parking amount
- Generates a digital ticket after payment
- Displays upcoming and past tickets
- Generates a QR code for check-in and check-out validation
- Prevents double booking using proper database relationships

## Tech Stack Used

- Frontend: React
- Database: Supabase PostgreSQL
- Backend Service: Supabase
- QR Code Generation: Frontend QR rendering library
- ER Diagram Rendering: Mermaid.js
- Styling: CSS

## Database Tables Used

### 1. USER

Stores user details.

| Field | Type | Key |
|---|---|---|
| User_ID | int | Primary Key |
| Name | string |  |
| Mobile_Number | string |  |

### 2. PARKING_LOT

Stores parking location details.

| Field | Type | Key |
|---|---|---|
| Lot_ID | int | Primary Key |
| Name | string |  |
| Location | string |  |
| Hourly_Rate | float |  |
| Distance_KM | float |  |

### 3. SLOT

Stores individual parking slot details.

| Field | Type | Key |
|---|---|---|
| Slot_ID | int | Primary Key |
| Lot_ID | int | Foreign Key |
| Slot_Number | string |  |
| Is_Available | boolean |  |

### 4. BOOKING

Stores booking and ticket details.

| Field | Type | Key |
|---|---|---|
| Booking_ID | int | Primary Key |
| User_ID | int | Foreign Key |
| Slot_ID | int | Foreign Key |
| Booking_Date | date |  |
| Start_Time | time |  |
| End_Time | time |  |
| Total_Amount | float |  |
| Payment_Status | string |  |
| QR_Code_String | string |  |

## Keys Used

### Primary Keys

- USER.User_ID
- PARKING_LOT.Lot_ID
- SLOT.Slot_ID
- BOOKING.Booking_ID

### Foreign Keys

- BOOKING.User_ID references USER.User_ID
- BOOKING.Slot_ID references SLOT.Slot_ID
- SLOT.Lot_ID references PARKING_LOT.Lot_ID

## Relationships

- One user can place many bookings.
- One parking lot contains many slots.
- One slot can be booked many times at different dates and times.
- Each booking belongs to one user and one slot.

## ER Diagram

```html
<div id="erd"></div>
<style>
#erd svg { width: 100%; }
</style>
<script type="module">
import mermaid from 'https://esm.sh/mermaid@11/dist/mermaid.esm.min.mjs';
const dark = matchMedia('(prefers-color-scheme: dark)').matches;
await document.fonts.ready;
mermaid.initialize({
  startOnLoad: false,
  theme: 'base',
  fontFamily: '"Anthropic Sans", sans-serif',
  themeVariables: {
    darkMode: dark,
    fontSize: '13px',
    fontFamily: '"Anthropic Sans", sans-serif',
    lineColor: dark ? '#9c9a92' : '#73726c',
    textColor: dark ? '#c2c0b6' : '#3d3d3a',
    primaryColor: dark ? '#3C3489' : '#EEEDFE',
    primaryBorderColor: dark ? '#AFA9EC' : '#7F77DD',
    primaryTextColor: dark ? '#CECBF6' : '#3C3489',
    secondaryColor: dark ? '#085041' : '#E1F5EE',
    secondaryBorderColor: dark ? '#5DCAA5' : '#1D9E75',
    tertiaryColor: dark ? '#185FA5' : '#E6F1FB',
    tertiaryBorderColor: dark ? '#85B7EB' : '#378ADD',
  },
});

const { svg } = await mermaid.render('erd-svg', `erDiagram
  USER {
    int User_ID PK
    string Name
    string Mobile_Number
  }
  BOOKING {
    int Booking_ID PK
    int User_ID FK
    int Slot_ID FK
    date Booking_Date
    time Start_Time
    time End_Time
    float Total_Amount
    string Payment_Status
    string QR_Code_String
  }
  SLOT {
    int Slot_ID PK
    int Lot_ID FK
    string Slot_Number
    boolean Is_Available
  }
  PARKING_LOT {
    int Lot_ID PK
    string Name
    string Location
    float Hourly_Rate
    float Distance_KM
  }

  USER ||--o{ BOOKING : "places"
  SLOT ||--o{ BOOKING : "reserved via"
  PARKING_LOT ||--o{ SLOT : "contains"
`);
document.getElementById('erd').innerHTML = svg;

document.querySelectorAll('#erd svg .node').forEach(node => {
  const firstPath = node.querySelector('path[d]');
  if (!firstPath) return;
  const d = firstPath.getAttribute('d');
  const nums = d.match(/-?[\d.]+/g)?.map(Number);
  if (!nums || nums.length < 8) return;
  const xs = [nums[0], nums[2], nums[4], nums[6]];
  const ys = [nums[1], nums[3], nums[5], nums[7]];
  const x = Math.min(...xs), y = Math.min(...ys);
  const w = Math.max(...xs) - x, h = Math.max(...ys) - y;
  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  rect.setAttribute('x', x); rect.setAttribute('y', y);
  rect.setAttribute('width', w); rect.setAttribute('height', h);
  rect.setAttribute('rx', '8');
  for (const a of ['fill', 'stroke', 'stroke-width', 'class', 'style']) {
    if (firstPath.hasAttribute(a)) rect.setAttribute(a, firstPath.getAttribute(a));
  }
  firstPath.replaceWith(rect);
});

document.querySelectorAll('#erd svg .row-rect-odd path, #erd svg .row-rect-even path').forEach(p => {
  p.setAttribute('stroke', 'none');
});
</script>