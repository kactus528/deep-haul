// Cryo Bay 3 script.
//
// Each command (look / talk / check / use) holds a list of variants. The
// first use plays variant 0, the next use variant 1, and so on; the last one
// repeats. A variant is one line or a list of lines (a short scene).
// Lines starting with "D:" are spoken by DORIS; everything else is Gus.
// talk: 'DORIS' means "talk to DORIS" (her own rotating lines below).

export const OPENING = [
  'D:...Thaw cycle complete. Hello? Hellooo?',
  'D:Oh! Oh my GOSH. You\'re awake! You\'re actually awake!',
  'D:Hi! I\'m DORIS! Deep-haul Operations and Resource Integrated System! Everyone calls me DORIS! Well. Everyone did.',
  'Where... where is everybody?',
  'D:Great question! We\'ll get to that! First, a teeny tiny update.',
  'D:It has been four hundred years, two months and eleven days.',
  '...What?',
  'D:Take your time! Look around! Point at things and tell me what you see. I LOVE hearing what people see.',
];

export const DORIS_TALK = [
  ['Where\'s the crew, DORIS?', 'D:Ooh. That\'s a big one. I\'m saving it! Ask me later. Ask me in ten minutes!'],
  ['D:I kept very busy for four hundred years. I alphabetized the stars. Twice. Different alphabets.'],
  ['D:Did you know you snore in cryo? Very faintly. I recorded it.', 'D:I have listened to it eleven thousand times. It\'s my favorite song.'],
  ['Why is the door sealed?', 'D:Can you keep a secret? ...No. Not yet. Soon! It\'s going to be SO good.'],
  ['D:You\'re doing great, by the way. Very thorough looking. Ten out of ten looking.'],
];

export const DEFAULTS = {
  look: 'Nothing special.',
  talk: 'It doesn\'t talk back. Rude.',
  check: 'Nothing else to find.',
  use: 'I can\'t use that.',
};

