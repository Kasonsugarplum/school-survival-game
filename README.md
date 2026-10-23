# School Survival Escape

A small 2D browser game where you have to escape a school while monsters chase you through the hallways. Use hiding spots to stay safe, manage your stamina, and collect the missing school codes before you reach the exit.

## How to play

- Move: WASD or Arrow keys
- Sprint: Shift
- Hide: E near a locker, closet, library, or cabinet
- Objective: collect all three codes, then reach the exit door without being caught

## Run it locally

There is already a launcher script included in the repo:

```bash
./start_game.sh
```

This starts a local web server and opens the game in your browser.

If you prefer to run it manually:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Download this project

You can download the full project as a ZIP from the GitHub repository page, or clone it:

```bash
git clone https://github.com/Kasonsugarplum/school-survival-game.git
```

## Files

- `index.html` — main game page
- `style.css` — interface styling
- `game.js` — player controls, monsters, stamina, hiding system, and escape logic
- `start_game.sh` — launch script to serve the game locally

