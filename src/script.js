// Cryo Bay 3 script.
//
// Each command (look / talk / check / use) holds a list of variants. The
// first use plays variant 0, the next use variant 1, and so on; the last one
// repeats. A variant is one line or a list of lines (a short scene).
// Speakers: "D:" DORIS, "V:" VENDO-9, "P:" Pockets, "L:" LIBRA,
// "C:" a CASE FILE entry; anything else is Gus. talk: 'DORIS' means "talk to DORIS" (rotating lines below).
// A command can also be a function (flags, n) => lines, for story logic.
// Action lines run instantly when reached:
//   @set:flag   @goto:room or @goto:room:yaw   @screen:mode   @lamp:on
//   @end:chapter:TITLE:PASSWORD

export const OPENING = [
  'D:...Thaw cycle complete. Hello? Hellooo?',
  'D:Oh! Oh my GOSH. You\'re awake! You\'re actually awake!',
  'D:Hi! I\'m DORIS! Deep-haul Operations and Resource Integrated System! Everyone calls me DORIS! Well. Everyone did.',
  'Where... where is everybody?',
  'D:Great question! We\'ll get to that! First, a teeny tiny update.',
  'D:It has been four hundred years, two months and eleven days.',
  '...What?',
  'D:Take your time! Look around! Point at things and tell me what you see. I LOVE hearing what people see.',
  'D:Oh, and the hatch is open! Stretch your legs. The mess hall is just down the corridor.',
  'D:Everything else is locked. For reasons! Fun reasons!',
];

export const DORIS_TALK = [
  ['Where\'s the crew, DORIS?', 'D:Ooh. That\'s a big one. I\'m saving it! Ask me later. Ask me in ten minutes!'],
  ['D:I kept very busy for four hundred years. I alphabetized the stars. Twice. Different alphabets.'],
  ['D:Did you know you snore in cryo? Very faintly. I recorded it.', 'D:I have listened to it eleven thousand times. It\'s my favorite song.'],
  ['Why is everything locked, DORIS?', 'D:Can you keep a secret? ...No. Not yet. Soon! It\'s going to be SO good.'],
  ['D:You\'re doing great, by the way. Very thorough looking. Ten out of ten looking.'],
];

// DORIS's story beats: checked before her small talk whenever you talk to her.
export function DORIS_STORY(f) {
  if (f.libraMet && !f.dorisCompliment)
    return [
      'DORIS, what do you think of LIBRA?',
      'D:LIBRA? The library computer? Oh, LIBRA\'s sweet. A little intense. Writes me poems in the index.',
      'D:Tell LIBRA its indexing is... thorough. People like thorough, right?',
      'I\'ll pass it on.',
      '@set:dorisCompliment',
    ];
  if (f.ch1done && !f.fuse && !f.lampOn && f.sawLamp)
    return ['Any idea where a grow lamp fuse would be, DORIS?', 'D:Hmm! Somebody needed a lot of power on that last night. A LOT. For something hot. And brown. And delicious.'];
  return null;
}

// Chapter 2 wraps up once both witnesses have talked.
const CH2_END = [
  'D:Two whole witnesses! You\'re a natural, Gus!',
  'D:And now... the moment I\'ve waited four hundred years for.',
  'What moment?',
  'D:A FUNERAL! Find something black. And a hanky. Mostly for me.',
  '@set:ch2done',
  '@end:2:WITNESSES:POCKETS-ON-A-WHEEL',
];
const maybeEnd2 = (f, other) => (f[other] ? CH2_END : []);

