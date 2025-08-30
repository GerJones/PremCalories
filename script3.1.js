// --- SETTINGS ---
let goal = 2320; // default if none entered
const teams = [
  "You", "Man City", "Arsenal", "Liverpool", "Chelsea",
  "Man United", "Tottenham", "Newcastle", "Aston Villa", "Brighton",
  "West Ham", "Brentford", "Crystal Palace", "Everton", "Fulham",
  "Wolves", "Nottingham Forest", "Bournemouth", "Burnley", "Leeds"
];

const teamStrength = {
  "Man City": 60, "Liverpool": 60, "Arsenal": 60, "Chelsea": 50,
  "Man United": 50, "Tottenham": 50, "Newcastle": 40, "Aston Villa": 40,
  "Brighton": 40, "West Ham": 40, "Brentford": 40, "Crystal Palace": 40,
  "Everton": 30, "Fulham": 30, "Wolves": 30, "Nottingham Forest": 40,
  "Bournemouth": 40, "Burnley": 20, "Leeds": 20, "You": 65
};

// --- STATE ---
let table = teams.map(t => ({ name: t, points: 0, played: 0 }));
let matchday = 1;
let fixtures = [];

// --- FIXTURE GENERATION ---
function generateFixtures(teamList) {
  const list = [...teamList];
  const n = list.length;
  if (n % 2 !== 0) list.push("BYE");
  const half = n / 2;
  const homeAwayRounds = [];
  const fixed = list[0];
  let rotating = list.slice(1);

  for (let r = 0; r < n - 1; r++) {
    const round = [];
    const left = [fixed, ...rotating.slice(0, half - 1)];
    const right = rotating.slice(half - 1).slice().reverse();
    for (let i = 0; i < half; i++) {
      const home = (r % 2 === 0) ? left[i] : right[i];
      const away = (r % 2 === 0) ? right[i] : left[i];
      if (home !== "BYE" && away !== "BYE") {
        round.push({ home, away });
      }
    }
    homeAwayRounds.push(round);
    rotating = [rotating[rotating.length - 1], ...rotating.slice(0, rotating.length - 1)];
  }
  const secondHalf = homeAwayRounds.map(round =>
    round.map(({ home, away }) => ({ home: away, away: home }))
  );
  return [...homeAwayRounds, ...secondHalf];
}

// --- MATCH SIMULATION ---
function simulateAIMatch(home, away) {
  const baseHome = teamStrength[home] ?? 50;
  const baseAway = teamStrength[away] ?? 50;
  const homeBand = baseHome + 5;
  const drawBand = 15;
  const rand = Math.random() * 100;
  let homePts, awayPts, score;
  if (rand < homeBand) {
    homePts = 3; awayPts = 0;
    score = `${home} 1–0 ${away}`;
  } else if (rand < homeBand + drawBand) {
    homePts = 1; awayPts = 1;
    score = `${home} 1–1 ${away}`;
  } else {
    homePts = 0; awayPts = 3;
    score = `${home} 0–1 ${away}`;
  }
  return { homePts, awayPts, score };
}

// --- CORE FLOW ---
function playMatch() {
  if (matchday > 38) {
    document.getElementById("result").textContent = "Season finished!";
    return;
  }
  const calories = Number(document.getElementById("calories").value);
  if (!calories) return;
  const round = fixtures[matchday - 1];
  const yourGame = round.find(m => m.home === "You" || m.away === "You");
  const oppName = yourGame.home === "You" ? yourGame.away : yourGame.home;
  let yourPoints = 0;
  let yourScore;
  if (calories < goal) {
    yourPoints = 3;
    yourScore = `You 2–1 ${oppName}`;
  } else if (calories <= goal + 500) {
    yourPoints = 1;
    yourScore = `You 1–1 ${oppName}`;
  } else {
    yourPoints = 0;
    yourScore = `You 0–2 ${oppName}`;
  }
  const youRow = table.find(t => t.name === "You");
  youRow.points += yourPoints;
  youRow.played++;
  const oppRow = table.find(t => t.name === oppName);
  if (yourPoints === 1) {
    oppRow.points += 1;
  } else if (yourPoints === 0) {
    oppRow.points += 3;
  }
  oppRow.played++;
  let resultsList = [`${yourScore}`];
  round.forEach(({ home, away }) => {
    if (home !== "You" && away !== "You") {
      const { homePts, awayPts, score } = simulateAIMatch(home, away);
      const h = table.find(t => t.name === home);
      const a = table.find(t => t.name === away);
      h.points += homePts; h.played++;
      a.points += awayPts; a.played++;
      resultsList.push(score);
    }
  });
  document.getElementById("result").textContent =
    `Matchday ${matchday}: vs ${oppName} — you earned ${yourPoints} point(s)!`;
  document.getElementById("fixturesResults").innerHTML =
    `<h3>Matchday ${matchday} Results</h3><ul>` +
    resultsList.map(r => `<li>${r}</li>`).join("") +
    `</ul>`;
  matchday++;
  updateFixtureBanner();
  renderTable();
  document.getElementById("calories").value = "";
  localStorage.setItem("leagueTable", JSON.stringify(table));
  localStorage.setItem("matchday", String(matchday));
  localStorage.setItem("fixtures", JSON.stringify(fixtures));
}

