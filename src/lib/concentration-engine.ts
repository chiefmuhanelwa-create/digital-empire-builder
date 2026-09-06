// THE CONCENTRATION STRESS TEST — pure, client-safe, no AI.
//
// River → Fish → Tank. The river is the platform: it carries the fish, it is
// not yours, and it can be diverted without notice. The tank is what you own —
// an email address, a phone number, a customer record. Most creators are
// running a business whose entire distribution is a river, and they find out
// which it was on the day it stops.
//
// This is the one tool in the product built from the founder's own worst
// quarter rather than from an agency archive:
//
//   · An ad account terminated at the end of 2024. Two appeals refused, the
//     second as final in May 2025. There is no third appeal and no person to
//     call — that is what a river being diverted actually looks like.
//   · A reachable list that fell from 1,246 to 148 in twenty-five days, with
//     only 28 unsubscribes. Owning the list is not the same as the list being
//     reachable; the tank leaks too, just more slowly and with warning.
//
// So the test asks two questions, not one. How concentrated are you, and what
// is actually left standing if the biggest channel ends tonight.

export type ChannelKind = "owned" | "rented";

export type Channel = {
  id: string;
  platform: string;
  kind: ChannelKind;
  /** Followers, subscribers, members — whatever that channel counts. */
  size: number;
  /** Of those, how many you can actually reach. For a list, opens. For a
   *  platform, the number a post typically reaches. */
  reachable: number;
  /** Income attributable to this channel in a normal month. */
  monthlyIncome: number;
};

export type ChannelRisk = {
  channel: Channel;
  incomeShare: number;
  reachShare: number;
  /** reachable / size. A large channel you cannot reach is not an asset. */
  reachRate: number;
};

export type StressResult = {
  totalIncome: number;
  totalReach: number;
  ownedReach: number;
  rentedReach: number;
  ownedIncome: number;
  /** Owned share of reach, 0-100. The number this whole tool exists to move. */
  ownedPct: number;
  /** Largest single channel's share of income, 0-100. */
  topIncomeShare: number;
  /** Herfindahl index over income, 0-1. 1 = everything in one place. */
  hhi: number;
  risks: ChannelRisk[];
  /** The single channel whose loss hurts most. */
  worst: ChannelRisk | null;
  verdict: "fragile" | "exposed" | "spread";
  headline: string;
};

export function stressTest(channels: Channel[]): StressResult {
  const live = channels.filter((c) => c.platform.trim() && (c.size > 0 || c.monthlyIncome > 0));

  const totalIncome = live.reduce((s, c) => s + Math.max(0, c.monthlyIncome), 0);
  const totalReach = live.reduce((s, c) => s + Math.max(0, c.reachable), 0);
  const ownedReach = live.filter((c) => c.kind === "owned").reduce((s, c) => s + Math.max(0, c.reachable), 0);
  const ownedIncome = live.filter((c) => c.kind === "owned").reduce((s, c) => s + Math.max(0, c.monthlyIncome), 0);

  const risks: ChannelRisk[] = live.map((c) => ({
    channel: c,
    incomeShare: totalIncome > 0 ? (c.monthlyIncome / totalIncome) * 100 : 0,
    reachShare: totalReach > 0 ? (c.reachable / totalReach) * 100 : 0,
    reachRate: c.size > 0 ? (c.reachable / c.size) * 100 : 0,
  }));

  const hhi = risks.reduce((s, r) => s + Math.pow(r.incomeShare / 100, 2), 0);
  const topIncomeShare = risks.reduce((m, r) => Math.max(m, r.incomeShare), 0);
  const ownedPct = totalReach > 0 ? (ownedReach / totalReach) * 100 : 0;

  // Worst = the channel whose disappearance costs the most, weighting income
  // above reach because reach you cannot bill is not what pays rent.
  const worst =
    risks.length === 0
      ? null
      : risks.reduce((w, r) => (r.incomeShare * 2 + r.reachShare > w.incomeShare * 2 + w.reachShare ? r : w));

  const verdict: StressResult["verdict"] =
    topIncomeShare >= 70 || ownedPct < 10 ? "fragile" : topIncomeShare >= 45 || ownedPct < 25 ? "exposed" : "spread";

  const headline =
    live.length === 0
      ? "Add your channels to run the test"
      : verdict === "fragile"
        ? `${Math.round(topIncomeShare)}% of your income runs through one channel you do not own`
        : verdict === "exposed"
          ? `One channel carries ${Math.round(topIncomeShare)}% of your income`
          : `No single channel carries more than ${Math.round(topIncomeShare)}% of your income`;

  return {
    totalIncome, totalReach, ownedReach, rentedReach: totalReach - ownedReach, ownedIncome,
    ownedPct, topIncomeShare, hhi, risks, worst, verdict, headline,
  };
}

