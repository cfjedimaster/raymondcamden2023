import type { Config, Context } from '@netlify/functions';

// Credit for source: https://gist.github.com/porkloin/94d661f0d53058279dde84d63acbcdb8
const RULES = [
  {
    Source: 'The Nagus (DS9 episode)',
    Number: 1,
    Rule: 'Once you have their money, you never give it back. ',
  },
  {
    Source: 'The 34th Rule (DS9 novel)',
    Number: 2,
    Rule: 'The best deal is the one that makes the most profit. ',
  },
  {
    Source: 'The Maquis, Part II (DS9 episode)',
    Number: 3,
    Rule: 'Never spend more for an acquisition than you have to. ',
  },
  {
    Source: 'The Ferengi Rules of Acquisition (DS9 novel)',
    Number: 4,
    Rule: 'A woman wearing clothes is like a man in the kitchen. ',
  },
  {
    Source: 'Cold Fusion (SCE novel)',
    Number: 5,
    Rule: 'Always exaggerate your estimates. ',
  },
  {
    Source: 'The Nagus (DS9 episode)',
    Number: 6,
    Rule: 'Never let family stand in the way of opportunity. ',
  },
  {
    Source: 'In the Hands of the Prophets (DS9 episode)',
    Number: 7,
    Rule: 'Always keep your ears open. ',
  },
  {
    Source: 'The Ferengi Rules of Acquisition (DS9 novel)',
    Number: 8,
    Rule: 'Small print leads to large risk. ',
  },
  {
    Source: 'The Storyteller (DS9 episode)',
    Number: 9,
    Rule: 'Instinct, plus opportunity, equals profit. ',
  },
  {
    Source: 'Prophet Motive (VOY episode)',
    Number: 10,
    Rule: 'Greed is eternal. ',
  },
  {
    Source: 'The Ferengi Rules of Acquisition (DS9 novel)',
    Number: 11,
    Rule: 'Even if its free, you can always buy it cheaper. ',
  },
  {
    Source: 'The Ferengi Rules of Acquisition (DS9 novel)',
    Number: 12,
    Rule: 'Anything worth selling is worth selling twice. ',
  },
  {
    Source: 'Legends of the Ferengi (DS9 novel)',
    Number: 13,
    Rule: 'Anything worth doing is worth doing for money. ',
  },
  {
    Source: 'Demons of Air and Darkness (DS9 novel)',
    Number: 15,
    Rule: 'Dead men close no deals. ',
  },
  {
    Source: 'The Ferengi Rules of Acquisition (DS9 novel)',
    Number: 16,
    Rule: 'A deal is a deal (is a deal)...until a better one comes along. ',
  },
  {
    Source: 'Body Parts (DS9 episode)',
    Number: 17,
    Rule: 'A contract is a contract is a contract... but only between Ferengi. ',
  },
  {
    Source: 'Heart of Stone (DS9 episode)',
    Number: 18,
    Rule: 'A Ferengi without profit is no Ferengi at all. ',
  },
  {
    Source: 'Legends of the Ferengi (DS9 novel)',
    Number: 19,
    Rule: 'Satisfaction is not guaranteed. ',
  },
  {
    Source: 'Ferenginar: Satisfaction is Not Guaranteed (DS9 novella)',
    Number: 20,
    Rule: 'He who dives under the table today lives to profit tomorrow. ',
  },
  {
    Source: 'Rules of Acquisition (DS9 episode)',
    Number: 21,
    Rule: 'Never place friendship before profit. ',
  },
  {
    Source: 'Rules of Acquisition (DS9 episode)',
    Number: 22,
    Rule: 'Wise men can hear profit in the wind. ',
  },
  {
    Source: 'Acquisition (ENT episode)',
    Number: 23,
    Rule: 'Nothing is more important than your health...except for your money. ',
  },
  {
    Source: 'The Siege of Ar-558 (DS9 episode)',
    Number: 25,
    Rule: "You can't make a deal if you're dead. ",
  },
  {
    Source: 'Legends of the Ferengi (DS9 novel)',
    Number: 27,
    Rule: "There's nothing more dangerous than an honest businessman. ",
  },
  {
    Source: 'Highest Score (DS9 novel)',
    Number: 29,
    Rule: "What's in it for me? ",
  },
  {
    Source: 'The Badlands, Part IV (DS9 novel)',
    Number: 30,
    Rule: 'A wise man knows that confidentiality equals profit. ',
  },
  {
    Source: 'The Siege (DS9 episode)',
    Number: 31,
    Rule: "Never make fun of a Ferengi's mother. ",
  },
  {
    Source: 'Elite Force II',
    Number: 32,
    Rule: 'Insult something he cares about. ',
  },
  {
    Source: 'Rules of Acquisition (DS9 episode)',
    Number: 33,
    Rule: 'It never hurts to suck up to the boss. ',
  },
  {
    Source: 'Destiny (DS9 episode); The 34th Rule (DS9 novel)',
    Number: 34,
    Rule: 'War is good for business. ',
  },
  {
    Source: 'Destiny (DS9 episode); The 34th Rule (DS9 novel)',
    Number: 35,
    Rule: 'Peace is good for business. ',
  },
  {
    Source: 'ST novella: Reservoir Ferengi',
    Number: 37,
    Rule: 'The early investor reaps the most interest. ',
  },
  {
    Source: 'The Ferengi Rules of Acquisition (DS9 novel)',
    Number: 40,
    Rule: 'She can touch your lobes but never your latinum. ',
  },
  {
    Source: 'The Ferengi Rules of Acquisition (DS9 novel)',
    Number: 41,
    Rule: 'Profit is its own reward. ',
  },
  {
    Source: 'The Buried Age (TNG novel)',
    Number: 43,
    Rule: 'Feed your greed, but not enough to choke it. ',
  },
  {
    Source: 'The Ferengi Rules of Acquisition (DS9 novel)',
    Number: 44,
    Rule: 'Never confuse wisdom with luck. ',
  },
  {
    Source: 'Acquisition (ENT episode)',
    Number: 45,
    Rule: 'Expand or die.* ',
  },
  {
    Source: 'Rivals (DS9 episode)',
    Number: 47,
    Rule: 'Never trust a man wearing a better suit than your own. ',
  },
  {
    Source: 'Rules of Acquisition (DS9 episode)',
    Number: 48,
    Rule: 'The bigger the smile, the sharper the knife. ',
  },
  {
    Source: 'The Ferengi Rules of Acquisition (DS9 novel)',
    Number: 52,
    Rule: 'Never ask when you can take. ',
  },
  {
    Source: 'Mission Gamma: Twilight (DS9 novel)',
    Number: 53,
    Rule: 'Never trust anybody taller than you. ',
  },
  {
    Source: 'Raise the Dawn (Typhon Pact novel)',
    Number: 54,
    Rule: 'Rate divided by time equals profit. (Also known as The Velocity of Wealth.) ',
  },
  {
    Source: 'Worlds of Deep Space Nine: Bajor: Fragments and Omens (DS9 novel)',
    Number: 55,
    Rule: 'Take joy from profit, and profit from joy. ',
  },
  {
    Source: 'Armageddon Game (DS9 episode)',
    Number: 57,
    Rule: 'Good customers are almost as rare as latinum...treasure them. ',
  },
  {
    Source: 'The Ferengi Rules of Acquisition (DS9 novel)',
    Number: 58,
    Rule: 'There is no substitute for success. ',
  },
  {
    Source: 'Rules of Acquisition (DS9 episode)',
    Number: 59,
    Rule: 'Free advice is seldom cheap. ',
  },
  {
    Source: 'The Ferengi Rules of Acquisition (DS9 novel)',
    Number: 60,
    Rule: 'Keep your lies consistent. ',
  },
  {
    Source: 'Rules of Acquisition (DS9 episode)',
    Number: 62,
    Rule: 'The riskier the road, the greater the profit. ',
  },
  {
    Source: 'Over a Torrent Sea (TTN novel)',
    Number: 63,
    Rule: 'Work is the best therapy-at least for your employees. ',
  },
  {
    Source: 'The Ferengi Rules of Acquisition (DS9 novel)',
    Number: 65,
    Rule: "Win or lose, there's always Hupyrian beetle snuff. ",
  },
  {
    Source: 'Balance of Power (TNG novel)',
    Number: 69,
    Rule: 'Ferengi are not responsible for the stupidity of other races. ',
  },
  {
    Source: 'Inside Man (VOY episode)',
    Number: 74,
    Rule: 'Knowledge equals profit. ',
  },
  {
    Source: 'Civil Defense (DS9 episode)',
    Number: 75,
    Rule: 'Home is where the heart is, but the stars are made of latinum. ',
  },
  {
    Source: 'The Homecoming (DS9 episode)',
    Number: 76,
    Rule: 'Every once in a while, declare peace. It confuses the Hell out of your enemies. ',
  },
  {
    Source: 'Star Trek Online',
    Number: 77,
    Rule: 'If you break it, you bought it. ',
  },
  {
    Source: 'The Ferengi Rules of Acquisition (DS9 novel)',
    Number: 79,
    Rule: 'Beware of the Vulcan greed for knowledge. ',
  },
  {
    Source: 'The Ferengi Rules of Acquisition (DS9 novel)',
    Number: 82,
    Rule: 'The flimsier the product, the higher the price. ',
  },
  {
    Source: 'The Ferengi Rules of Acquisition (DS9 novel)',
    Number: 85,
    Rule: "Never let the competition know what you're thinking. ",
  },
  {
    Source: 'Highest Score (DS9 novel)',
    Number: 87,
    Rule: "Learn the customer's weaknesses, so that you can better take advantage of him. ",
  },
  {
    Source: 'Ferenginar: Satisfaction is Not Guaranteed (DS9 novella)',
    Number: 88,
    Rule: "It ain't over 'til its over. ",
  },
  {
    Source: 'The Ferengi Rules of Acquisition (DS9 novel)',
    Number: 89,
    Rule: 'Ask not what you can do for your profits, but what your profits can do for you. ',
  },
  {
    Source: 'Highest Score (DS9 novel)',
    Number: 92,
    Rule: 'There are many paths to profit. ',
  },
  {
    Source: 'Ferengi Love Songs (DS9 episode)',
    Number: 94,
    Rule: "Females and finances don't mix. ",
  },
  {
    Source: 'False Profits (VOY episode)',
    Number: 95,
    Rule: 'Expand or die.* ',
  },
  {
    Source: 'The Ferengi Rules of Acquisition (DS9 novel)',
    Number: 97,
    Rule: 'Enough...is never enough. ',
  },
  {
    Source: 'In the Pale Moonlight (DS9 episode)',
    Number: 98,
    Rule: 'Every man has his price. ',
  },
  {
    Source: 'The Ferengi Rules of Acquisition (DS9 novel)',
    Number: 99,
    Rule: 'Trust is the biggest liability of all. ',
  },
  {
    Source: "The Jem'Hadar (DS9 episode)",
    Number: 102,
    Rule: 'Nature decays, but latinum lasts forever. ',
  },
  {
    Source: 'Rules of Acquisition (DS9 episode)',
    Number: 103,
    Rule: 'Sleep can interfere with... ',
  },
  {
    Source: 'The Ferengi Rules of Acquisition (DS9 novel)',
    Number: 104,
    Rule: 'Faith moves mountains...of inventory. ',
  },
  {
    Source: 'The Ferengi Rules of Acquisition (DS9 novel)',
    Number: 106,
    Rule: 'There is no honor in poverty. ',
  },
  {
    Source: 'Rivals (DS9 episode)',
    Number: 109,
    Rule: 'Dignity and an empty sack is worth the sack. ',
  },
  {
    Source: 'Star Trek Online',
    Number: 110,
    Rule: 'Exploitation begins at home. ',
  },
  {
    Source: 'Past Tense, Part I (DS9 episode)',
    Number: 111,
    Rule: 'Treat people in your debt like family... exploit them. ',
  },
  {
    Source: 'Playing God (DS9 episode)',
    Number: 112,
    Rule: "Never have sex with the boss' sister. ",
  },
  {
    Source: 'The Ferengi Rules of Acquisition (DS9 novel)',
    Number: 113,
    Rule: 'Always have sex with the boss. ',
  },
  {
    Source: 'The Ferengi Rules of Acquisition (DS9 novel)',
    Number: 121,
    Rule: 'Everything is for sale - even friendship. ',
  },
  {
    Source: 'The Ferengi Rules of Acquisition (DS9 novel)',
    Number: 123,
    Rule: 'Even a blind man can recognize the glow of Latinum. ',
  },
  {
    Source: 'The Siege of AR-558 (DS9 episode)',
    Number: 125,
    Rule: "You can't make a deal if you're dead. ",
  },
  {
    Source: 'Necessary Evil (DS9 episode)',
    Number: 139,
    Rule: 'Wives serve; brother inherit. ',
  },
  {
    Source: 'The Ferengi Rules of Acquisition (DS9 novel)',
    Number: 141,
    Rule: 'Only fools pay retail. ',
  },
  {
    Source: 'Legends of the Ferengi (DS9 novel)',
    Number: 144,
    Rule: "There's nothing wrong with charity... as long as it winds up in your pocket. ",
  },
  {
    Source: 'Fearful Symmetry (DS9 novel)',
    Number: 147,
    Rule: 'People love the bartender. ',
  },
  {
    Source: 'Deep Space Mine (DS9 comic)',
    Number: 153,
    Rule: 'Sell the sizzle, not the steak. ',
  },
  {
    Source: 'The Ferengi Rules of Acquisition (DS9 novel)',
    Number: 162,
    Rule: 'Even in the worst of times, someone turns a profit. ',
  },
  {
    Source: 'Treachery, Faith, and the Great River (DS9 episode)',
    Number: 168,
    Rule: 'Whisper your way to success. ',
  },
  {
    Source: 'The Ferengi Rules of Acquisition (DS9 novel)',
    Number: 177,
    Rule: 'Know your enemies... but do business with them always. ',
  },
  {
    Source: 'The Ferengi Rules of Acquisition (DS9 novel)',
    Number: 181,
    Rule: 'Not even dishonesty can tarnish the shine of profit. ',
  },
  {
    Source: 'Hollow Men (DS9 novel)',
    Number: 183,
    Rule: 'When life hands you ungaberries, make detergent. ',
  },
  {
    Source: 'Balance of Power (TNG novel)',
    Number: 184,
    Rule: 'A Ferengi waits to bid until his opponents have exhausted themselves. ',
  },
  {
    Source: 'Star Trek Online',
    Number: 188,
    Rule: 'Not even dishonesty can tarnish the shine of profit. ',
  },
  {
    Source: 'The Ferengi Rules of Acquisition (DS9 novel)',
    Number: 189,
    Rule: 'Let others keep their reputation. You keep their money. ',
  },
  {
    Source: 'DS9 episode: Call to Arms',
    Number: 190,
    Rule: 'Hear all, trust nothing. ',
  },
  {
    Source: 'The Ferengi Rules of Acquisition (DS9 novel)',
    Number: 192,
    Rule: "Never cheat a Klingon... unless you're sure you can get away with it. ",
  },
  {
    Source: 'Star Trek Online',
    Number: 193,
    Rule: 'Trouble comes in threes. ',
  },
  {
    Source: 'Whispers (DS9 episode)',
    Number: 194,
    Rule: "It's always good business to know about new customers before they walk in your door. ",
  },
  {
    Source: 'The Soul Key (DS9 novel)',
    Number: 199,
    Rule: 'Location, location, location. ',
  },
  {
    Source: '(DS9 novel: Ferenginar: Satisfaction is Not Guaranteed)',
    Number: 200,
    Rule: 'A Ferengi chooses no side but his own ',
  },
  {
    Source: 'The Ferengi Rules of Acquisition (DS9 reference book)',
    Number: 202,
    Rule: 'The justification for profit is profit. ',
  },
  {
    Source: 'DS9 episode: Little Green Men',
    Number: 203,
    Rule: 'New customers are like razor-toothed gree worms. They can be succulent, but sometimes they bite back. ',
  },
  {
    Source: 'DS9 episode: Ferengi Love Songs',
    Number: 208,
    Rule: 'Sometimes, the only thing more dangerous than a question is an answer. ',
  },
  {
    Source: 'DS9 episode: Bar Association',
    Number: 211,
    Rule: "Employees are the rungs on the ladder of success, don't hesitate to step on them. ",
  },
  {
    Source: 'Star Trek Online',
    Number: 212,
    Rule: 'A good lie is easier to believe than the truth. ',
  },
  {
    Source: 'DS9 episode: The Maquis, Part I',
    Number: 214,
    Rule: 'Never begin a business transaction on an empty stomach. ',
  },
  {
    Source: 'DS9 novel: The Laertian Gamble',
    Number: 216,
    Rule: 'Never gamble with a telepath. ',
  },
  {
    Source: 'DS9 episode: Past Tense, Part I',
    Number: 217,
    Rule: "You can't free a fish from water. ",
  },
  {
    Source: 'The Ferengi Rules of Acquisition (DS9 reference book)',
    Number: 218,
    Rule: "Always know what you're buying. ",
  },
  {
    Source: 'Baby on Board (DS9 Malibu Comics)',
    Number: 218,
    Rule: 'Sometimes what you get free cost entirely too much. ',
  },
  {
    Source: 'TNG novel: Balance of Power',
    Number: 219,
    Rule: 'Possession is eleven-tenths of the law! ',
  },
  {
    Source: 'The Ferengi Rules of Acquisition (DS9 reference book)',
    Number: 223,
    Rule: "Beware the man who doesn't take time for Oo-mox. ",
  },
  {
    Source: 'Star Trek Online',
    Number: 227,
    Rule: "If that's what's written, then that's what's written. ",
  },
  {
    Source: 'DS9 episode: Ferengi Love Songs',
    Number: 229,
    Rule: 'Latinum lasts longer than lust. ',
  },
  {
    Source: 'Mission Gamma: Twilight (DS9 novel)',
    Number: 235,
    Rule: 'Duck; death is tall. ',
  },
  {
    Source: 'The Ferengi Rules of Acquisition (DS9 reference book)',
    Number: 236,
    Rule: "You can't buy fate. ",
  },
  {
    Source: 'DS9 episode: Body Parts',
    Number: 239,
    Rule: 'Never be afraid to mislabel a product. ',
  },
  {
    Source: 'Star Trek Online',
    Number: 240,
    Rule: 'Time, like latinum, is a highly limited commodity. ',
  },
  {
    Source: 'The Ferengi Rules of Acquisition (DS9 reference book)',
    Number: 242,
    Rule: 'More is good...all is better. ',
  },
  {
    Source: 'The Ferengi Rules of Acquisition (DS9 reference book)',
    Number: 255,
    Rule: 'A wife is [a] luxury... a smart accountant a neccessity. ',
  },
  {
    Source: 'False Profits (Voyager)',
    Number: 257,
    Rule: 'When the messenger comes to appropriate your profits, kill the messenger. ',
  },
  {
    Source: 'The Ferengi Rules of Acquisition (DS9 reference book)',
    Number: 261,
    Rule: 'A wealthy man can afford everything except a conscience. ',
  },
  {
    Source: 'DS9 episode: Bar Association',
    Number: 263,
    Rule: 'Never let doubt interfere with your lust for Latinum. ',
  },
  {
    Source: 'The Ferengi Rules of Acquisition (DS9 reference book)',
    Number: 266,
    Rule: 'When in doubt, lie. ',
  },
  {
    Source: 'Star Trek Online',
    Number: 272,
    Rule: 'Always inspect the merchandise before making a deal. ',
  },
  {
    Source: 'DS9 novel: Ferenginar: Satisfaction is Not Guaranteed)',
    Number: 280,
    Rule: "If it ain't broke, don't fix it. ",
  },
  {
    Source: 'The Ferengi Rules of Acquisition (DS9 reference book)',
    Number: 284,
    Rule: "Deep down, everyone's a Ferengi. ",
  },
  {
    Source: 'DS9 episode: The Collaborator',
    Number: 285,
    Rule: 'No good deed ever goes unpunished. ',
  },
];

const getRandomIntInclusive = function (min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1) + min);
};

export default async (req: Request, context: Context) => {
  const token = Netlify.env.get('BOT_RULESOFACQUISITION');
  if (!token) {
    console.error('Missing BOT_RULESOFACQUISITION environment variable');
    return new Response('Missing BOT_RULESOFACQUISITION environment variable', { status: 500 });
  }

  const rule = RULES[getRandomIntInclusive(0, RULES.length - 1)];

  const toot = `Ferengi Rule of Acquisition ${rule.Number}

"${rule.Rule.trim()}"

Source: ${rule.Source}`;

  const tootRes = await fetch('https://mastodon.social/api/v1/statuses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ status: toot }),
  });

  if (!tootRes.ok) {
    const errText = await tootRes.text();
    console.error(`Failed to post to Mastodon: ${tootRes.status} ${errText}`);
    return new Response('Failed to post to Mastodon', { status: 502 });
  }

  const result = await tootRes.json();
  console.log(`Posted toot: ${result.url ?? result.id}`);

  return Response.json(result);
};

export const config: Config = {
  schedule: '0 */4 * * *', // Every 4 hours on the hour (UTC)
};