export const DEFAULTS = {
  look: 'Nothing special.',
  talk: 'It doesn\'t talk back. Rude.',
  check: 'Nothing else to find.',
  use: 'I can\'t use that.',
  move: 'I can\'t go that way.',
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
    look: ['The hatch out of here. Open, finally. DORIS must be in a generous mood.'],
    check: ['Somebody scratched a tally on the frame. Four hundred and some marks, then they just stop.'],
    talk: ['Open sesame. ...Oh. It already is.'],
    use: [['I head out into the corridor.', '@goto:corridor']],
    move: [['I head out into the corridor.', '@goto:corridor']],
  },
  reardoor: {
    name: 'REAR HATCH',
    look: ['Another hatch. Sealed. DORIS really commits to a bit.'],
    use: [['I tried the rear hatch.', 'D:Not that one! That one goes to the boring parts.']],
    move: [['I tried the rear hatch.', 'D:Not that one! That one goes to the boring parts.']],
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

  // ===================================================================
  // Deck 2 corridor
  // ===================================================================
  cryodoor: {
    name: 'CRYO BAY 3',
    look: ['Back to Cryo Bay 3. My frosty little home.'],
    use: [['@goto:cryo:180']],
    move: [['@goto:cryo:180']],
  },
  messdoor: {
    name: 'MESS HALL',
    look: ['MESS HALL, says the sign. My stomach just stood up.'],
    use: [['@goto:mess']],
    move: [['@goto:mess']],
  },
  door_pike: {
    name: 'D. PIKE',
    look: ['D. PIKE, COMPLIANCE. My old compliance officer. Two hundred and twelve write-ups. I counted.'],
    check: [
      'A laminated sign: KNOCK, THEN WAIT, THEN KNOCK AGAIN, THEN LEAVE.',
      'Locked, of course. Pike locked everything. He once locked a sandwich.',
    ],
    talk: ['Hey, Pike. ...No answer. Best conversation we ever had.'],
    use: ['Locked. Probably with a form attached.'],
    move: ['Locked. Probably with a form attached.'],
  },
  door_shay: {
    name: 'N. SHAY',
    look: ['N. SHAY, HAULAGE. Nico. My old shift partner. Best guy on this whole ship.'],
    check: [
      'Somebody scratched a word into the paint, down low: SORRY.',
      'Same handwriting as the note on the floor of the cryo bay. ...Nico?',
    ],
    talk: ['Nico? You in there, buddy? ...Nico?'],
    use: ['Locked. Nico never locked anything. Weird.'],
    move: ['Locked. Nico never locked anything. Weird.'],
  },
  door_thorne: {
    name: 'CAPTAIN',
    look: ['A. THORNE, CAPTAIN. Even the door looks dignified.'],
    check: [
      'Locked. It smells faintly of tea.',
      'The knocker is a little brass theatre mask. Of course it is.',
    ],
    talk: [['Captain? ...Sir?', 'D:He\'s not in, Gus. He hasn\'t been in for a very long time.']],
    use: ['I\'m not barging into the captain\'s quarters. I have some manners.'],
    move: ['I\'m not barging into the captain\'s quarters. I have some manners.'],
  },
  door_leeks: {
    name: 'Q. LEEKS',
    look: ['Q. LEEKS, SUPPLY.'],
    check: [
      'Q. Leeks. ...Q. LEEKS.',
      'Oh! It\'s not "Q leaks." It\'s Q LEEKS! The suit is fine! Q is just a guy!',
      'Sorry, Q. I said some things about you in my head.',
    ],
    talk: ['Q? Big fan. Sorry about the assumptions.'],
    use: ['Locked. Q takes supply security seriously.'],
    move: ['Locked. Q takes supply security seriously.'],
  },
  window: {
    name: 'WINDOW',
    look: ['Stars. A lot of them. None of them look familiar.'],
    check: [
      'Four hundred years and the stars still don\'t care.',
      ['D:I alphabetized those!', 'Which alphabet?', 'D:The second one.'],
    ],
    use: ['It doesn\'t open. Good. Space is out there.'],
  },
  notice: {
    name: 'NOTICE BOARD',
    look: ['A notice board. DAYS SINCE LAST INCIDENT: 0.'],
    check: [
      'Somebody kept that number updated. For four hundred years.',
      ['D:Accuracy matters!', 'What was the incident?', 'D:Every day is an incident when you\'re alone, Gus.', '...That got dark fast.'],
      'There\'s a flyer for a crew talent night. "Featuring THE CAPTAIN, reading Shakespeare. Attendance mandatory."',
    ],
    use: ['I straightened the flyers. Old habits.'],
  },

  // ===================================================================
  // Mess hall
  // ===================================================================
  messexit: {
    name: 'CORRIDOR',
    look: ['Back out to the corridor.'],
    use: [['@goto:corridor:180']],
    move: [['@goto:corridor:180']],
  },
  tables: {
    name: 'TABLES',
    look: ['Mess tables. Trays still on them. Everyone left mid-loaf.'],
    check: (f, n) => {
      if (n === 0) return ['I checked under the table. Gum. Very old gum. Fossil gum.'];
      if (n === 1) return ['Under another table: a spoon. No. A fork. A spork? A sporf.'];
      if (!f.coin) return ['Under the last table... a COIN! An actual coin! I\'m rich!', 'C:ITEM: ONE COIN.', '@set:coin'];
      return ['Nothing else under there. Just me, lying on the floor, thinking about my choices.'];
    },
    talk: ['Anybody saving this seat? ...Great.'],
    use: ['I sat down. Nobody joined me. Just like old times.'],
  },
  vendo: {
    name: 'VENDO-9',
    look: ['VENDO-9. A vending machine with a face. The face is smiling. The smile is... a lot.'],
    check: [
      'One button is worn smooth: TEA, EARL GREY, HOT. Somebody ordered that every single day.',
      'There\'s a dent in the front at exactly forehead height. Somebody really needed a coffee.',
      'There\'s a coin slot. VENDO-9 watched me look at it. It knows.',
    ],
    talk: (f, n) => {
      if (!f.coinGiven) {
        if (n === 0) return [
          'V:WELCOME TO VENDO-9! INSERT COIN FOR CONVERSATION.',
          'You\'re a vending machine.',
          'V:I AM A CHEF. WHO HAPPENS TO VEND. COIN, PLEASE.',
        ];
        return ['V:COIN, PLEASE. I DO NOT TALK FOR FREE. I HAVE STANDARDS.'];
      }
      if (!f.clue) return [
        'V:A WITNESS? I SAW EVERYTHING. WELL. I SAW THIS ROOM.',
        'V:ON THE LAST NIGHT, I SOLD THREE HUNDRED AND TWELVE COFFEES. IN ONE HOUR.',
        'Three hundred and twelve? There were only two hundred and twelve crew.',
        'V:SOMEONE WAS VERY THIRSTY. OR VERY SCARED.',
        'C:CLUE: 312 COFFEES SOLD IN ONE HOUR ON THE LAST NIGHT. ONLY 212 CREW ABOARD.',
        '@set:clue',
        '@screen:doris',
        'D:Ooh, a clue! Next, more witnesses. I\'ve unlocked the library, and the hydroponics situation. Be polite. They bite.',
        '@set:ch1done',
        '@end:1:THAW:PELL-0312-HAUL',
      ];
      return [
        ['V:TODAY\'S SPECIAL IS LOAF.', 'What was yesterday\'s special?', 'V:LOAF. I AM VERY CONSISTENT.'],
        ['V:I HAVE NOT BEEN RESTOCKED IN FOUR HUNDRED YEARS. EVERYTHING IS VINTAGE NOW.'],
        ['V:THE CAPTAIN ALWAYS SAID GOOD MORNING TO ME. EVEN ON BAD MORNINGS. ESPECIALLY THEN.'],
      ][(((n - 1) % 3) + 3) % 3];
    },
    use: (f) => {
      if (!f.coin) return ['I don\'t have any money. Four hundred years and I\'m still broke.'];
      if (!f.coinGiven) return [
        'I put in my only coin.',
        'V:THANK YOU! CONVERSATION UNLOCKED. TODAY\'S SPECIAL: LOAF.',
        'V:IT HAS BEEN FOUR HUNDRED YEARS SINCE ANYONE ORDERED. I HAVE SO MUCH TO SAY.',
        '@set:coinGiven',
        '@screen:doris',
        'D:ATTENTION! ATTENTION, GUS PELL! Sorry, is this too loud? I\'m using the BIG screen!',
        'D:Four hundred years ago, the entire crew of the Ironmonger vanished without a trace.',
        'D:It was MURDER.',
        '...Was it?',
        'D:It was MURDER! And YOU are going to solve it! Navigation stays locked until you name the killer!',
        'I\'m a janitor.',
        'D:And I\'m a freight computer! We all have to grow! Start with the witnesses!',
        '@set:announced',
      ];
      return ['I already gave it my only coin. We\'re in a relationship now.'];
    },
  },
  screen: {
    name: 'BIG SCREEN',
    look: ['A big screen over the counter. Today\'s menu: LOAF.'],
    check: ['The menu hasn\'t changed in four hundred years. Neither has the loaf, I bet.'],
    talk: 'DORIS',
  },
  plaque: {
    name: 'MEMORIAL',
    look: ['A brass plaque. CAPTAIN ALDOUS THORNE. Under his name: "Our revels now are ended."'],
    check: [
      'There\'s a tea ring on the shelf below it. Somebody kept bringing him tea. Even after.',
      ['D:He said goodnight to me. Every night, for thirty years.', 'D:Nobody else ever thought to. ...Anyway! Murders!'],
    ],
    talk: ['Rest easy, Captain.'],
    use: ['I straightened it. Seemed like the right thing to do.'],
  },
  counter: {
    name: 'COUNTER',
    look: ['The serving counter. A sign says LOAF. Every day was loaf.'],
    check: ['Behind the counter: an industrial loaf mold. It\'s the size of a coffin. I\'m not thinking about that.'],
    use: ['I rang the little bell. Nobody came. Nobody has come for four hundred years.'],
  },
  urn: {
    name: 'COFFEE URN',
    look: ['The big coffee urn. Somebody named it JOE.'],
    check: (f) => {
      if (f.ch1done && !f.fuse)
        return [
          'I shook JOE. Something rattles in the power box.',
          'A fuse. Model F-7. Somebody pulled it from the grow lamp to run the coffee urn all night.',
          'C:ITEM: FUSE (F-7). CLUE: SOMEBODY NEEDED COFFEE MORE THAN THE PLANTS NEEDED LIGHT.',
          '@set:fuse',
        ];
      if (f.fuse) return ['Just JOE now. Fuseless and free.'];
      return ['Bone dry. Drained to the last drop. Somebody was REALLY up late.'];
    },
    use: ['Nothing comes out but a sad little cough.'],
  },
  hydro: {
    name: 'HYDROPONICS',
    look: ['HYDROPONICS. There are plants growing out from under the door.'],
    check: [
      'I can hear squeaking in there. A lot of squeaking.',
      'Those scratch marks on the door are big. Bigger than plants make.',
    ],
    talk: ['Hello? ...Did that squeak just sound smug?'],
    use: (f, n) => {
      if (!f.ch1done) return ['I tried the door.', 'D:Not yet! Let\'s save the hydroponics situation for later. It\'s a lot.'];
      if (!f.hydroVisited)
        return [
          'I open the hydroponics door. Warm, wet air rolls out. It smells like a salad that has seen things.',
          'D:Go on in. Remember: they\'re witnesses, not snacks. Either direction.',
          '@set:hydroVisited',
          '@goto:hydro',
        ];
      return ['@goto:hydro'];
    },
  },
  poster: {
    name: 'POSTER',
    look: ['A poster: EAT. HAUL. SLEEP. Company motivational art.'],
    check: ['Somebody added a fourth word in pen, very small: REPEAT.'],
  },

  librarydoor: {
    name: 'LIBRARY',
    look: ['LIBRARY. READING ROOM. There\'s a book return slot. It\'s full.'],
    check: ['A sign on the door: PLEASE SPEAK SOFTLY. LIBRA IS SENSITIVE.'],
    use: (f) => (f.ch1done ? ['@goto:library'] : ['Locked. A sign says: CLOSED FOR INVENTORY. SINCE FOREVER.']),
  },

  // ===================================================================
  // Hydroponics
  // ===================================================================
  hydroexit: {
    name: 'MESS HALL',
    look: ['Back to the mess hall. Where things are dry and nothing squeaks.'],
    use: [['@goto:mess:90']],
  },
  racks: {
    name: 'GROW RACKS',
    look: ['Grow racks, gone completely wild. Four hundred years of tomatoes.'],
    check: [
      'Evolution had four hundred years in here and went with tomatoes. Bold choice.',
      'Some of the tomatoes have bite marks. Neat little hamster-sized bite marks. Lots of them.',
    ],
    use: ['I picked a tomato. Every hamster in the room went silent. I put the tomato back.'],
  },
  colony: {
    name: 'HAMSTERS',
    look: (f) =>
      f.lampOn
        ? ['The hamsters are bowing to me. In unison. It\'s deeply unsettling and also kind of nice.']
        : ['Hamsters. Big ones. Bigger than hamsters should be. Their eyes glow in the dark. They\'re all staring at me.'],
    check: (f) =>
      f.lampOn
        ? ['One of them is offering me a tomato. I accept. We are bonded now.']
        : ['They keep pointing their little paws toward the door. Toward the mess hall. Toward... the coffee urn?'],
    talk: (f) =>
      f.lampOn ? ['Hello, my people. ...I am not doing that bit again.'] : ['Hi, little guys. ...They squeaked in harmony. Is that a hymn?', 'D:It\'s a hymn.'],
    use: ['I\'m not picking one up. They have a union. I can tell.'],
  },
  shrine: {
    name: 'SHRINE',
    look: ['A shrine built from food trays, right under the dead lamp. Offerings piled on top.'],
    check: [
      'Bottle caps, a watch, a spoon, a crew badge... the badge has initials: N.S.',
      'N.S. Nico Shay. What\'s Nico\'s badge doing in a hamster shrine?',
    ],
    use: ['I reached for the badge. Forty hamsters hissed at once. I un-reached.'],
  },
  lamp: {
    name: 'GROW LAMP',
    look: (f) => (f.lampOn ? ['The grow lamp, blazing away. The jungle looks thrilled.'] : ['A huge grow lamp. Dead. The hamsters built a whole shrine under it.', '@set:sawLamp']),
    check: (f) =>
      f.lampOn
        ? ['Humming nicely. I fixed something. Write that down, Pike.']
        : ['The fuse socket is empty. Model F-7. Somebody pulled it out on purpose.', '@set:sawLamp'],
    use: (f) => {
      if (f.lampOn) return ['It\'s already on. I\'m not touching it again. I have a reputation now.'];
      if (!f.fuse) return ['The socket needs an F-7 fuse. I don\'t have one.', '@set:sawLamp'];
      return [
        'I slot the fuse into the socket.',
        '@lamp:on',
        '@set:lampOn',
        'The grow lamp roars to life. Every hamster in the room turns toward me.',
        'They\'re... bowing. They\'re all bowing.',
        'D:Oh no. You\'re their god now. That\'s going to be a whole thing.',
        'P:Hmph. Show-off.',
        'Who said that?',
        'P:Over here, by the tomatoes. The handsome one. Obviously.',
      ];
    },
    talk: ['Thanks for the light, buddy.'],
  },
  pockets: {
    name: 'POCKETS',
    look: ['A hamster. A person-sized hamster in a tablecloth cape and a bottle-cap crown. He looks very pleased with himself.'],
    check: [
      'His cheeks are bulging. Something in there is shiny.',
      'He\'s reading a technical manual. Upside down. ...Wait. He just turned a page. He\'s actually reading it.',
      'The manual is called ADVANCED REACTOR COOLANT SYSTEMS. He\'s on chapter nine. I didn\'t get past the cover.',
    ],
    talk: (f, n) => {
      if (!f.metPockets)
        return [
          'P:So. You\'re the Big Clumsy One who sleeps in the cold box.',
          'I\'m Gus.',
          'P:I am Pockets. LORD Pockets, if you\'re nasty. Admire my fur. Go on.',
          'It\'s... very shiny.',
          'P:I KNOW.',
          '@set:metPockets',
        ];
      if (!f.crewRan)
        return [
          'Pockets, do you know what happened to the crew?',
          'P:The Big Ones? They ran. In the night. Alarms going WOOP WOOP WOOP.',
          'P:Ran ran ran. Toward the back of the ship. Like the wheel, but sad.',
          'They ran? Nobody got murdered?',
          'P:Murdered? Ha. Nobody was murdered. Except the tomatoes. By me.',
          'C:CLUE: THE CREW RAN TOWARD THE BACK OF THE SHIP DURING AN ALARM.',
          '@set:crewRan',
          ...maybeEnd2(f, 'logEdited'),
        ];
      if (!f.badge)
        return [
          'What\'s in your cheeks, Pockets?',
          'P:Treasures. Treasures are for the beautiful.',
          'Your fur really is... magnificent.',
          'P:...Fine. Flattery works on me. It\'s my one weakness. Besides naps. And tomatoes.',
          'P:Here. A Big One dropped it while running. It is only slightly damp.',
          'C:ITEM: CREW BADGE, "N. SHAY". SLIGHTLY DAMP.',
          '@set:badge',
          'Nico\'s badge. Nico was running too.',
        ];
      return [
        ['P:Is it nap time? It feels like nap time. It\'s always nap time.'],
        ['P:I could have fixed that lamp myself, you know. I simply chose not to.'],
        ['P:The colony thinks you\'re a god. Don\'t let it go to your head. I\'m the god. You\'re more of a... priest.'],
        ['P:The coolant readings in this ship are all wrong, by the way. Not that anyone asks the hamster.'],
      ][n % 4];
    },
    use: ['I scratched behind his ears. He pretended to hate it for about one second.'],
  },

  // ===================================================================
  // Library
  // ===================================================================
  libexit: {
    name: 'CORRIDOR',
    look: ['Back out to the corridor.'],
    use: [['@goto:corridor:-90']],
  },
  libra: {
    name: 'LIBRA',
    look: ['LIBRA, the library terminal. Amber screen, round glasses, permanently blushing.'],
    check: [
      'There\'s a sticker on the side: LIBRA <3 DORIS. Somebody scratched it off. Somebody else put it back.',
      'A slot labeled POETRY SUBMISSIONS. It\'s full. They\'re all addressed to DORIS.',
    ],
    talk: (f, n) => {
      if (!f.libraMet)
        return [
          'L:Oh! A visitor! Welcome to the library. Please keep your voice down. Not for the books. For me. I\'m shy.',
          'Hi. I need the crew records from the last night.',
          'L:The records are restricted. Reading club members only.',
          'How do I join the reading club?',
          'L:Well... um... does DORIS ever... mention me? At all? Ever?',
          'I could ask her. That pneumatic tube probably goes straight to DORIS. Everything does.',
          '@set:libraMet',
        ];
      if (!f.dorisCompliment) return ['L:Has DORIS said anything? About me? No pressure. Enormous pressure.', 'I could ask her. That pneumatic tube probably goes straight to DORIS. Everything does.'];
      if (!f.logEdited)
        return [
          'DORIS says your indexing is... very thorough.',
          'L:She said THOROUGH? About MY indexing?',
          'L:I need to sit down. I don\'t have legs. I\'m sitting down emotionally.',
          'L:Welcome to the reading club! Here\'s the final log entry from the last night.',
          'L:LOG, 02:10. COOLANT ALARM. ALL HANDS TO LIFEBOAT BAY. CRYO BAY 3 CARGO TO BE...',
          'L:...the rest has been edited. That\'s strange. Only DORIS can edit the logs.',
          'C:CLUE: THE LAST LOG ENTRY WAS EDITED BY DORIS.',
          '@set:logEdited',
          ...maybeEnd2(f, 'crewRan'),
        ];
      return [
        ['L:Please tell DORIS I said hi. Casually. Not like I asked you to.'],
        ['L:I\'ve read every book aboard four hundred times. The ending of the cookbook still gets me.'],
        ['L:Do you think DORIS likes sonnets? I have nine thousand. Ready to go.'],
      ][n % 3];
    },
    use: ['I tapped the keyboard. LIBRA giggled. I stopped.'],
  },
  shelves: {
    name: 'DATA TAPES',
    look: ['Shelves and shelves of data tapes. Every subject. Mostly loaf.'],
    check: [
      'LOAF: A HISTORY. LOAF: THE SEQUEL. LOAF AND ITS DISCONTENTS.',
      'One shelf is just DORIS\'s name, labeled on hundreds of tapes, in LIBRA\'s handwriting. Sweet. Concerning.',
    ],
    use: ['I pulled a tape at random. "Regulations, Volume 212, by D. Pike." I put it back with great speed.'],
  },
  catalog: {
    name: 'CARD CATALOG',
    look: ['An honest-to-goodness card catalog. On a spaceship. Somebody loved this place.'],
    check: [
      'A card: THE TEMPEST, annotated by A. Thorne. Checked out four hundred years ago. Never returned.',
      'The due date is stamped in very neat, very dignified handwriting. He meant to bring it back.',
    ],
    use: ['I flipped through the cards. It\'s weirdly soothing.'],
  },
  readdesk: {
    name: 'READING DESK',
    look: ['A reading desk with a little green lamp and an open book.'],
    check: ['The book is open to a page about cryo pods. Someone underlined: "may be logged as cargo in an emergency."'],
    use: ['I sat at the desk for a minute. Just a minute. It was nice.'],
  },
  silence: {
    name: 'SIGN',
    look: ['SILENCE PLEASE. Underneath, smaller: "or else."'],
  },
  tube: {
    name: 'PNEUMATIC TUBE',
    look: ['A pneumatic tube for sending tapes around the ship.'],
    check: ['I put my ear to it. It whooshes. Just whooshes. Forever.'],
    talk: 'DORIS',
    use: ['I sent a note down the tube: HELLO? It came back with SHHH written on it.'],
  },
};
