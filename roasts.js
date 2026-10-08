/*
 * Roast engine.
 * Every line has a tier: 1 = mild, 2 = spicy, 3 = dark, 4 = no mercy (uncensored).
 * Lines at or below the user's chosen intensity are eligible; lines that
 * match the intensity exactly are weighted higher so "Dark" actually feels dark.
 *
 * Placeholders: {name} {item} {ITEM} {cost} {over} {category} {goal} {sore}
 */
(function () {
  const POOLS = {
    relationship: {
      single: [
        [1, "Buying a {item} won't make anyone text you back, {name}."],
        [2, "A {item} is not a personality. Ask your matches. Oh wait, you'd need matches."],
        [3, "NO. DO NOT BUY THE {ITEM} UNLESS YOU WANT TO DIE BROKE AND ALONE."],
        [3, "Spend {cost} on a {item} and the only thing that'll ever commit to you is your credit card debt."],
      ],
      dating: [
        [1, "That's {cost} you could spend on an actual date. Or is the {item} your plus-one?"],
        [2, "Nothing ends a talking stage faster than 'can you get this one? I'll get you next time.'"],
        [3, "Buy the {item} and your next date is a picnic of tap water and regret."],
      ],
      relationship: [
        [1, "Your partner deserves someone who doesn't need an app to stop buying a {item}."],
        [2, "Explaining this charge to your partner is going to be a fun conversation. For them."],
        [3, "Keep spending like this and your partner will upgrade to someone with a savings account."],
      ],
      married: [
        [1, "Marriage is about sharing. Including the blame for this {item}."],
        [2, "'For richer or for poorer' was a vow, not a challenge."],
        [3, "Buy it, and the next thing you two split will be the assets."],
      ],
      complicated: [
        [1, "Your love life is complicated. Your finances don't have to be. Put down the {item}."],
        [2, "'It's complicated' is also how your bank describes you."],
        [3, "A {item} can't fix your situationship. It can make it a broke situationship."],
      ],
    },
    living: {
      parents: [
        [1, "You live with your parents. The {item} would live there rent-free too. Just like you."],
        [2, "Your mom is going to find the box, {name}."],
        [3, "Buy the {item} and you'll be in that childhood bedroom until it's legally a museum."],
      ],
      roommates: [
        [1, "Your roommates already eat your food. Don't give them a {item} to borrow too."],
        [2, "You split rent four ways but can't split from a {item}?"],
        [3, "Keep this up and you'll be the roommate who 'pays you back next week.' Forever."],
      ],
      alone: [
        [1, "You live alone, so nobody's around to stop you. That's why we're here."],
        [2, "Nobody will see the {item}. Nobody sees you either."],
        [3, "Living alone with a {item} and no savings is how you become the cautionary tale at family dinners."],
      ],
      partner: [
        [1, "Your shared budget didn't have a line for '{item}.'"],
        [2, "Your partner will find out about the {item}. From the bank statement."],
        [3, "A few more purchases like this and you'll be living alone, {name}."],
      ],
    },
    work: {
      student: [
        [1, "Your student loans just felt a disturbance in the force."],
        [2, "You eat instant ramen to save money and then do THIS?"],
        [3, "You'll finish paying off this {item} and your tuition at the same time. Around age 54."],
      ],
      employed: [
        [1, "You worked hard for that {cost}. Don't hand it to a {item}."],
        [2, "Remember that meeting that could've been an email? That's what this {item} costs."],
        [3, "Buy it and enjoy working until you're 80 to afford 'just one more {item}.'"],
      ],
      freelance: [
        [1, "Freelance income is a vibe, not a guarantee. Skip the {item}."],
        [2, "Your invoice is 'net 90' and you're already spending it? Brave."],
        [3, "Clients ghost invoices. Your landlord doesn't ghost rent. Put. It. Down."],
      ],
      unemployed: [
        [1, "Bold purchase for someone without a paycheck coming."],
        [2, "Your job title is 'between opportunities.' Your bank balance is 'between zero and less than zero.'"],
        [3, "No job and buying a {item}? That's not shopping, that's a cry for help with free shipping."],
      ],
    },
    age: {
      "u18": [[1, "Ask your parents. Actually, don't. They'll say no too."]],
      "18-24": [[2, "Your twenties are for building wealth, not a {item} collection."]],
      "25-34": [[2, "People your age are buying houses. You're buying a {item}."]],
      "35-44": [[2, "Midlife crisis purchases are supposed to be sports cars, not a {item}."]],
      "45+": [[3, "Retirement is closer than you think, and a {item} is not a retirement plan."]],
    },
    weakness: [
      [1, "Another {category} purchase? That's a pattern, not a purchase."],
      [2, "You literally told us {category} is your weakness. We're just quoting you, {name}."],
      [3, "You've spent so much on {category} they should put your face on their earnings report."],
    ],
    goal: [
      [1, "Remember your goal to {goal}? This {item} doesn't."],
      [2, "Every {item} pushes '{goal}' back another month. You'll get there. Probably posthumously."],
      [3, "At this rate you'll {goal} right around the time the sun burns out."],
    ],
    sore: [
      [1, "You told us '{sore}' is a sore spot. Let's not add 'money' to that list."],
      [2, "You're sensitive about '{sore}'. A {item} won't fix that. Neither will we."],
      [3, "'{sore}' AND a {item} habit? Bold combo. Tragic, but bold."],
    ],
    over: [
      [1, "This puts you {over} over budget. The math isn't mathing."],
      [2, "{over} past your limit. A budget is a boundary, not a suggestion."],
      [3, "{over} over budget. Your wallet just filed a missing persons report on itself."],
    ],
    generic: [
      [1, "Your bank account asked us to step in."],
      [1, "Close the tab. Drink some water. Walk away."],
      [2, "Future you will see this charge and sigh loud enough for the neighbors to hear."],
      [2, "You don't want a {item}. You want serotonin. Those are different things."],
      [3, "Your bank account just filed for emotional damages."],
      [3, "Somewhere, a financial advisor just felt a chill and doesn't know why."],
      [3, "They'll put it on your tombstone: 'Had potential. Spent it on a {item}.'"],
    ],
  };

  // Tier 4: "No Mercy". Uncensored. Kept in one block so it's easy to tune.
  // Rule of thumb: roast choices (spending, love life, job, goals, the sore spot
  // they picked), never identity (race, religion, sexuality, disability, body).
  const NO_MERCY = {
    relationship: {
      single: [
        "Buy the fucking {item}. It'll be the only thing that's ever gone home with you.",
        "Your dating profile says 'financially stable.' Biggest lie on the app, and you're on the app a LOT.",
      ],
      dating: [
        "Spend {cost} on this and your next date gets to watch you 'forget your wallet' for the third fucking time.",
        "They're not ghosting you because you're busy. They're ghosting you because you're broke. Put it down.",
      ],
      relationship: ["Your partner is one more {item} away from realizing they could do so much fucking better."],
      married: ["Your spouse said 'for poorer,' not 'watch me set our shit on fire one {item} at a time.'"],
      complicated: ["Your situationship won't commit, your bank account won't recover, and you want a fucking {item}?"],
    },
    living: {
      parents: [
        "Your parents had a kid so someone would take care of them someday. Look how that's going.",
        "You pay zero rent and you're STILL broke? That takes real fucking talent.",
      ],
      roommates: ["Your roommates already talk shit about you in the group chat you're not in. Don't hand them new material."],
      alone: ["Go ahead. Maybe the delivery driver will be the human contact you've been missing."],
      partner: ["Your partner is going to see this charge and start quietly looking at apartments."],
    },
    work: {
      student: ["You're paying thousands to learn things and still haven't learned the word 'no.' Fucking incredible."],
      employed: ["You sold 40 hours of your one life for that paycheck and you want to blow it on a {item}? Clown shit."],
      freelance: ["Your 'personal brand' is unpaid invoices and impulse buys. Get a fucking accountant. Oh wait, you can't afford one."],
      unemployed: ["No job, no savings, and a {item} in your cart. You're not a customer, you're a warning label."],
    },
    age: {
      "18-24": ["You're young enough to fix this and dumb enough to buy a {item} anyway."],
      "25-34": ["Your friends are buying houses and having kids. You're buying a fucking {item}. Let that marinate."],
      "35-44": ["Halfway through life with nothing saved and you're reaching for a {item}? Bold fucking strategy."],
      "45+": ["Retirement is coming whether your savings are or not. Spoiler: they're fucking not."],
    },
    weakness: [
      "You told us {category} is your weakness and here you are, {cost} deep, like a fucking moth to a lamp.",
      "Another {category} purchase. You don't have a budget, you have a habit with a spreadsheet.",
    ],
    goal: [
      "You'll {goal} the same year your ex regrets leaving you. So, never.",
      "'{goal}' isn't a goal anymore, it's a fucking fantasy. Like you having savings.",
    ],
    sore: [
      "We were going to roast you about '{sore}', but your bank statement beat us to it.",
      "'{sore}' is already a mess. Want to add 'broke as shit' to the list?",
      "You can't fix '{sore}' with a {item}, you absolute walking clearance rack.",
    ],
    over: ["{over} over budget. You're not bad with money, you're a fucking natural disaster."],
    generic: [
      "Put the {item} down and back away slowly, you financially illiterate goblin.",
      "Your bank account has seen more disappointment than your parents at your graduation.",
      "Buy it and die broke, alone, and surrounded by shit you didn't need.",
      "This is how you end up 60, eating cereal for dinner, wondering where it all went. It went HERE, dumbass.",
    ],
  };

  // Merge No Mercy lines into the pools as tier 4.
  (function merge(src, dest) {
    for (const key of Object.keys(src)) {
      if (Array.isArray(src[key])) {
        dest[key] = (dest[key] || []).concat(src[key].map((t) => [4, t]));
      } else {
        dest[key] = dest[key] || {};
        merge(src[key], dest[key]);
      }
    }
  })(NO_MERCY, POOLS);

  const HEADLINES = {
    no: {
      1: ["Nope.", "Not today."],
      2: ["NO.", "Absolutely not."],
      3: ["ABSOLUTELY NOT.", "NO. JUST NO."],
      4: ["HELL NO.", "ABSOLUTELY FUCKING NOT.", "ARE YOU SHITTING ME?"],
    },
    yes: ["Fine. Buy it.", "Approved.", "You can afford it."],
  };

  const YES_QUIPS = {
    1: ["Treat yourself. Responsibly."],
    2: ["Don't let it go to your head.", "Enjoy it. We're watching."],
    3: ["Approved. Don't make it weird.", "Fine. But we're keeping the receipt in our heart."],
    4: ["Fine. Buy your shit. Don't make us regret this.", "Approved. Shocking, honestly. Don't get fucking used to it."],
  };

  let lastRoast = "";

  // Under-18 profiles never get No Mercy, even if an old save says otherwise.
  function profileIntensity(profile) {
    const n = Number(profile.intensity) || 2;
    return profile.age === "u18" ? Math.min(n, 3) : n;
  }

  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  function fill(text, vars) {
    return text.replace(/\{(\w+)\}/g, (_, key) => (key in vars ? vars[key] : ""));
  }

  function weightedPick(candidates, intensity) {
    const weighted = candidates.filter((c) => c.text !== lastRoast);
    const pool = weighted.length ? weighted : candidates;
    const total = pool.reduce((s, c) => s + c.weight, 0);
    let r = Math.random() * total;
    for (const c of pool) {
      r -= c.weight;
      if (r <= 0) return c;
    }
    return pool[pool.length - 1];
  }

  /**
   * profile: the onboarding answers
   * ctx: { item, cost, over, category, categoryLabel, isWeakness }
   */
  function roast(profile, ctx) {
    const intensity = profileIntensity(profile);
    const vars = {
      name: profile.name || "friend",
      item: ctx.item,
      ITEM: ctx.item.toUpperCase(),
      cost: ctx.cost,
      over: ctx.over || "",
      category: ctx.categoryLabel.toLowerCase(),
      goal: profile.goal,
      sore: profile.sore || "",
    };

    // [lines, bonus weight]: more specific roasts get more weight.
    const sources = [
      [POOLS.relationship[profile.relationship], 2],
      [POOLS.living[profile.living], 1.5],
      [POOLS.work[profile.work], 1.5],
      [POOLS.age[profile.age], 1],
      [POOLS.goal, 1],
      [POOLS.generic, 0.6],
    ];
    if (ctx.isWeakness) sources.push([POOLS.weakness, 3]);
    if (profile.sore) sources.push([POOLS.sore, intensity === 4 ? 3.5 : 2]);
    if (ctx.over) sources.push([POOLS.over, 1.5]);

    const candidates = [];
    for (const [lines, bonus] of sources) {
      if (!lines) continue;
      for (const [tier, text] of lines) {
        if (tier > intensity) continue;
        // No Mercy leans hard on its own lines instead of drifting back to tamer ones.
        const weight = bonus * (tier === intensity ? (intensity === 4 ? 6 : 3) : 1);
        candidates.push({ text: fill(text, vars), weight });
      }
    }

    const chosen = weightedPick(candidates, intensity);
    lastRoast = chosen.text;
    return {
      headline: pick(HEADLINES.no[intensity]),
      line: chosen.text,
      caps: chosen.text === chosen.text.toUpperCase(),
    };
  }

  function approve(profile) {
    const intensity = profileIntensity(profile);
    return { headline: pick(HEADLINES.yes), quip: pick(YES_QUIPS[intensity]) };
  }

  window.Roast = { roast, approve };
})();