// --- NEW: Start a new season with goal ---
function startNewSeason() {
  const newGoal = Number(document.getElementById("goalInput").value);
  if (!newGoal) {
    alert("Please enter a valid calorie goal!");
    return;
  }
  goal = newGoal;
  localStorage.setItem("goal", String(goal));
  table = teams.map(t => ({ name: t, points: 0, played: 0 }));
  matchday = 1;
  fixtures = generateFixtures(teams);
  localStorage.setItem("leagueTable", JSON.stringify(table));
  localStorage.setItem("matchday", String(matchday));
  localStorage.setItem("fixtures", JSON.stringify(fixtures));
  document.getElementById("mainMenu").style.display = "none";
  document.getElementById("gameScreen").style.display = "block";
  updateFixtureBanner();
  renderTable();
}

// --- Back to main menu ---
function backToMenu() {
  localStorage.removeItem("leagueTable");
  localStorage.removeItem("matchday");
  localStorage.removeItem("fixtures");
  localStorage.removeItem("goal");
  document.getElementById("gameScreen").style.display = "none";
  document.getElementById("mainMenu").style.display = "block";
  document.getElementById("goalInput").value = "";
  document.getElementById("result").textContent = "";
  document.getElementById("fixturesResults").innerHTML = "";
  document.getElementById("leagueTable").innerHTML = "";
  document.getElementById("fixture").textContent = "";
}

function renderTable() {
  table.sort((a, b) => b.points - a.points);
  let html = `
    <tr>
      <th>Pos</th><th>Team</th><th>Played</th><th>Points</th>
    </tr>
  `;
  table.forEach((t, i) => {
    let highlightClass = (t.name === "You") ? "highlight" : "";
    html += `<tr class="${highlightClass}">
      <td>${i + 1}</td>
      <td>${t.name}</td>
      <td>${t.played}</td>
      <td>${t.points}</td>
    </tr>`;
  });
  document.getElementById("leagueTable").innerHTML = html;
}

function updateFixtureBanner() {
  const banner = document.getElementById("fixture");
  if (matchday > 38) {
    banner.textContent = "Season finished!";
    return;
  }
  const round = fixtures[matchday - 1];
  const yourGame = round.find(m => m.home === "You" || m.away === "You");
  const isHome = yourGame.home === "You";
  const opp = isHome ? yourGame.away : yourGame.home;
  banner.textContent = `Matchday ${matchday}: ${isHome ? "(H)" : "(A)"} vs ${opp}`;
}

// --- INIT ---
(function init() {
  let savedGoal = localStorage.getItem("goal");
  if (savedGoal) {
    goal = Number(savedGoal);
    let savedTable = localStorage.getItem("leagueTable");
    let savedMatchday = localStorage.getItem("matchday");
    let savedFixtures = localStorage.getItem("fixtures");
    if (savedFixtures && savedTable && savedMatchday) {
      fixtures = JSON.parse(savedFixtures);
      table = JSON.parse(savedTable);
      matchday = Number(savedMatchday);
      document.getElementById("mainMenu").style.display = "none";
      document.getElementById("gameScreen").style.display = "block";
      updateFixtureBanner();
      renderTable();
      return;
    }
  }
  document.getElementById("mainMenu").style.display = "block";
  document.getElementById("gameScreen").style.display = "none";
})();