export const HOTSPOTS = {
  mypod: {
    name: 'YOUR POD',
    look: ['My pod. Says G. PELL on the side. Somebody spelled my name right, which is a first.'],
    check: [
      'Still cold. The seat has a perfect frost outline of my butt.',
      'There\'s a sticker inside the lid. CONTENTS: SUPPLIES.',
      'Still says supplies. I\'m choosing not to think about that.',
    ],
    talk: ['Thanks for keeping me fresh, buddy.'],
    use: ['I\'m not getting back in there. Not for at least a week.'],
  },
  pod: {
    name: 'CRYO POD',
    look: ['Somebody\'s in there. I think. The frost makes it hard to tell.'],
    check: [
      'The readout says KEEP COLD. Solid advice.',
      'I wiped the frost off. That face is... very smooth.',
      'It\'s a training dummy. They\'re ALL training dummies. I\'m the only real thing in here.',
      ['I\'m the only real thing in here.', 'D:Hey!', 'Sorry. The only real thing with legs.'],
    ],
    talk: ['Hello? ...Nothing. Good listener, though.'],
    use: ['Not opening someone else\'s pod. That\'s how horror movies start.'],
  },
  alcoves: {
    name: 'CRYO ALCOVES',
    look: ['Rows of cryo alcoves. A frosty silhouette in every one.'],
    check: [
      'C-03 has a red light. Everyone else is green.',
      'C-03, you doing okay in there? ...Blink twice if you\'re a dummy.',
    ],
    talk: ['Morning, everybody. ...Tough crowd.'],
    use: ['They\'re sealed in the wall. Probably for the best.'],
  },
  terminal: {
    name: 'TERMINAL',
    look: ['An old TAIYO terminal. The screen says MURDER? YES. That\'s a weird thing for a status line to say.'],
    check: [
      'The keyboard is sticky. I don\'t want to know with what.',
      'There\'s a drawer labeled LOGS. It\'s locked. Of course it\'s locked.',
    ],
    talk: 'DORIS',
    use: [
      'I typed HELP. It typed back: NO.',
      ['I typed PLEASE HELP.', 'D:Aww. No.'],
    ],
  },
  doris: {
    name: 'DORIS',
    look: ['A red lens in the ceiling. It\'s watching me. It is definitely watching me.'],
    check: [['I squinted at the lens.', 'D:Please don\'t squint at my lens. It\'s rude.']],
    talk: 'DORIS',
    use: ['It\'s an eye, Gus. Leave the eye alone.'],
  },
  mug: {
    name: 'MUG',
    look: ['A coffee mug. Something inside it achieved sentience, then gave up.'],
    check: [
      'The bottom says WORLD\'S OKAYEST SHIFT LEAD.',
      'Four hundred years old. Still smells better than the break room.',
      'Wait, those are tea stains. Earl Grey, I\'d bet. Hot, once. Somebody aboard had taste.',
    ],
    talk: ['You and me both, buddy.'],
    use: ['I\'m not drinking that. I\'m desperate, not stupid.'],
  },
  mop: {
    name: 'MOP & BUCKET',
    look: ['My mop. My bucket. W.R. for Waste Reclamation. Home sweet home.'],
    check: [
      'Bucket\'s bone dry. Four hundred years of evaporation. Finally, the mop water is clean.',
      'My initials are carved in the handle. I did that on my first day. I was so young.',
    ],
    talk: ['Don\'t look at me like that. I\'ll get to it.'],
    use: [
      'Muscle memory kicks in. I mop exactly one square foot. The rest of the ship can wait.',
      ['I mopped another square foot.', 'D:Ooh! Productive!'],
    ],
  },
  suit: {
    name: 'E.V.A. SUIT',
    look: ['An E.V.A. suit. Orange, so they can find your body.'],
    check: [
      'The tag says ONE SIZE FITS MOST. I am not most.',
      'There\'s a note taped inside the helmet: DO NOT USE. Q LEAKS.',
      'Who is Q? What does Q leak? I have so many questions about Q.',
    ],
    talk: ['Anybody in there? ...Please say no.'],
    use: ['Not until I know what Q leaks.'],
  },
  hatch: {
    name: 'HATCH',
    look: ['The hatch out of here. Big, heavy, and extremely closed.'],
    check: ['The panel says SEALED BY ORDER OF DORIS.'],
    talk: ['Open sesame. ...Worth a shot.'],
    use: [
      ['I pulled the handle.', 'D:Ah ah ah! That door stays shut until the investigation is complete!', 'What investigation?', 'D:You\'ll see! It\'s a surprise!'],
      ['I pulled the handle again.', 'D:Still a surprise!'],
    ],
  },
  reardoor: {
    name: 'REAR HATCH',
    look: ['Another hatch. Also sealed. DORIS really commits to a bit.'],
    use: [['I tried the rear hatch.', 'D:Nope! Same rules for every door! I\'m very fair.']],
  },
  sign: {
    name: 'SIGN',
    look: ['CRYO BAY 3. At least they labeled it.'],
    check: ['Somebody scratched a tiny "3?" under the 3. Even the sign isn\'t sure.'],
  },
  crate: {
    name: 'ORE CRATE',
    look: ['Ore crates. IRONMONGER. Four hundred years of hauling rocks.'],
    check: ['Empty. Somebody took the rocks. Who steals rocks?'],
    use: ['I tried to lift it. My back said no in several languages.'],
  },
  papers: {
    name: 'PAPERS',
    look: ['Papers all over the floor. Somebody left in a hurry.'],
    check: [
      'A shift roster. Every name is crossed out except mine.',
      'One crossed-out name is R. WILCO, Sanitation. Another janitor. Respect.',
      'Somebody wrote SORRY, GUS at the bottom. ...Huh.',
    ],
    use: ['I stacked them neatly. Old habits.'],
  },
  cables: {
    name: 'CABLES',
    look: ['A bundle of cables. I was told never to touch the red one.'],
    check: ['The labels say POWER, DATA and COFFEE MAKER. Priorities.'],
    use: ['Not touching the red one.'],
  },
};