export type Aftermath = {
  lostIncome: number;
  lostReach: number;
  remainingIncome: number;
  remainingReach: number;
  /** Months you could keep going on what is left, if nothing replaced it. */
  survivingPct: number;
};

/** What is left the morning after. No appeal, no warning, no export. */
export function ifThisEnded(channels: Channel[], channelId: string): Aftermath | null {
  const gone = channels.find((c) => c.id === channelId);
  if (!gone) return null;
  const rest = channels.filter((c) => c.id !== channelId);

  const remainingIncome = rest.reduce((s, c) => s + Math.max(0, c.monthlyIncome), 0);
  const remainingReach = rest.reduce((s, c) => s + Math.max(0, c.reachable), 0);
  const total = remainingIncome + Math.max(0, gone.monthlyIncome);

  return {
    lostIncome: Math.max(0, gone.monthlyIncome),
    lostReach: Math.max(0, gone.reachable),
    remainingIncome,
    remainingReach,
    survivingPct: total > 0 ? (remainingIncome / total) * 100 : 0,
  };
}

export type Migration = {
  /** How many people to move onto owned channels to clear the threshold. */
  toMove: number;
  targetPct: number;
  /** At a realistic conversion, how many rented-audience touches that needs. */
  askesNeeded: number;
  note: string;
};

/** What it would actually take to get off the river. Deliberately unflattering
 *  arithmetic — the gap between "I should build a list" and the number of asks
 *  that requires is where most people quietly stop. */
export function migrationPlan(result: StressResult, targetPct = 30, conversion = 0.02): Migration | null {
  if (result.totalReach === 0 || result.ownedPct >= targetPct) return null;

  // Solve (owned + x) / (total + x) = target
  const target = targetPct / 100;
  const toMove = Math.ceil((target * result.totalReach - result.ownedReach) / (1 - target));
  const asks = Math.ceil(toMove / conversion);

  return {
    toMove,
    targetPct,
    askesNeeded: asks,
    note: `At a ${(conversion * 100).toFixed(0)}% conversion — optimistic for a cold audience — that is about ${asks.toLocaleString("en-GB")} people who need to see the ask. Which is why it is a campaign, not a caption.`,
  };
}

/** The one thing to do next. Single action, because a list of six is a list
 *  nobody starts. */
export function nextMove(result: StressResult): string {
  if (result.risks.length === 0) return "Add your channels — the platforms you post on and anything you own.";

  if (result.ownedPct < 10)
    return "You have almost no owned audience. Before anything else, put one destination in your bio that collects an email address, and send one thing to it this week.";

  const leaky = result.risks
    .filter((r) => r.channel.kind === "owned" && r.channel.size > 100 && r.reachRate < 25)
    .sort((a, b) => a.reachRate - b.reachRate)[0];
  if (leaky)
    return `You own ${leaky.channel.size.toLocaleString("en-GB")} on ${leaky.channel.platform} but reach ${Math.round(leaky.reachRate)}%. Owning a list is not the same as it being reachable — a list falls quietly when nothing is sent to it. Send something before you collect anyone else.`;

  if (result.worst && result.worst.incomeShare >= 45)
    return `${result.worst.channel.platform} carries ${Math.round(result.worst.incomeShare)}% of your income. The move is not to leave it — it is to make the second channel real enough that losing the first is a bad quarter instead of the end.`;

  return "Nothing here is urgent. Take the snapshot anyway, so next month has something to compare against.";
}
