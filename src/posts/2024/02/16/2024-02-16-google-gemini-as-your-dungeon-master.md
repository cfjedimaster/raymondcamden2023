---
layout: post
title: "Google Gemini as Your Dungeon Master"
date: "2024-02-16T18:00:00"
categories: ["javascript"]
tags: ["generative ai"]
banner_image: /images/banners/cats_dd.jpg
permalink: /2024/02/16/google-gemini-as-your-dungeon-master
description: An example of Gemini's file chat support.
---

So this is absolutely just another example of me playing around too much, but I had to share. As I mentioned in my [post](https://www.raymondcamden.com/2024/02/15/google-gemini-15-announced-but-not-yet-released) yesterday, Google's AI Studio now supports uploading files and working with them in your prompt. Today I decided to give the Chat interface a try as I hadn't yet played with it. On a whim, I googled for "dungeons and dragons rules PDF" and... well, you won't believe what happened next. (Sorry, I couldn't resist.)

First off, the most important thing to note if you want to test with PDFs, ensure that they are OCRed. Right now AI Studio does not handle that well, but it should be corrected in the future. My Google search turned up the PDF here, <https://media.wizards.com/2018/dnd/downloads/DnD_BasicRules_2018.pdf>, and I confirmed it was properly OCRed with a very scientific test of trying to select a few words. Note that it's from 2018 and probably a bit out of date, but I figured it was good enough. 

I uploaded the PDF to Gemini and ensured I was using Gemini 1.5. This is important as the size of the PDF (180 pages) means a rather large token size. The UI reports this nicely:

<p>
<img src="https://static.raymondcamden.com/images/2024/02/dd1.jpg" alt="UI reporting 211,690 tokens" class="imgborder imgcenter" loading="lazy">
</p>

For my first test, I simply asked it "what are the attributes of a player character?" Here's what I got:

<div style="background-color: #c0c0c0; padding: 10px">
In Dungeons & Dragons, player characters (PCs) are defined by several key attributes:

1. Race: This determines your character's physical characteristics, ancestry, and innate abilities. Examples include humans, elves, dwarves, halflings, dragonborn, tieflings, etc. Each race has unique traits that affect gameplay.

2. Class: This represents your character's chosen profession and determines their skills, abilities, and progression path. Examples include fighter, wizard, rogue, cleric, bard, etc. Each class has unique features and abilities that define their role in the party.

3. Ability Scores: These six scores represent your character's core physical and mental capabilities: Strength, Dexterity, Constitution, Intelligence, Wisdom, and Charisma. They influence almost every action your character takes, from attacking and defending to interacting with the world and casting spells.

4. Skills: These represent specific areas of expertise your character has developed through training or experience. Examples include Athletics, Acrobatics, Stealth, Perception, Persuasion, Arcana, etc. Skills are tied to ability scores and determine your character's success in various tasks.

5. Background: This details your character's history and past experiences before becoming an adventurer. Examples include soldier, criminal, noble, sage, etc. Backgrounds provide additional skills, proficiencies, and roleplaying hooks.

6. Equipment: This includes weapons, armor, tools, and other items your character carries. Equipment affects your character's capabilities in combat and exploration.

7. Personality and Alignment: These define your character's moral compass, beliefs, and behavior. Alignment is a combination of two factors: morality (good, evil, or neutral) and attitude towards society and order (lawful, chaotic, or neutral).

8. Backstory: This is the narrative of your character's life before the game begins, including their motivations, goals, and relationships. A well-developed backstory adds depth and helps you roleplay your character.

These attributes work together to create a unique and well-rounded character that you can roleplay and guide through adventures in the D&D world.
</div>

I'm pretty rusty in D&D, but that surely seems right! (When I shared this in a chat related to Gemini, William Ito skimmed it said it looks correct for that era - so I'm taking that as another sign it worked well.)

I then asked, "what races are available to player characters?"

