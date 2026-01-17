---
layout: post
title: "Using Chrome AI to Rewrite Monstrous JSON"
date: "2026-01-17T18:00:00"
categories: ["development"]
tags: ["javascript","generative ai"]
banner_image: /images/banners/monster_purple.jpg
permalink: /2026/01/17/using-chrome-ai-to-rewrite-monstrous-json
description: How to use Chrome's GenAI to transform JSON into readable English.
---

Happy Saturday folks, and while this is a topic I've covered many times here, I was bored and wanting to write some code, so I whipped up a quick demo. One of my favorite uses of AI is to take abstract data and write a human readable form of it. Now to be clear, this is not something you need AI for. Given that you know the shape of your data, you can create your own summary using hard-coded rules about what values to show, how to present them, and so forth. What I like about the Gen AI use-case for this is the amount of randomness and creativity you get in the responses. In the past I've done this with weather forecasts and chart data, but today I thought I'd try something different - monsters.

A lot of Dungeons and Dragons content is available, legally even, online in API and JSON formats. The [D&amp;D 5e API](https://www.dnd5eapi.co/) includes information on all aspects of the game, from classes to spells to monsters. While the API is handy, I knew I wanted the raw data as is so I headed over to the [repo](https://github.com/5e-bits/5e-srd-api) and grabbed the raw [monsters json file](https://github.com/5e-bits/5e-database/blob/main/src/2014/5e-SRD-Monsters.json). This JSON file contains information on every known monster. Here's an example, an you can see it is quite extensive (I won't be offended if you just skim this):

<textarea style="width:100%; height: 300px">{
    "index": "unicorn",
    "name": "Unicorn",
    "size": "Large",
    "type": "celestial",
    "alignment": "lawful good",
    "armor_class": [
      {
        "type": "dex",
        "value": 12
      }
    ],
    "hit_points": 67,
    "hit_dice": "9d10",
    "hit_points_roll": "9d10+18",
    "speed": {
      "walk": "50 ft."
    },
    "strength": 18,
    "dexterity": 14,
    "constitution": 15,
    "intelligence": 11,
    "wisdom": 17,
    "charisma": 16,
    "proficiencies": [],
    "damage_vulnerabilities": [],
    "damage_resistances": [],
    "damage_immunities": [
      "poison"
    ],
    "condition_immunities": [
      {
        "index": "charmed",
        "name": "Charmed",
        "url": "/api/2014/conditions/charmed"
      },
      {
        "index": "paralyzed",
        "name": "Paralyzed",
        "url": "/api/2014/conditions/paralyzed"
      },
      {
        "index": "poisoned",
        "name": "Poisoned",
        "url": "/api/2014/conditions/poisoned"
      }
    ],
    "senses": {
      "darkvision": "60 ft.",
      "passive_perception": 13
    },
    "languages": "Celestial, Elvish, Sylvan, telepathy 60 ft.",
    "challenge_rating": 5,
    "proficiency_bonus": 3,
    "xp": 1800,
    "special_abilities": [
      {
        "name": "Charge",
        "desc": "If the unicorn moves at least 20 ft. straight toward a target and then hits it with a horn attack on the same turn, the target takes an extra 9 (2d8) piercing damage. If the target is a creature, it must succeed on a DC 15 Strength saving throw or be knocked prone."
      },
      {
        "name": "Innate Spellcasting",
        "desc": "The unicorn's innate spellcasting ability is Charisma (spell save DC 14). The unicorn can innately cast the following spells, requiring no components:\n\nAt will: detect evil and good, druidcraft, pass without trace\n1/day each: calm emotions, dispel evil and good, entangle",
        "spellcasting": {
          "ability": {
            "index": "cha",
            "name": "CHA",
            "url": "/api/2014/ability-scores/cha"
          },
          "dc": 14,
          "components_required": [],
          "spells": [
            {
              "name": "Detect Evil and Good",
              "level": 1,
              "url": "/api/2014/spells/detect-evil-and-good",
              "usage": {
                "type": "at will"
              }
            },
            {
              "name": "Druidcraft",
              "level": 0,
              "url": "/api/2014/spells/druidcraft",
              "usage": {
                "type": "at will"
              }
            },
            {
              "name": "Pass Without Trace",
              "level": 2,
              "url": "/api/2014/spells/pass-without-trace",
              "usage": {
                "type": "at will"
              }
            },
            {
              "name": "Calm Emotions",
              "level": 2,
              "url": "/api/2014/spells/calm-emotions",
              "usage": {
                "type": "per day",
                "times": 1
              }
            },
            {
              "name": "Dispel Evil and Good",
              "level": 5,
              "url": "/api/2014/spells/dispel-evil-and-good",
              "usage": {
                "type": "per day",
                "times": 1
              }
            },
            {
              "name": "Entangle",
              "level": 1,
              "url": "/api/2014/spells/entangle",
              "usage": {
                "type": "per day",
                "times": 1
              }
            }
          ]
        }
      },
      {
        "name": "Magic Resistance",
        "desc": "The unicorn has advantage on saving throws against spells and other magical effects."
      },
      {
        "name": "Magic Weapons",
        "desc": "The unicorn's weapon attacks are magical."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "multiattack_type": "actions",
        "desc": "The unicorn makes two attacks: one with its hooves and one with its horn.",
        "actions": [
          {
            "action_name": "Hooves",
            "count": 1,
            "type": "melee"
          },
          {
            "action_name": "Horn",
            "count": 1,
            "type": "melee"
          }
        ]
      },
      {
        "name": "Hooves",
        "desc": "Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 11 (2d6 + 4) bludgeoning damage.",
        "attack_bonus": 7,
        "damage": [
          {
            "damage_type": {
              "index": "bludgeoning",
              "name": "Bludgeoning",
              "url": "/api/2014/damage-types/bludgeoning"
            },
            "damage_dice": "2d6+4"
          }
        ]
      },
      {
        "name": "Horn",
        "desc": "Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 8 (1d8 + 4) piercing damage.",
        "attack_bonus": 7,
        "damage": [
          {
            "damage_type": {
              "index": "piercing",
              "name": "Piercing",
              "url": "/api/2014/damage-types/piercing"
            },
            "damage_dice": "1d8+4"
          }
        ]
      },
      {
        "name": "Healing Touch",
        "desc": "The unicorn touches another creature with its horn. The target magically regains 11 (2d8 + 2) hit points. In addition, the touch removes all diseases and neutralizes all poisons afflicting the target.",
        "usage": {
          "type": "per day",
          "times": 3
        }
      },
      {
        "name": "Teleport",
        "desc": "The unicorn magically teleports itself and up to three willing creatures it can see within 5 ft. of it, along with any equipment they are wearing or carrying, to a location the unicorn is familiar with, up to 1 mile away.",
        "usage": {
          "type": "per day",
          "times": 1
        }
      }
    ],
    "legendary_actions": [
      {
        "name": "Hooves",
        "desc": "The unicorn makes one attack with its hooves."
      },
      {
        "name": "Shimmering Shield (Costs 2 Actions)",
        "desc": "The unicorn creates a shimmering, magical field around itself or another creature it can see within 60 ft. of it. The target gains a +2 bonus to AC until the end of the unicorn's next turn."
      },
      {
        "name": "Heal Self (Costs 3 Actions)",
        "desc": "The unicorn magically regains 11 (2d8 + 2) hit points."
      }
    ],
    "image": "/api/images/monsters/unicorn.png",
    "url": "/api/2014/monsters/unicorn"
}
</textarea>

Ok, so given this, I built a little demo of turning this into something a bit more manageable. 

## The Demo

My demo is pretty straight-forward. I'm going to load in the big JSON file (it's a bit over a meg so not *too* bad, but I would consider client-side storage in a real app) and then let the user click a button to:

