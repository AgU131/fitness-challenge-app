// leaderboard.js
const leaderboardContainer = document.querySelector(".leaderboard-table");

// URL de ejemplo: usaremos una API pública para simular datos de atletas
const apiURL = "https://www.boredapi.com/api/activity"; // se puede cambiar por Strava más adelante

async function loadLeaderboard() {
    try {
        leaderboardContainer.innerHTML = "<p>Loading leaderboard...</p>";

        // Simulación de llamada a API (puedes reemplazar por Strava o Nutritionix)
        const fakeData = [
            { name: "Agustin Heredia", points: 1250, workouts: 32 },
            { name: "Emma Rojas", points: 1190, workouts: 29 },
            { name: "Lucas Pérez", points: 980, workouts: 22 },
            { name: "Mia Sánchez", points: 870, workouts: 20 },
            { name: "Tomás Rivera", points: 800, workouts: 18 },
        ];

        // Renderizar tabla
        const html = `
      <table class="leaderboard-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Participant</th>
            <th>Points</th>
            <th>Workouts</th>
          </tr>
        </thead>
        <tbody>
          ${fakeData
                .map(
                    (athlete, i) => `
            <tr>
              <td>${i + 1}</td>
              <td>${athlete.name}</td>
              <td>${athlete.points}</td>
              <td>${athlete.workouts}</td>
            </tr>`
                )
                .join("")}
        </tbody>
      </table>
    `;

        leaderboardContainer.innerHTML = html;
    } catch (error) {
        leaderboardContainer.innerHTML = `<p>Error loading leaderboard: ${error.message}</p>`;
    }
}

loadLeaderboard();