<div style="background-color: #c0c0c0; padding: 10px">
The most common player character races in Dungeons & Dragons are:
<p>
Humans: Adaptable and versatile, with no major strengths or weaknesses.<br/>
Elves: Graceful and long-lived, with a natural affinity for magic and a resistance to charm effects. Subraces include High Elves, Wood Elves, and Dark Elves (Drow).<br/>
Dwarves: Stout and hardy, with a resistance to magic and poison, and proficiency in combat and craftsmanship. Subraces include Hill Dwarves and Mountain Dwarves.<br/>
Halflings: Nimble and small, with a natural ability to hide and a resistance to fear. Subraces include Lightfoot Halflings and Stout Halflings.<br/>
<p>
The Player's Handbook also introduces several less common races, including:
<p>
Dragonborn: Proud and draconic humanoids with scales and the ability to breathe fire.<br/>
Tieflings: Demonic descendants with a natural affinity for magic and resistance to fire.<br/>
Gnomes: Inventive and curious small creatures with a natural ability to tinker and a resistance to magic.<br/>
Half-elves: Combining human and elven traits, they are versatile and have a resistance to charm effects.<br/>
Half-orcs: Combining human and orc traits, they are strong and fierce with a resistance to being knocked unconscious.<br/>
<p>
Additionally, some campaign settings and sourcebooks introduce even more exotic races, such as Aasimar, Firbolg, Goliath, Aarakocra, Genasi, and many others. The availability of these races depends on your Dungeon Master and the specific campaign setting you are playing in.
<p>
Remember, the most important factor in choosing a race is to pick one that excites you and fits the character concept you have in mind.
</div>

