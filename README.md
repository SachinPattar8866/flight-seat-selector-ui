<img width="1385" height="849" alt="image" src="https://github.com/user-attachments/assets/d4b65319-a751-4971-945e-4f4ae3c3057b" /># Flight Seat Selection

A React app where passengers pick seats on a flight, choose meals, and see the total cost.
It uses mock data only, with no backend.

**Live Demo:** https://flight-seat-selector-nu.vercel.app/

## Run it

Install and start the app:

    npm install
    npm run dev

Other commands:

    npm run build
    npm test

`npm run build` makes the production build. `npm test` runs the reducer tests.

## What it does

- Choose 1 to 6 passengers, switch between them, or remove any passenger.
- Switch between two cabin layouts: **3–2** and **2–3–2**.
- Click a seat to give it to the selected passenger. Each passenger gets one seat, and a seat can't be shared.
- Seat colours show the price. Occupied seats can't be selected.
- Pick an optional meal for each passenger (some are free, some are paid).
- See the charges per passenger and the total, which update immediately.
- Your booking is saved in the browser, so a refresh keeps it.
- Works on phones: the seat map scrolls sideways, and the total stays visible at the bottom.

## Seat prices

| Seat type | Price | Where |
|---|---|---|
| Extra legroom | ₹350 | Rows 1 and 9 |
| Premium | ₹250 | Rows 2 to 4 |
| Preferred window | ₹150 | Window seats, rows 5 to 12 |
| Standard | Free | All other seats |

## How it works

### Project structure

    src/
      components/   the screen parts (passenger list, seat map, seat, legend, charges)
      data/         seat layouts, prices and meals
      state/        reducer (all the logic), saving to the browser, helpers
      App.jsx       connects everything

### State management

All booking data lives in one `useReducer` in `App.jsx`:

- `passengers`: a list of passengers, each with an `id`, a `name` and a `mealId`
- `assignments`: which seat each passenger has (passenger id to seat id)
- the active passenger, the current layout, and any pending confirmations

Everything you see on screen (seat badges, passenger cards, charges and total) is worked out
from this data. Nothing is stored twice, so the total can't get out of sync.

Each passenger has a unique id that is never reused. Names, meals and seats are tied to that
id, so removing one passenger can't change another passenger's details.

### Seat assignment logic

When you click a seat, the reducer checks in this order:

1. The seat is occupied: it is rejected with a message.
2. It is already the active passenger's seat: it is removed.
3. It belongs to another passenger: it is rejected with a message.
4. Otherwise: it is assigned, and the next passenger without a seat becomes active.

Because each passenger has only one entry in `assignments`, picking a new seat replaces the old one.

**Switching layout:** seats that exist and are free in the new layout are kept. Seats that don't
exist there are released after asking you to confirm. Names and meals never change.

**Removing a passenger:** their seat, name and meal are removed and the total updates. Everyone
else keeps their data. You are asked to confirm only if the passenger has a seat or a paid meal.

## Tests

The reducer logic has unit tests, using Node's built-in test runner (no extra packages):

    npm test

They cover:

- assigning, changing and removing seats, and blocking occupied or already-taken seats
- switching passengers without losing their seats
- switching layouts (keeping, releasing and confirming seats)
- removing a passenger without affecting the others
- seat, meal and total price calculations
- restoring and repairing the saved booking after a refresh
- the seat maps (correct seats per row, scattered occupied seats)

You can also add `?error=1` to the page URL to preview the error screen.
