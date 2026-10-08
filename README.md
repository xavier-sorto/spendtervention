# Spendtervention

A budget tracker that roasts you when you try to buy something you can't afford.

1. **Tell us about yourself:** love life, living situation, work, spending weaknesses, savings goal, an optional sore spot, and how hard you want to be roasted (Mild / Spicy / Dark / No Mercy). No Mercy is uncensored and unavailable if you pick "Under 18".
2. **Set budgets:** weekly and monthly fun-money limits.
3. **Dashboard:** week and month progress bars, a day-by-day chart for the week, stats, and a spending log.
4. **"Should I buy it?":** enter an item and price. If it fits your budget, you get approval. If it doesn't, you get a **NO** and a personalized roast built from your answers.

## How the verdict works

- **NO** if the price is more than what's left this month.
- **NO** if the price is more than what's left this week (Essentials only count against the monthly budget).
- **NO** if it's in one of your "weakness" categories and would eat more than half of what's left this week.
- Otherwise **YES**.

Roast lines live in `roasts.js`, grouped by profile answer and tagged 1 (mild), 2 (spicy) or 3 (dark); the uncensored No Mercy lines are in the `NO_MERCY` block. Add your own there.

## Run locally

Open `index.html` in a browser. No build step and no dependencies.

## Host on GitHub Pages

1. Create a new GitHub repository and push these files to the `main` branch.
2. In the repo, go to **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, select `main` and `/ (root)`, then save.
4. Your site will be live at `https://<your-username>.github.io/<repo-name>/` within a minute or two.

## Data & privacy

Everything is stored in your browser's `localStorage`. Nothing gets sent to a server. Clearing site data or switching browsers or devices starts you fresh.