a) select a random monster and display the raw JSON
b) use [Chrome AI](https://developer.chrome.com/docs/ai/built-in) to turn this into a paragraph of text.

At the time I'm writing this, the [Prompt API](https://developer.chrome.com/docs/ai/prompt-api) is still behind a flag, so even if you're on Chrome, you'll need to either enable the flag or... just wait. ;) I'm going to include examples at the end, so don't fret.

Alright, so the HTML first:

```html
<h2>D&amp;D Monster to Text</h2>
<p>
	This CodePen demonstrates using Chrome AI to rewrite JSON describing content into a paragraph of text for easier consumption. In this case the JSON describes a D&amp;D monster. (JSON source from <a href="https://github.com/5e-bits/5e-database/blob/main/src/2014/5e-SRD-Monsters.json">5e-bits</a> on Github.)
</p>
<div class="twocol">
	<div>
		<textarea id="input"></textarea>
	<p>
		<button disabled id="runBtn">New Random Monster</button>
	</p>
	</div>
	<div id="result"></div>
</div>
```

Nothing too fancy here, just a textarea for the JSON and an empty div for the result. Do note the button that kicks off the process. 

Now let's look at the JavaScript:

```js
const MONSTERS_JSON = 'https://assets.codepen.io/74045/5e-SRD-Monsters.json';
let monsters;

document.addEventListener('DOMContentLoaded', init, false);

let $input, $runBtn, $result;
let session;

async function init() {

	if(!('LanguageModel' in window)) {
		alert('Sorry, but you can\'t use this demo.');
		return;
	}

	let available = (await window.LanguageModel.availability());

	if (available === 'unavailable') {
		alert('Sorry, but you can\'t use this demo.');
		return;
	}

	let dataReq = await fetch(MONSTERS_JSON);
	monsters = await dataReq.json();
	$result = document.querySelector('#result');
	$runBtn = document.querySelector('#runBtn');
	$input = document.querySelector('#input');


	$runBtn.addEventListener('click', runPrompt, false);
	$runBtn.disabled = false;
}

async function runPrompt() {
	
	// first, get a random monster
	let monster = monsters[getRandomIntInclusive(0,monsters.length-1)];
	
	$input.value = JSON.stringify(monster,null,'\t');
	$result.innerHTML = '<i>Working...</i>';
	
	if(!session) {
		session = await window.LanguageModel.create({
			initialPrompts: [
				{ role: 'system', content: 'Given a JSON description of an Dungeons and Dragon monster, turn the raw JSON into a paragraph of 4-5 sentences that describes the monster at a high level.' },			
			],
			monitor(m) {
				m.addEventListener("downloadprogress", e => {
					console.log(`Downloaded ${e.loaded * 100}%`);
					/*
                    why this? the download event _always_ runs at
                    least once, so this prevents the msg showing up
                    when its already done. I've seen it report 0 and 1
                    in this case, so we skip both
                    */
					if(e.loaded === 0 || e.loaded === 1) return;
					$result.innerHTML = `Downloading, currently at ${Math.floor(e.loaded * 100)}%`;
				});
			}			
		});
	}

	$runBtn.disabled = true;
	
	// thanks to Thomas Steiner!
	// not sure if we need to clone though...
	let thisSession = await session.clone();
	let result = await thisSession.prompt($input.value);
	$result.innerHTML = result + `<p><img src="https://www.dnd5eapi.co${monster.image}"></p>`;
	$runBtn.disabled = false;
}

function getRandomIntInclusive(min, max) { 
	min = Math.ceil(min); 
	max = Math.floor(max); 
	return Math.floor(Math.random() * (max - min + 1) + min);  
}
```

So outside of variable declarations and stuff, the initial part of the code does the feature detection required and aborts if anything isn't going to work. As a reminder, *generally* I'm recommending Chrome's AI tools in progressive enhancement cases. This demo is an exception as it won't do *anything* without the feature. I could absolutely fall back to a static simple description instead. 

When the button is clicked, I grab one random item, add the JSON to the textarea, and then begin my AI usage. My session sets up a system instruction that clearly defines what it is doing:

```
Given a JSON description of an Dungeons and Dragon monster, turn the raw 
JSON into a paragraph of 4-5 sentences that describes the monster at a 
high level.
```

Which then leaves the prompt to simply taking the JSON and working on it:

```js
let result = await thisSession.prompt($input.value);
```

I then display the result, and as I noticed the API supported images, I go ahead and render it as well. 

## Examples

Ok, so given that most of you probably *can't* run it, here are a few examples. First up, a lovely ancient-blue dragon. Here's the JSON:

<textarea style="width:100%; height: 300px">{
	"index": "ancient-blue-dragon",
	"name": "Ancient Blue Dragon",
	"size": "Gargantuan",
	"type": "dragon",
	"alignment": "lawful evil",
	"armor_class": [
		{
			"type": "natural",
			"value": 22
		}
	],
	"hit_points": 481,
	"hit_dice": "26d20",
	"hit_points_roll": "26d20+208",
	"speed": {
		"walk": "40 ft.",
		"burrow": "40 ft.",
		"fly": "80 ft."
	},
	"strength": 29,
	"dexterity": 10,
	"constitution": 27,
	"intelligence": 18,
	"wisdom": 17,
	"charisma": 21,
	"proficiencies": [
		{
			"value": 7,
			"proficiency": {
				"index": "saving-throw-dex",
				"name": "Saving Throw: DEX",
				"url": "/api/2014/proficiencies/saving-throw-dex"
			}
		},
		{
			"value": 15,
			"proficiency": {
				"index": "saving-throw-con",
				"name": "Saving Throw: CON",
				"url": "/api/2014/proficiencies/saving-throw-con"
			}
		},
		{
			"value": 10,
			"proficiency": {
				"index": "saving-throw-wis",
				"name": "Saving Throw: WIS",
				"url": "/api/2014/proficiencies/saving-throw-wis"
			}
		},
		{
			"value": 12,
			"proficiency": {
				"index": "saving-throw-cha",
				"name": "Saving Throw: CHA",
				"url": "/api/2014/proficiencies/saving-throw-cha"
			}
		},
		{
			"value": 17,
			"proficiency": {
				"index": "skill-perception",
				"name": "Skill: Perception",
				"url": "/api/2014/proficiencies/skill-perception"
			}
		},
		{
			"value": 7,
			"proficiency": {
				"index": "skill-stealth",
				"name": "Skill: Stealth",
				"url": "/api/2014/proficiencies/skill-stealth"
			}
		}
	],
	"damage_vulnerabilities": [],
	"damage_resistances": [],
	"damage_immunities": [
		"lightning"
	],
	"condition_immunities": [],
	"senses": {
		"blindsight": "60 ft.",
		"darkvision": "120 ft.",
		"passive_perception": 27
	},
	"languages": "Common, Draconic",
	"challenge_rating": 23,
	"proficiency_bonus": 7,
	"xp": 50000,
	"special_abilities": [
		{
			"name": "Legendary Resistance",
			"desc": "If the dragon fails a saving throw, it can choose to succeed instead.",
			"usage": {
				"type": "per day",
				"times": 3
			}
		}
	],
	"actions": [
		{
			"name": "Multiattack",
			"multiattack_type": "actions",
			"desc": "The dragon can use its Frightful Presence. It then makes three attacks: one with its bite and two with its claws.",
			"actions": [
				{
					"action_name": "Frightful Presence",
					"count": 1,
					"type": "ability"
				},
				{
					"action_name": "Bite",
					"count": 1,
					"type": "melee"
				},
				{
					"action_name": "Claw",
					"count": 2,
					"type": "melee"
				}
			]
		},
		{
			"name": "Bite",
			"desc": "Melee Weapon Attack: +16 to hit, reach 15 ft., one target. Hit: 20 (2d10 + 9) piercing damage plus 11 (2d10) lightning damage.",
			"attack_bonus": 16,
			"damage": [
				{
					"damage_type": {
						"index": "piercing",
						"name": "Piercing",
						"url": "/api/2014/damage-types/piercing"
					},
					"damage_dice": "2d10+9"
				},
				{
					"damage_type": {
						"index": "lightning",
						"name": "Lightning",
						"url": "/api/2014/damage-types/lightning"
					},
					"damage_dice": "2d10"
				}
			]
		},
		{
			"name": "Claw",
			"desc": "Melee Weapon Attack: +16 to hit, reach 10 ft., one target. Hit: 16 (2d6 + 9) slashing damage.",
			"attack_bonus": 16,
			"damage": [
				{
					"damage_type": {
						"index": "slashing",
						"name": "Slashing",
						"url": "/api/2014/damage-types/slashing"
					},
					"damage_dice": "2d6+9"
				}
			]
		},
		{
			"name": "Tail",
			"desc": "Melee Weapon Attack: +16 to hit, reach 20 ft., one target. Hit: 18 (2d8 + 9) bludgeoning damage.",
			"attack_bonus": 16,
			"damage": [
				{
					"damage_type": {
						"index": "bludgeoning",
						"name": "Bludgeoning",
						"url": "/api/2014/damage-types/bludgeoning"
					},
					"damage_dice": "2d8+9"
				}
			]
		},
		{
			"name": "Frightful Presence",
			"desc": "Each creature of the dragon's choice that is within 120 feet of the dragon and aware of it must succeed on a DC 20 Wisdom saving throw or become frightened for 1 minute. A creature can repeat the saving throw at the end of each of its turns, ending the effect on itself on a success. If a creature's saving throw is successful or the effect ends for it, the creature is immune to the dragon's Frightful Presence for the next 24 hours.",
			"dc": {
				"dc_type": {
					"index": "wis",
					"name": "WIS",
					"url": "/api/2014/ability-scores/wis"
				},
				"dc_value": 20,
				"success_type": "none"
			}
		},
		{
			"name": "Lightning Breath",
			"desc": "The dragon exhales lightning in a 120-foot line that is 10 feet wide. Each creature in that line must make a DC 23 Dexterity saving throw, taking 88 (16d10) lightning damage on a failed save, or half as much damage on a successful one.",
			"usage": {
				"type": "recharge on roll",
				"dice": "1d6",
				"min_value": 5
			},
			"dc": {
				"dc_type": {
					"index": "dex",
					"name": "DEX",
					"url": "/api/2014/ability-scores/dex"
				},
				"dc_value": 23,
				"success_type": "half"
			},
			"damage": [
				{
					"damage_type": {
						"index": "lightning",
						"name": "Lightning",
						"url": "/api/2014/damage-types/lightning"
					},
					"damage_dice": "16d10"
				}
			]
		}
	],
	"legendary_actions": [
		{
			"name": "Detect",
			"desc": "The dragon makes a Wisdom (Perception) check."
		},
		{
			"name": "Tail Attack",
			"desc": "The dragon makes a tail attack."
		},
		{
			"name": "Wing Attack (Costs 2 Actions)",
			"desc": "The dragon beats its wings. Each creature within 15 ft. of the dragon must succeed on a DC 24 Dexterity saving throw or take 16 (2d6 + 9) bludgeoning damage and be knocked prone. The dragon can then fly up to half its flying speed.",
			"dc": {
				"dc_type": {
					"index": "dex",
					"name": "DEX",
					"url": "/api/2014/ability-scores/dex"
				},
				"dc_value": 24,
				"success_type": "none"
			},
			"damage": [
				{
					"damage_type": {
						"index": "bludgeoning",
						"name": "Bludgeoning",
						"url": "/api/2014/damage-types/bludgeoning"
					},
					"damage_dice": "2d6+9"
				}
			]
		}
	],
	"image": "/api/images/monsters/ancient-blue-dragon.png",
	"url": "/api/2014/monsters/ancient-blue-dragon"
}
</textarea>

And here's how Chrome AI described it:

The Ancient Blue Dragon is a gargantuan lawful evil creature known for its immense power and cunning. Possessing a formidable armor class and a massive hit point total of 481, it is a terrifying foe to encounter. This dragon boasts impressive physical capabilities, including a powerful bite, razor-sharp claws, and a devastating lightning breath attack, complemented by legendary resistance to damage. With a challenge rating of 23, it is a truly epic monster, capable of wreaking havoc and instilling fear in all who cross its path, and its innate abilities allow it to control the battlefield with Frightful Presence.

<img src="https://www.dnd5eapi.co/api/images/monsters/ancient-blue-dragon.png" loading="lazy" style="max-width:500px">

And how about something on the completely other side of the fence... a pony.

<textarea style="width:100%; height: 300px">
{
	"index": "pony",
	"name": "Pony",
	"size": "Medium",
	"type": "beast",
	"alignment": "unaligned",
	"armor_class": [
		{
			"type": "dex",
			"value": 10
		}
	],
	"hit_points": 11,
	"hit_dice": "2d8",
	"hit_points_roll": "2d8+2",
	"speed": {
		"walk": "40 ft."
	},
	"strength": 15,
	"dexterity": 10,
	"constitution": 13,
	"intelligence": 2,
	"wisdom": 11,
	"charisma": 7,
	"proficiencies": [],
	"damage_vulnerabilities": [],
	"damage_resistances": [],
	"damage_immunities": [],
	"condition_immunities": [],
	"senses": {
		"passive_perception": 10
	},
	"languages": "",
	"challenge_rating": 0.125,
	"proficiency_bonus": 2,
	"xp": 25,
	"actions": [
		{
			"name": "Hooves",
			"desc": "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 7 (2d4 + 2) bludgeoning damage.",
			"attack_bonus": 4,
			"damage": [
				{
					"damage_type": {
						"index": "bludgeoning",
						"name": "Bludgeoning",
						"url": "/api/2014/damage-types/bludgeoning"
					},
					"damage_dice": "2d4+2"
				}
			]
		}
	],
	"image": "/api/images/monsters/pony.png",
	"url": "/api/2014/monsters/pony"
}
</textarea>

The Pony is a medium-sized beast with an unaligned nature. It possesses a decent strength score of 15 and a speed of 40 feet, making it relatively agile. It has a Challenge Rating of 0.125, suggesting it poses a minor threat. The Pony primarily attacks with its hooves, dealing bludgeoning damage. It has a passive perception of 10, allowing it to notice things around it.

<img src="https://www.dnd5eapi.co/api/images/monsters/pony.png" loading="lazy" style="max-width:500px">

## Try it Yourself

If you want to try it yourself, or see all of the code, you can see the embed below:

<p class="codepen" data-height="500" data-theme-id="dark" data-default-tab="html,result" data-slug-hash="qENrxOE" data-pen-title="DD Monster to Text" data-user="cfjedimaster" style="height: 500px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
      <span>See the Pen <a href="https://codepen.io/cfjedimaster/pen/qENrxOE">
  DD Monster to Text</a> by Raymond Camden (<a href="https://codepen.io/cfjedimaster">@cfjedimaster</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
      </p>
      <script async src="https://public.codepenassets.com/embed/index.js"></script>

Photo by <a href="https://unsplash.com/@procopiopi?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Omar:. Lopez-Rincon</a> on <a href="https://unsplash.com/photos/a-cartoon-vampire-with-pointy-ears-and-a-bow-tie-1CSyvXoeO98?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Unsplash</a>
      