I have absolutely no clue if those exotic races exist, but I did a quick search on Aasimar and it looks like it certainly does: [Aasimar](https://forgottenrealms.fandom.com/wiki/Aasimar)

Alright, now, at this point, I was impressed. But I thought - why not push my luck?

"Given the rules to create a character, create one with all the required characters and give it a name"

And holy crap - Gemini delivered!

<div style="background-color: #c0c0c0; padding: 10px">
<h3>Character Name: Lyra Swiftfoot</h3>
Race: Lightfoot Halfling<br>
Class: Rogue (Thief)<br>
Background: Entertainer (Dancer)<br>
Alignment: Chaotic Good
<br><br>
Ability Scores: (Using the standard set)

* Strength: 8 (-1)
* Dexterity: 17 (+3)
* Constitution: 14 (+2)
* Intelligence: 13 (+1)
* Wisdom: 12 (+1)
* Charisma: 15 (+2)

Hit Points: 10 (8 + 2 from Constitution modifier)

Proficiencies:

* Armor: Light armor
* Weapons: Simple weapons, hand crossbows, longswords, rapiers, shortswords
* Tools: Thieves' tools, Disguise kit (from background)
* Saving Throws: Dexterity, Intelligence
* Skills: Acrobatics (+5), Perception (+4), Performance (+6), Stealth (+7) (Expertise in Stealth and Performance)

Equipment:

* Rapier
* Shortbow and quiver of 20 arrows
* Leather armor
* Two daggers
* Thieves' tools
* Disguise kit
* Backpack
* Bedroll
* Mess kit
* Tinderbox
* 10 torches
* 10 days of rations
* Waterskin
* 50 feet of hempen rope
* Pouch with 15 gp

Personality Traits:

* I have a quick wit and a fondness for pranks.
* I am fiercely loyal to my friends and always look out for their safety.

Ideal:

* Freedom: Everyone should be free to live their life as they see fit. (Chaotic)

Bond:

*  I will do anything to protect my younger sister, who is the only family I have left.

Flaw:

* I have a weakness for shiny objects and can't resist the urge to steal them, even if it means putting myself at risk.

Backstory: Lyra grew up on the streets, using her nimbleness and charm to survive. She learned to dance for coins and honed her skills in stealth and deception to pilfer from unsuspecting onlookers. After her sister was kidnapped by slavers, Lyra vowed to do whatever it takes to find and rescue her, even if it means venturing into the darkest corners of the world.

This is just a basic example, and you can further customize Lyra by adding details to her appearance, personality, and backstory. You can also choose different skills, proficiencies, or equipment based on your preferences and the campaign setting.
</div>

By the way, the formatting above is a bit off, but that came from me copying and pasting from Gemini and being a bit lazy on sprucing it up. I figured I'd push my luck and try again:

"do that again please"

<div style="background-color: #c0c0c0; padding: 10px">
<h3>Character Name: Falion Sunstrider</h3>

Race: High Elf<br>
Class: Wizard (Evocation)<br>
Background: Sage (Researcher)<br>
Alignment: Neutral Good<br>
<br><br>
Ability Scores: (Using the standard set)

* Strength: 8 (-1)
* Dexterity: 14 (+2)
* Constitution: 13 (+1)
* Intelligence: 17 (+3)
* Wisdom: 12 (+1)
* Charisma: 10 (+0)

Hit Points: 8 (6 + 1 from Constitution modifier)

Proficiencies:

* Weapons: Daggers, darts, slings, quarterstaffs, light crossbows
* Tools: None
* Saving Throws: Intelligence, Wisdom
* Skills: Arcana (+6), History (+6), Investigation (+4) (Expertise in Arcana and History)

Equipment:

* Quarterstaff
* Arcane focus (crystal)
* Scholar's pack
* Spellbook with six 1st-level wizard spells (Burning Hands, Charm Person, Detect Magic, Mage Armor, Magic Missile, Shield)
* Backpack
* Bedroll
* Mess kit
* Tinderbox
* 10 torches
* 10 days of rations
* Waterskin
* 50 feet of hempen rope
* Pouch with 10 gp

Personality Traits:

* I am deeply curious about the world and always eager to learn new things.
* I am absent-minded and often lost in my own thoughts.

Ideal:

* Knowledge: The path to power and self-improvement is through knowledge. (Neutral)

Bond:

* I am searching for the lost library of a legendary archmage, rumored to contain powerful spells and forgotten lore.

Flaw:

* I am overconfident in my abilities and sometimes underestimate the dangers I face.

Backstory: Falion spent his youth studying in a prestigious academy of magic, quickly surpassing his peers with his thirst for knowledge and natural talent for evocation magic. After hearing rumors of a lost library containing powerful spells and forgotten lore, Falion set out on a journey to find it, hoping to unlock its secrets and further his magical abilities.

This is just a basic example, and you can further customize Falion by adding details to his appearance, personality, and backstory. You can also choose different skills, proficiencies, or equipment based on your preferences and the campaign setting.
</div>

So at this point, I was blown away. Like, I don't even care if it broke any particular D&D rules, that was just fun. But... yeah, I pushed my luck *one* ... *last* ... *time* ...

"of the two characters you just made, who do you think would be a better party leader?"

<div style="background-color: #c0c0c0; padding: 10px">
Between Lyra Swiftfoot and Falion Sunstrider, Lyra would likely be the better party leader for several reasons:

1. **Charisma**: Lyra has a higher Charisma score, which is important for inspiring and motivating others. Her background as an entertainer also suggests she is comfortable in front of crowds and skilled at interacting with people.

2. **Skills**: Lyra's skillset is more suited to leadership. Her expertise in Persuasion and Deception allows her to negotiate effectively and navigate social situations, while her proficiency in Perception and Stealth makes her a good scout and strategist.

3. **Personality**: Lyra's personality traits suggest she is quick-witted and loyal, both valuable qualities in a leader. Her flaw, while potentially problematic, can be mitigated by her other strengths and the support of her party.

4. **Class**: While wizards can be powerful, their focus on spellcasting and relative lack of social skills often makes them less effective leaders.

Falion, on the other hand, excels in knowledge and magical power, making him a valuable asset to the party in terms of strategy and information gathering. However, his lower Charisma and lack of social skills might hinder his ability to effectively lead and inspire others. Additionally, his absent-mindedness and overconfidence could lead to poor decisions in critical situations.

Of course, the effectiveness of a party leader also depends on the specific campaign setting, the party composition, and the players' roleplaying preferences. In some situations, Falion's knowledge and magical prowess might be more valuable than Lyra's social skills. Ultimately, the best party leader is the one that the players and the Dungeon Master agree upon and who can effectively guide the party through their adventures.
</div>

My god. That's just... perfect. And honestly, it feels like the right choice for the right reasons. 

Anyway, this isn't necessarily a deep look at this particular feature, but it was so fun I had to share!