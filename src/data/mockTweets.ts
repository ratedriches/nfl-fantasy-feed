export interface Tweet {
  id: string;
  authorName: string;
  authorHandle: string;
  authorOutlet: string;
  content: string;
  timestamp: string;
  likes: number;
  retweets: number;
  replies: number;
}

const now = new Date();
const minutesAgo = (m: number) => new Date(now.getTime() - m * 60 * 1000).toISOString();
const hoursAgo = (h: number) => minutesAgo(h * 60);
const daysAgo = (d: number) => hoursAgo(d * 24);

export const mockTweetsByTeam: Record<string, Tweet[]> = {
  "arizona-cardinals": [
    { id: "ari-1", authorName: "Darren Urban", authorHandle: "Cardschatter", authorOutlet: "AZCardinals.com", content: "Marvin Harrison Jr. is day-to-day with a hamstring tweak. Coach says he should be fine for Sunday. Don't panic fantasy managers.", timestamp: minutesAgo(22), likes: 312, retweets: 87, replies: 44 },
    { id: "ari-2", authorName: "Josh Weinfuss", authorHandle: "jweinfuss", authorOutlet: "ESPN", content: "Kyler Murray looking sharp in practice today. The new offensive scheme has him moving more in the pocket. Big year potential.", timestamp: hoursAgo(2), likes: 528, retweets: 134, replies: 61 },
    { id: "ari-3", authorName: "Tyler Drake", authorHandle: "Tdrake4tds", authorOutlet: "AZCardinals.com", content: "James Conner back at full practice. No limitations. Lock him in your lineups.", timestamp: hoursAgo(5), likes: 744, retweets: 211, replies: 93 },
    { id: "ari-4", authorName: "Darren Urban", authorHandle: "Cardschatter", authorOutlet: "AZCardinals.com", content: "Cardinals working on red zone concepts today. Trey McBride seeing a lot of targets from Kyler in team drills.", timestamp: hoursAgo(9), likes: 289, retweets: 76, replies: 38 },
    { id: "ari-5", authorName: "Josh Weinfuss", authorHandle: "jweinfuss", authorOutlet: "ESPN", content: "Source: Cardinals exploring options at WR2 before the deadline. Don't be surprised if there's a move this week.", timestamp: daysAgo(1), likes: 1204, retweets: 445, replies: 187 },
  ],
  "atlanta-falcons": [
    { id: "atl-1", authorName: "Tori McElhaney", authorHandle: "tori_mcelhaney", authorOutlet: "AtlantaFalcons.com", content: "Drake London listed as limited today with a knee issue. Something to watch heading into the week.", timestamp: minutesAgo(45), likes: 418, retweets: 122, replies: 67 },
    { id: "atl-2", authorName: "D. Orlando Ledbetter", authorHandle: "DOrlandoAJC", authorOutlet: "Atlanta Journal-Constitution", content: "Bijan Robinson is the bell cow and the coaching staff is making that crystal clear. Heavy workload expected moving forward.", timestamp: hoursAgo(3), likes: 932, retweets: 278, replies: 114 },
    { id: "atl-3", authorName: "Marc Raimondi", authorHandle: "marcraimondi", authorOutlet: "ESPN", content: "Kirk Cousins working through the new playbook and looking comfortable. The deep ball to London in 7-on-7 was a thing of beauty.", timestamp: hoursAgo(6), likes: 611, retweets: 163, replies: 72 },
    { id: "atl-4", authorName: "Tori McElhaney", authorHandle: "tori_mcelhaney", authorOutlet: "AtlantaFalcons.com", content: "Kyle Pitts doing extra routes after practice. His chemistry with Cousins is building. Sleeper alert for the second half.", timestamp: hoursAgo(11), likes: 776, retweets: 234, replies: 98 },
    { id: "atl-5", authorName: "D. Orlando Ledbetter", authorHandle: "DOrlandoAJC", authorOutlet: "Atlanta Journal-Constitution", content: "Falcons defense had a rough day in practice. Expect high scoring output from the offense this Sunday.", timestamp: daysAgo(1), likes: 523, retweets: 148, replies: 59 },
  ],
  "baltimore-ravens": [
    { id: "bal-1", authorName: "Jeff Zrebiec", authorHandle: "jeffzrebiec", authorOutlet: "The Athletic", content: "Lamar Jackson practicing fully. No injury designation expected. He's a must-start at full health.", timestamp: minutesAgo(15), likes: 1847, retweets: 612, replies: 203 },
    { id: "bal-2", authorName: "Jonas Shaffer", authorHandle: "jonas_shaffer", authorOutlet: "Baltimore Banner", content: "Mark Andrews back at practice for the first time since Week 3. This is huge. They've missed him badly in the red zone.", timestamp: hoursAgo(1), likes: 2103, retweets: 734, replies: 289 },
    { id: "bal-3", authorName: "Jamison Hensley", authorHandle: "jamisonhensley", authorOutlet: "ESPN", content: "Derrick Henry workload has been exceptional. Ravens leaning on him even more with the passing game clicking.", timestamp: hoursAgo(4), likes: 891, retweets: 267, replies: 108 },
    { id: "bal-4", authorName: "Jeff Zrebiec", authorHandle: "jeffzrebiec", authorOutlet: "The Athletic", content: "Ravens ran 68 plays in practice today, a season high. Harbaugh emphasizing pace. Fantasy point upside is real.", timestamp: hoursAgo(8), likes: 654, retweets: 189, replies: 77 },
    { id: "bal-5", authorName: "Jonas Shaffer", authorHandle: "jonas_shaffer", authorOutlet: "Baltimore Banner", content: "Zay Flowers quiet in practice today. Don't read into it too much — he was fine physically, just a slow day.", timestamp: daysAgo(1), likes: 437, retweets: 112, replies: 54 },
  ],
  "buffalo-bills": [
    { id: "buf-1", authorName: "Joe Buscaglia", authorHandle: "JoeBuscaglia", authorOutlet: "The Athletic", content: "Josh Allen looked incredible today. New wrinkle in the run game where he's pulling the ball more. Already a cheat code.", timestamp: minutesAgo(33), likes: 2214, retweets: 789, replies: 312 },
    { id: "buf-2", authorName: "Matt Parrino", authorHandle: "MattParrino", authorOutlet: "NYup.com", content: "Stefon Diggs replacement Khalil Shakir having a breakout camp. Could see 6-8 targets per game in this offense.", timestamp: hoursAgo(2), likes: 1432, retweets: 487, replies: 198 },
    { id: "buf-3", authorName: "Alaina Getzenberg", authorHandle: "agetzenberg", authorOutlet: "ESPN", content: "James Cook looking explosive. Bills OC says he'll be used even more in the passing game this year. PPR gold.", timestamp: hoursAgo(5), likes: 1087, retweets: 334, replies: 143 },
    { id: "buf-4", authorName: "Joe Buscaglia", authorHandle: "JoeBuscaglia", authorOutlet: "The Athletic", content: "Dawson Knox took every first-team rep today. Healthy and motivated. Bills TE situation is looking up.", timestamp: hoursAgo(10), likes: 567, retweets: 156, replies: 63 },
    { id: "buf-5", authorName: "Matt Parrino", authorHandle: "MattParrino", authorOutlet: "NYup.com", content: "Bills put in another two-minute drill session. Allen was 11-of-12. This offense is going to be something special.", timestamp: daysAgo(1), likes: 889, retweets: 267, replies: 112 },
  ],
  "carolina-panthers": [
    { id: "car-1", authorName: "Joe Person", authorHandle: "josephperson", authorOutlet: "The Athletic", content: "Bryce Young taking first-team reps all week. Coaching staff fully committed. His confidence is noticeably higher.", timestamp: minutesAgo(50), likes: 723, retweets: 198, replies: 87 },
    { id: "car-2", authorName: "Jonathan Jones", authorHandle: "jjones9", authorOutlet: "CBS Sports", content: "Diontae Johnson chemistry with Young developing. Three touchdowns in red zone drills this week.", timestamp: hoursAgo(3), likes: 544, retweets: 143, replies: 62 },
    { id: "car-3", authorName: "Max Henson", authorHandle: "PanthersMax", authorOutlet: "Panthers.com", content: "Miles Sanders limited today with a calf concern. Chuba Hubbard getting extra reps with the ones. Flex consideration.", timestamp: hoursAgo(6), likes: 612, retweets: 178, replies: 79 },
    { id: "car-4", authorName: "Joe Person", authorHandle: "josephperson", authorOutlet: "The Athletic", content: "Panthers D-line looking stout in camp. Could keep scores low in divisional matchups. Adjust RB expectations.", timestamp: hoursAgo(12), likes: 378, retweets: 98, replies: 44 },
    { id: "car-5", authorName: "Jonathan Jones", authorHandle: "jjones9", authorOutlet: "CBS Sports", content: "Adam Thielen is healthy and the veteran presence is clearly helping the young WR room. Don't sleep on him.", timestamp: daysAgo(1), likes: 487, retweets: 134, replies: 58 },
  ],
  "chicago-bears": [
    { id: "chi-1", authorName: "Brad Biggs", authorHandle: "BradBiggs", authorOutlet: "Chicago Tribune", content: "Caleb Williams working exclusively with DJ Moore and Keenan Allen today. The connection with Moore is special to watch.", timestamp: minutesAgo(18), likes: 1654, retweets: 512, replies: 214 },
    { id: "chi-2", authorName: "Adam Jahns", authorHandle: "adamjahns", authorOutlet: "The Athletic", content: "DJ Moore looking like a bonafide WR1 in this system. Targets are going to be massive. Don't draft anyone else from this team first.", timestamp: hoursAgo(2), likes: 987, retweets: 312, replies: 134 },
    { id: "chi-3", authorName: "Courtney Cronin", authorHandle: "CourtneyRCronin", authorOutlet: "ESPN", content: "Keenan Allen practicing fully with no limitations. The Bears have one of the most talented receiving corps in the NFC.", timestamp: hoursAgo(5), likes: 743, retweets: 221, replies: 96 },
    { id: "chi-4", authorName: "Brad Biggs", authorHandle: "BradBiggs", authorOutlet: "Chicago Tribune", content: "D'Andre Swift back at practice after missing two days. Doesn't appear serious. Should play Sunday barring setback.", timestamp: hoursAgo(9), likes: 891, retweets: 278, replies: 118 },
    { id: "chi-5", authorName: "Adam Jahns", authorHandle: "adamjahns", authorOutlet: "The Athletic", content: "Caleb Williams making some truly jaw-dropping throws in 1-on-1s today. Generational talent is not an overstatement.", timestamp: daysAgo(1), likes: 2341, retweets: 876, replies: 345 },
  ],
  "cincinnati-bengals": [
    { id: "cin-1", authorName: "Tyler Dragon", authorHandle: "TheTylerDragon", authorOutlet: "Cincinnati Enquirer", content: "Joe Burrow back at full practice. No limitations. He looks like himself again after last year's injury.", timestamp: minutesAgo(28), likes: 2187, retweets: 743, replies: 298 },
    { id: "cin-2", authorName: "Jay Morrison", authorHandle: "JayMorrisonATH", authorOutlet: "The Athletic", content: "Ja'Marr Chase demands a double team on every snap. When he doesn't get it, he's unstoppable. Premium WR1.", timestamp: hoursAgo(1), likes: 1876, retweets: 634, replies: 251 },
    { id: "cin-3", authorName: "Ben Baby", authorHandle: "Ben_Baby", authorOutlet: "ESPN", content: "Tee Higgins reported to camp on time, contract situation resolved. Full participant today. Sneaky WR2 value.", timestamp: hoursAgo(4), likes: 1432, retweets: 489, replies: 203 },
    { id: "cin-4", authorName: "Tyler Dragon", authorHandle: "TheTylerDragon", authorOutlet: "Cincinnati Enquirer", content: "Joe Mixon-replacement Zack Moss having a quiet camp. Chase Brown flashing as the handcuff to know.", timestamp: hoursAgo(8), likes: 543, retweets: 167, replies: 72 },
    { id: "cin-5", authorName: "Jay Morrison", authorHandle: "JayMorrisonATH", authorOutlet: "The Athletic", content: "Bengals OL looking much improved with the new additions. Burrow's clean pockets mean big stat lines ahead.", timestamp: daysAgo(1), likes: 1098, retweets: 356, replies: 147 },
  ],
  "cleveland-browns": [
    { id: "cle-1", authorName: "Mary Kay Cabot", authorHandle: "MaryKayCabot", authorOutlet: "Cleveland.com", content: "Deshaun Watson cleared for full practice. He's been throwing darts all week. Big bounce-back season incoming.", timestamp: minutesAgo(40), likes: 876, retweets: 234, replies: 112 },
    { id: "cle-2", authorName: "Dan Labbe", authorHandle: "dan_labbe", authorOutlet: "Cleveland.com", content: "Jerome Ford taking all the first-team RB reps. Nick Chubb's recovery timeline still uncertain. Ford is a league winner.", timestamp: hoursAgo(2), likes: 1243, retweets: 412, replies: 178 },
    { id: "cle-3", authorName: "Jake Trotter", authorHandle: "Jake_Trotter", authorOutlet: "ESPN", content: "Amari Cooper doing individual drills but still not in team sessions. Injury designation likely for Sunday.", timestamp: hoursAgo(5), likes: 654, retweets: 198, replies: 87 },
    { id: "cle-4", authorName: "Mary Kay Cabot", authorHandle: "MaryKayCabot", authorOutlet: "Cleveland.com", content: "David Njoku is Watson's security blanket and it shows in every practice. TE1 value in 12-team leagues easily.", timestamp: hoursAgo(10), likes: 534, retweets: 156, replies: 69 },
    { id: "cle-5", authorName: "Dan Labbe", authorHandle: "dan_labbe", authorOutlet: "Cleveland.com", content: "Browns defense installing new blitz packages. Their own offense could see shorter fields this year. Plus for all Browns skill players.", timestamp: daysAgo(1), likes: 412, retweets: 119, replies: 53 },
  ],
  "dallas-cowboys": [
    { id: "dal-1", authorName: "Clarence Hill Jr.", authorHandle: "clarencehilljr", authorOutlet: "Fort Worth Star-Telegram", content: "Dak Prescott throwing with no limitations. Cowboys offense is going to be electric this season.", timestamp: minutesAgo(12), likes: 1543, retweets: 489, replies: 198 },
    { id: "dal-2", authorName: "Todd Archer", authorHandle: "toddarcher", authorOutlet: "ESPN", content: "CeeDee Lamb practicing at 100%. He's mad about his contract and playing like it. Could be a monster year.", timestamp: hoursAgo(2), likes: 2234, retweets: 789, replies: 312 },
    { id: "dal-3", authorName: "Calvin Watkins", authorHandle: "calvinwatkins", authorOutlet: "Dallas Morning News", content: "Tony Pollard replacement Ezekiel Elliott back with the Cowboys, taking early reps. Don't overreact — it's a committee.", timestamp: hoursAgo(4), likes: 987, retweets: 312, replies: 143 },
    { id: "dal-4", authorName: "Clarence Hill Jr.", authorHandle: "clarencehilljr", authorOutlet: "Fort Worth Star-Telegram", content: "Jake Ferguson getting heavily targeted in red zone drills. The Cowboys TE situation is underrated for fantasy.", timestamp: hoursAgo(9), likes: 678, retweets: 201, replies: 88 },
    { id: "dal-5", authorName: "Todd Archer", authorHandle: "toddarcher", authorOutlet: "ESPN", content: "Cowboys OL fully healthy for the first time in two years. Dak's gonna have all day to throw. Massive fantasy upside.", timestamp: daysAgo(1), likes: 1456, retweets: 512, replies: 224 },
  ],
  "denver-broncos": [
    { id: "den-1", authorName: "Mike Klis", authorHandle: "mikeklis", authorOutlet: "9NEWS Denver", content: "Bo Nix looking like a different QB in year two. The timing with receivers is razor sharp. Fringe QB2 in deep leagues.", timestamp: minutesAgo(35), likes: 876, retweets: 245, replies: 109 },
    { id: "den-2", authorName: "Troy Renck", authorHandle: "TroyRenck", authorOutlet: "Denver7", content: "Javonte Williams back to full health and dominating practice. His cuts look pre-injury. RB2 floor with upside.", timestamp: hoursAgo(2), likes: 1123, retweets: 378, replies: 156 },
    { id: "den-3", authorName: "Jeff Legwold", authorHandle: "Jeff_Legwold", authorOutlet: "ESPN", content: "Courtland Sutton is Bo Nix's clear No. 1. Heavy targets in camp. Buy the connection.", timestamp: hoursAgo(6), likes: 754, retweets: 223, replies: 97 },
    { id: "den-4", authorName: "Mike Klis", authorHandle: "mikeklis", authorOutlet: "9NEWS Denver", content: "Broncos running a faster pace on offense this year. More snaps, more opportunities. Positive for all skill positions.", timestamp: hoursAgo(11), likes: 543, retweets: 167, replies: 71 },
    { id: "den-5", authorName: "Troy Renck", authorHandle: "TroyRenck", authorOutlet: "Denver7", content: "Jerry Jeudy gone, but the role is up for grabs. Josh Reynolds flashing in his absence. Potential late-round dart throw.", timestamp: daysAgo(1), likes: 432, retweets: 134, replies: 59 },
  ],
  "detroit-lions": [
    { id: "det-1", authorName: "Chris Burke", authorHandle: "ChrisBurkeNFL", authorOutlet: "The Athletic", content: "Jared Goff completing 75%+ in camp. Lions offense is a well-oiled machine. Every skill player has value.", timestamp: minutesAgo(20), likes: 1234, retweets: 412, replies: 167 },
    { id: "det-2", authorName: "Tim Twentyman", authorHandle: "ttwentyman", authorOutlet: "DetroitLions.com", content: "Amon-Ra St. Brown lined up in slot on every rep. 130+ target pace if this keeps up. Elite WR1.", timestamp: hoursAgo(1), likes: 2341, retweets: 812, replies: 334 },
    { id: "det-3", authorName: "Eric Woodyard", authorHandle: "E_Woodyard", authorOutlet: "ESPN", content: "David Montgomery and Jahmyr Gibbs both looking great. It's a true committee — draft both if you can get the value.", timestamp: hoursAgo(4), likes: 1087, retweets: 356, replies: 145 },
    { id: "det-4", authorName: "Chris Burke", authorHandle: "ChrisBurkeNFL", authorOutlet: "The Athletic", content: "Sam LaPorta developing into a legitimate safety valve. TE streamers, take note. Huge role in this offense.", timestamp: hoursAgo(7), likes: 876, retweets: 267, replies: 112 },
    { id: "det-5", authorName: "Tim Twentyman", authorHandle: "ttwentyman", authorOutlet: "DetroitLions.com", content: "Dan Campbell gave the team a day off after strong work. They'll come back fresh Thursday. No injury concerns.", timestamp: daysAgo(1), likes: 654, retweets: 189, replies: 78 },
  ],
  "green-bay-packers": [
    { id: "gb-1", authorName: "Rob Demovsky", authorHandle: "RobDemovsky", authorOutlet: "ESPN", content: "Jordan Love healthy and throwing a beautiful deep ball. Packers OC has schemed up some nasty things for him this year.", timestamp: minutesAgo(25), likes: 1123, retweets: 378, replies: 156 },
    { id: "gb-2", authorName: "Tom Silverstein", authorHandle: "TomSilverstein", authorOutlet: "Milwaukee Journal Sentinel", content: "Christian Watson finally healthy for a full camp. This is the year he breaks out. WR sleeper of the year candidate.", timestamp: hoursAgo(2), likes: 987, retweets: 312, replies: 134 },
    { id: "gb-3", authorName: "Matt Schneidman", authorHandle: "mattschneidman", authorOutlet: "The Athletic", content: "Romeo Doubs getting plenty of 1-on-1 reps. Solid WR2 in PPR formats if Watson misses time.", timestamp: hoursAgo(5), likes: 543, retweets: 167, replies: 72 },
    { id: "gb-4", authorName: "Rob Demovsky", authorHandle: "RobDemovsky", authorOutlet: "ESPN", content: "Josh Jacobs being used as a receiver more than expected. Packers love his pass-pro and hands. PPR darling.", timestamp: hoursAgo(9), likes: 1234, retweets: 412, replies: 178 },
    { id: "gb-5", authorName: "Tom Silverstein", authorHandle: "TomSilverstein", authorOutlet: "Milwaukee Journal Sentinel", content: "Packers doing no-huddle work all week. Love's IQ for this system is exceptional. QBs with pace are fantasy gold.", timestamp: daysAgo(1), likes: 765, retweets: 234, replies: 98 },
  ],
  "houston-texans": [
    { id: "hou-1", authorName: "Aaron Wilson", authorHandle: "AaronWilson_NFL", authorOutlet: "KPRC 2", content: "C.J. Stroud looks like a veteran in his second year. Full command of the offense. Top-5 QB ceiling.", timestamp: minutesAgo(30), likes: 1654, retweets: 534, replies: 221 },
    { id: "hou-2", authorName: "DJ Bien-Aime", authorHandle: "Djbienaime", authorOutlet: "ESPN", content: "Tank Dell back on the field, catching everything in sight. The Texans receiving corps is elite if healthy.", timestamp: hoursAgo(2), likes: 1234, retweets: 412, replies: 178 },
    { id: "hou-3", authorName: "Mark Berman", authorHandle: "MarkBermanFox26", authorOutlet: "Fox 26 Houston", content: "Stefon Diggs targeting heavily in red zone drills. Massive TD upside for the veteran wideout.", timestamp: hoursAgo(5), likes: 876, retweets: 267, replies: 112 },
    { id: "hou-4", authorName: "Aaron Wilson", authorHandle: "AaronWilson_NFL", authorOutlet: "KPRC 2", content: "Dameon Pierce working with the backup unit. Joe Mixon the clear RB1. Don't bother rostering Pierce.", timestamp: hoursAgo(10), likes: 765, retweets: 234, replies: 98 },
    { id: "hou-5", authorName: "DJ Bien-Aime", authorHandle: "Djbienaime", authorOutlet: "ESPN", content: "Nico Collins having a quietly excellent camp. Could be the sneaky target hog when Diggs draws safety coverage.", timestamp: daysAgo(1), likes: 987, retweets: 312, replies: 134 },
  ],
  "indianapolis-colts": [
    { id: "ind-1", authorName: "Zak Keefer", authorHandle: "zkeefer", authorOutlet: "The Athletic", content: "Anthony Richardson is a problem. His rushing ability alone makes him a fantasy weapon. High-upside QB2.", timestamp: minutesAgo(42), likes: 1432, retweets: 478, replies: 198 },
    { id: "ind-2", authorName: "Joel Erickson", authorHandle: "JoelAErickson", authorOutlet: "Indianapolis Star", content: "Jonathan Taylor back and looking motivated. He wants to prove the trade talk was disrespectful. RB1 performance incoming.", timestamp: hoursAgo(2), likes: 2103, retweets: 712, replies: 289 },
    { id: "ind-3", authorName: "Stephen Holder", authorHandle: "HolderStephen", authorOutlet: "ESPN", content: "Michael Pittman Jr. taking all the WR1 reps. His floor is rock solid, ceiling keeps rising with AR15.", timestamp: hoursAgo(6), likes: 876, retweets: 267, replies: 112 },
    { id: "ind-4", authorName: "Zak Keefer", authorHandle: "zkeefer", authorOutlet: "The Athletic", content: "Mo Alie-Cox staying healthy and involved. Don't overlook the tight end position for Indy this season.", timestamp: hoursAgo(11), likes: 432, retweets: 134, replies: 58 },
    { id: "ind-5", authorName: "Joel Erickson", authorHandle: "JoelAErickson", authorOutlet: "Indianapolis Star", content: "Colts adding new RPO concepts specifically designed for Richardson. His dual-threat potential is off the charts.", timestamp: daysAgo(1), likes: 1123, retweets: 378, replies: 156 },
  ],
  "jacksonville-jaguars": [
    { id: "jax-1", authorName: "John Oehser", authorHandle: "johnOehser", authorOutlet: "Jaguars.com", content: "Trevor Lawrence healthy and full go. He's got a chip on his shoulder after last season's struggles.", timestamp: minutesAgo(55), likes: 876, retweets: 256, replies: 109 },
    { id: "jax-2", authorName: "Mia O'Brien", authorHandle: "MiaOBrienTV", authorOutlet: "Action News Jax", content: "Calvin Ridley looked explosive in 1-on-1s. His separation ability is back to pre-suspension form. Buy him.", timestamp: hoursAgo(3), likes: 1234, retweets: 412, replies: 178 },
    { id: "jax-3", authorName: "Michael DiRocco", authorHandle: "ESPNdirocco", authorOutlet: "ESPN", content: "Travis Etienne taking all RB1 reps. His pass-catching ability is elite. One of the best RBs in fantasy.", timestamp: hoursAgo(6), likes: 1543, retweets: 512, replies: 214 },
    { id: "jax-4", authorName: "John Oehser", authorHandle: "johnOehser", authorOutlet: "Jaguars.com", content: "Evan Engram healthy and being used all over the formation. TE1 value in all formats.", timestamp: hoursAgo(12), likes: 654, retweets: 198, replies: 84 },
    { id: "jax-5", authorName: "Mia O'Brien", authorHandle: "MiaOBrienTV", authorOutlet: "Action News Jax", content: "Jaguars installing up-tempo offense. Expect more plays per game. Fantasy upside across the board.", timestamp: daysAgo(1), likes: 543, retweets: 167, replies: 71 },
  ],
  "kansas-city-chiefs": [
    { id: "kc-1", authorName: "Adam Teicher", authorHandle: "adamteicher", authorOutlet: "ESPN", content: "Patrick Mahomes in mid-season form already. Running through progressions faster than ever. It's actually scary.", timestamp: minutesAgo(10), likes: 3421, retweets: 1234, replies: 512 },
    { id: "kc-2", authorName: "BJ Kissel", authorHandle: "ChiefsReporter", authorOutlet: "Chiefs.com", content: "Travis Kelce working through some soreness but practiced fully. No concern at all going forward. He'll be fine.", timestamp: hoursAgo(1), likes: 4123, retweets: 1543, replies: 634 },
    { id: "kc-3", authorName: "Herbie Teope", authorHandle: "HerbieTeope", authorOutlet: "Kansas City Star", content: "Rashee Rice's route running is elite after his offseason work. Mahomes clearly trusts him as WR1.", timestamp: hoursAgo(4), likes: 1876, retweets: 634, replies: 267 },
    { id: "kc-4", authorName: "Adam Teicher", authorHandle: "adamteicher", authorOutlet: "ESPN", content: "Isiah Pacheco getting the lion's share of RB touches. His tackle-breaking ability is special. RB2 floor.", timestamp: hoursAgo(8), likes: 1234, retweets: 412, replies: 178 },
    { id: "kc-5", authorName: "BJ Kissel", authorHandle: "ChiefsReporter", authorOutlet: "Chiefs.com", content: "Chiefs offense working on new 2-TE sets with Kelce and Noah Gray. Could diversify how defenses scheme against them.", timestamp: daysAgo(1), likes: 987, retweets: 312, replies: 134 },
  ],
  "las-vegas-raiders": [
    { id: "lv-1", authorName: "Vic Tafur", authorHandle: "VicTafur", authorOutlet: "The Athletic", content: "Gardner Minshew or bust for Vegas. He's been steady in practice but this offense needs more. Manage expectations.", timestamp: minutesAgo(38), likes: 543, retweets: 167, replies: 72 },
    { id: "lv-2", authorName: "Vincent Bonsignore", authorHandle: "VinnyBonsignore", authorOutlet: "Las Vegas Review-Journal", content: "Davante Adams hinting at dissatisfaction with the offense. This situation needs monitoring for fantasy purposes.", timestamp: hoursAgo(2), likes: 1234, retweets: 412, replies: 198 },
    { id: "lv-3", authorName: "Paul Gutierrez", authorHandle: "PGutierrezESPN", authorOutlet: "ESPN", content: "Josh Jacobs gone — Alexander Mattison expected to be the lead back. Solid RB2 in a run-heavy scheme.", timestamp: hoursAgo(5), likes: 876, retweets: 267, replies: 112 },
    { id: "lv-4", authorName: "Vic Tafur", authorHandle: "VicTafur", authorOutlet: "The Athletic", content: "Michael Mayer quietly having a strong camp. Tight end streamers, there's something here.", timestamp: hoursAgo(10), likes: 432, retweets: 134, replies: 58 },
    { id: "lv-5", authorName: "Vincent Bonsignore", authorHandle: "VinnyBonsignore", authorOutlet: "Las Vegas Review-Journal", content: "Raiders defense installing new scheme under new DC. Opponents could score points on them. Think about streaming Raiders opponents.", timestamp: daysAgo(1), likes: 654, retweets: 198, replies: 84 },
  ],
  "los-angeles-chargers": [
    { id: "lac-1", authorName: "Gilbert Manzano", authorHandle: "gilbertmanzano", authorOutlet: "Orange County Register", content: "Justin Herbert back at full go after offseason surgery. The arm strength is all the way back.", timestamp: minutesAgo(22), likes: 1543, retweets: 512, replies: 214 },
    { id: "lac-2", authorName: "Daniel Popper", authorHandle: "danielrpopper", authorOutlet: "The Athletic", content: "Keenan Allen gone — Quentin Johnston and Jalen Guyton battling for WR1. Johnston looking like the winner.", timestamp: hoursAgo(2), likes: 876, retweets: 267, replies: 112 },
    { id: "lac-3", authorName: "Shelley Smith", authorHandle: "shelleysmith98", authorOutlet: "ESPN", content: "J.K. Dobbins healthy and taking full reps. If he stays healthy, he's a top-15 RB. Big if, but real upside.", timestamp: hoursAgo(5), likes: 1234, retweets: 412, replies: 178 },
    { id: "lac-4", authorName: "Gilbert Manzano", authorHandle: "gilbertmanzano", authorOutlet: "Orange County Register", content: "Gerald Everett back in the fold and Herbert loves throwing to TEs. Stream-worthy in favorable matchups.", timestamp: hoursAgo(9), likes: 543, retweets: 167, replies: 71 },
    { id: "lac-5", authorName: "Daniel Popper", authorHandle: "danielrpopper", authorOutlet: "The Athletic", content: "New OC Jim Harbaugh running a run-first offense but Herbert's passing talent is too good to ignore. Balance expected.", timestamp: daysAgo(1), likes: 987, retweets: 312, replies: 134 },
  ],
  "los-angeles-rams": [
    { id: "lar-1", authorName: "Gary Klein", authorHandle: "LATimesklein", authorOutlet: "LA Times", content: "Matthew Stafford looking sharp and healthy. McVay's offense with a healthy Stafford is dangerous.", timestamp: minutesAgo(45), likes: 1123, retweets: 378, replies: 156 },
    { id: "lar-2", authorName: "Stu Jackson", authorHandle: "StuJacksonRams", authorOutlet: "Rams.com", content: "Cooper Kupp cleared all medical checks and is practicing fully. When healthy, he's a WR1 in any format.", timestamp: hoursAgo(1), likes: 2341, retweets: 812, replies: 334 },
    { id: "lar-3", authorName: "Sarah Barshop", authorHandle: "sarahbarshop", authorOutlet: "ESPN", content: "Puka Nacua had another monster practice. His rookie numbers were no fluke. Legit WR2 this year.", timestamp: hoursAgo(4), likes: 1654, retweets: 556, replies: 231 },
    { id: "lar-4", authorName: "Gary Klein", authorHandle: "LATimesklein", authorOutlet: "LA Times", content: "Kyren Williams working as the featured back in McVay's system. Efficient runner, good hands. Reliable RB2.", timestamp: hoursAgo(8), likes: 876, retweets: 267, replies: 112 },
    { id: "lar-5", authorName: "Stu Jackson", authorHandle: "StuJacksonRams", authorOutlet: "Rams.com", content: "Tyler Higbee healthy and back in his usual TE1 role. Steady floor of 4-5 catches in this offense.", timestamp: daysAgo(1), likes: 654, retweets: 198, replies: 84 },
  ],
  "miami-dolphins": [
    { id: "mia-1", authorName: "Barry Jackson", authorHandle: "flasportsbuzz", authorOutlet: "Miami Herald", content: "Tua Tagovailoa cleared from concussion protocol and is full-go. McDaniel's offense is ready to explode.", timestamp: minutesAgo(15), likes: 1876, retweets: 634, replies: 267 },
    { id: "mia-2", authorName: "Cameron Wolfe", authorHandle: "CameronWolfe", authorOutlet: "ESPN", content: "Tyreek Hill is locked in. Offseason trade demands settled. He's going to go off this year. WR1 of the year candidate.", timestamp: hoursAgo(2), likes: 3234, retweets: 1123, replies: 456 },
    { id: "mia-3", authorName: "Joe Schad", authorHandle: "schadjoe", authorOutlet: "Palm Beach Post", content: "Jaylen Waddle healthy and working as the WR2. The Dolphins have two top-15 WRs. Don't overlook Waddle.", timestamp: hoursAgo(5), likes: 1543, retweets: 512, replies: 214 },
    { id: "mia-4", authorName: "Barry Jackson", authorHandle: "flasportsbuzz", authorOutlet: "Miami Herald", content: "De'Von Achane is the most electric player on this roster. When healthy, he's a top-5 RB. Draft him early.", timestamp: hoursAgo(10), likes: 2103, retweets: 712, replies: 289 },
    { id: "mia-5", authorName: "Cameron Wolfe", authorHandle: "CameronWolfe", authorOutlet: "ESPN", content: "Durham Smythe role is minimal but reliable. Don't expect big fantasy numbers from Dolphins TEs.", timestamp: daysAgo(1), likes: 432, retweets: 134, replies: 58 },
  ],
  "minnesota-vikings": [
    { id: "min-1", authorName: "Ben Goessling", authorHandle: "BenGoessling", authorOutlet: "Minneapolis Star Tribune", content: "Sam Darnold playing the best football of his career. Kevin O'Connell's system is perfect for him.", timestamp: minutesAgo(30), likes: 876, retweets: 267, replies: 112 },
    { id: "min-2", authorName: "Chad Graff", authorHandle: "ChadGraff", authorOutlet: "The Athletic", content: "Justin Jefferson in prime form. He's going to have a revenge-game season after last year's injury. WR1 overall candidate.", timestamp: hoursAgo(1), likes: 3421, retweets: 1234, replies: 512 },
    { id: "min-3", authorName: "Kevin Seifert", authorHandle: "SeifertESPN", authorOutlet: "ESPN", content: "Jordan Addison building on his rookie season. The Vikings have two legit WR options. Addison is a WR3 with upside.", timestamp: hoursAgo(4), likes: 987, retweets: 312, replies: 134 },
    { id: "min-4", authorName: "Ben Goessling", authorHandle: "BenGoessling", authorOutlet: "Minneapolis Star Tribune", content: "Aaron Jones running with urgency knowing this could be his last big contract year. RB2 with real upside.", timestamp: hoursAgo(8), likes: 1234, retweets: 412, replies: 178 },
    { id: "min-5", authorName: "Chad Graff", authorHandle: "ChadGraff", authorOutlet: "The Athletic", content: "T.J. Hockenson's recovery timeline unclear. Josh Oliver getting TE1 reps in his absence. Dart throw if Hockenson misses time.", timestamp: daysAgo(1), likes: 765, retweets: 234, replies: 98 },
  ],
  "new-england-patriots": [
    { id: "ne-1", authorName: "Karen Guregian", authorHandle: "KGuregian", authorOutlet: "Boston Herald", content: "Drake Maye taking all first-team reps. He's the future and the present. Upside QB2 in 2-QB and SF leagues.", timestamp: minutesAgo(48), likes: 1234, retweets: 412, replies: 178 },
    { id: "ne-2", authorName: "Phil Perry", authorHandle: "PhilAPerry", authorOutlet: "NBC Sports Boston", content: "Rhamondre Stevenson running hard and healthy. He'll carry a significant workload in Jerod Mayo's offense.", timestamp: hoursAgo(3), likes: 876, retweets: 267, replies: 112 },
    { id: "ne-3", authorName: "Mike Reiss", authorHandle: "MikeReiss", authorOutlet: "ESPN", content: "JuJu Smith-Schuster signing brings an experienced target to help Maye. WR3 floor with some upside.", timestamp: hoursAgo(6), likes: 654, retweets: 198, replies: 84 },
    { id: "ne-4", authorName: "Karen Guregian", authorHandle: "KGuregian", authorOutlet: "Boston Herald", content: "Kendrick Bourne healthy and excited about Maye. The Patriots WR room is young and raw — temper expectations.", timestamp: hoursAgo(12), likes: 432, retweets: 134, replies: 58 },
    { id: "ne-5", authorName: "Phil Perry", authorHandle: "PhilAPerry", authorOutlet: "NBC Sports Boston", content: "Hunter Henry the veteran stabilizer at TE. Maye will trust him in key situations. Streaming TE option.", timestamp: daysAgo(1), likes: 543, retweets: 167, replies: 71 },
  ],
  "new-orleans-saints": [
    { id: "no-1", authorName: "Katherine Terrell", authorHandle: "Kat_Terrell", authorOutlet: "ESPN", content: "Derek Carr healthy and running the first-team offense. Saints are installing a more aggressive downfield scheme.", timestamp: minutesAgo(25), likes: 765, retweets: 234, replies: 98 },
    { id: "no-2", authorName: "Jeff Duncan", authorHandle: "JeffDuncanTimes", authorOutlet: "New Orleans Times-Picayune", content: "Chris Olave looking like one of the top WRs in the NFC. He's a target hog in this offense. WR1 in waiting.", timestamp: hoursAgo(2), likes: 1234, retweets: 412, replies: 178 },
    { id: "no-3", authorName: "Luke Johnson", authorHandle: "ByLukeJohnson", authorOutlet: "New Orleans Times-Picayune", content: "Alvin Kamara running like vintage Kamara. He's the heart of this offense. RB1 production in this system.", timestamp: hoursAgo(5), likes: 1543, retweets: 512, replies: 214 },
    { id: "no-4", authorName: "Katherine Terrell", authorHandle: "Kat_Terrell", authorOutlet: "ESPN", content: "Rashid Shaheed getting targets in the slot. Sneaky PPR option in deeper leagues. Watch the snap count.", timestamp: hoursAgo(10), likes: 654, retweets: 198, replies: 84 },
    { id: "no-5", authorName: "Jeff Duncan", authorHandle: "JeffDuncanTimes", authorOutlet: "New Orleans Times-Picayune", content: "Foster Moreau healthy at TE. The Saints TE position is low-ceiling but Moreau could surprise in the red zone.", timestamp: daysAgo(1), likes: 432, retweets: 134, replies: 58 },
  ],
  "new-york-giants": [
    { id: "nyg-1", authorName: "Jordan Raanan", authorHandle: "JordanRaanan", authorOutlet: "ESPN", content: "Daniel Jones cleared all tests and taking first-team reps. The Giants are fully committed to their investment.", timestamp: minutesAgo(37), likes: 987, retweets: 312, replies: 134 },
    { id: "nyg-2", authorName: "Dan Duggan", authorHandle: "DDuggan21", authorOutlet: "The Athletic", content: "Saquon Barkley gone — Devin Singletary getting all the early RB1 looks. Could be a sneaky late-round grab.", timestamp: hoursAgo(2), likes: 1234, retweets: 412, replies: 178 },
    { id: "nyg-3", authorName: "Art Stapleton", authorHandle: "art_stapleton", authorOutlet: "NorthJersey.com", content: "Darren Waller practicing but on a pitch count. When healthy, he's a top-5 TE. Track his weekly status carefully.", timestamp: hoursAgo(5), likes: 876, retweets: 267, replies: 112 },
    { id: "nyg-4", authorName: "Jordan Raanan", authorHandle: "JordanRaanan", authorOutlet: "ESPN", content: "Jalin Hyatt flashing as a deep threat. The Giants need a WR1 to emerge. Hyatt is the early front-runner.", timestamp: hoursAgo(11), likes: 654, retweets: 198, replies: 84 },
    { id: "nyg-5", authorName: "Dan Duggan", authorHandle: "DDuggan21", authorOutlet: "The Athletic", content: "Giants offense is a mess right now. Jones has to limit mistakes. This is a frustrating fantasy team to invest in.", timestamp: daysAgo(1), likes: 543, retweets: 167, replies: 71 },
  ],
  "new-york-jets": [
    { id: "nyj-1", authorName: "Connor Hughes", authorHandle: "Connor_J_Hughes", authorOutlet: "The Athletic", content: "Aaron Rodgers practicing with zero limitations. He looks like his 2020 MVP self in camp. QB1 if healthy.", timestamp: minutesAgo(20), likes: 2341, retweets: 812, replies: 334 },
    { id: "nyj-2", authorName: "Rich Cimini", authorHandle: "RichCimini", authorOutlet: "ESPN", content: "Garrett Wilson is going to go bananas with a healthy Rodgers. Top-5 WR this season. Lock him up early.", timestamp: hoursAgo(1), likes: 1876, retweets: 634, replies: 267 },
    { id: "nyj-3", authorName: "Andy Vasquez", authorHandle: "andy_vasquez", authorOutlet: "NorthJersey.com", content: "Breece Hall is every bit as good as advertised. Bell cow RB with 3-down capability. RB1 value.", timestamp: hoursAgo(4), likes: 1543, retweets: 512, replies: 214 },
    { id: "nyj-4", authorName: "Connor Hughes", authorHandle: "Connor_J_Hughes", authorOutlet: "The Athletic", content: "Allen Lazard and Randall Cobb battling for WR2 reps. Neither is a must-start, but Lazard has the edge.", timestamp: hoursAgo(9), likes: 654, retweets: 198, replies: 84 },
    { id: "nyj-5", authorName: "Rich Cimini", authorHandle: "RichCimini", authorOutlet: "ESPN", content: "C.J. Uzomah seeing TE1 volume in camp. Don't expect Kelce numbers but he's a reliable streamer.", timestamp: daysAgo(1), likes: 432, retweets: 134, replies: 58 },
  ],
  "philadelphia-eagles": [
    { id: "phi-1", authorName: "Zack Rosenblatt", authorHandle: "ZackRosenblatt", authorOutlet: "The Athletic", content: "Jalen Hurts in phenomenal shape. New OC has him in a simplified system that maximizes his strengths. Top-3 QB.", timestamp: minutesAgo(15), likes: 2103, retweets: 712, replies: 289 },
    { id: "phi-2", authorName: "EJ Smith", authorHandle: "EJSmith94", authorOutlet: "Philadelphia Inquirer", content: "A.J. Brown dominating in camp. No receiver in the league is more physical. WR1 overall conversation is real.", timestamp: hoursAgo(1), likes: 2341, retweets: 812, replies: 334 },
    { id: "phi-3", authorName: "Tim McManus", authorHandle: "Tim_McManus", authorOutlet: "ESPN", content: "DeVonta Smith continues to be criminally underrated. He'll finish top-10 at the position again. Buy the value.", timestamp: hoursAgo(4), likes: 1234, retweets: 412, replies: 178 },
    { id: "phi-4", authorName: "Zack Rosenblatt", authorHandle: "ZackRosenblatt", authorOutlet: "The Athletic", content: "D'Andre Swift looking fresh and motivated. Philadelphia's OL is one of the best in the league for RBs.", timestamp: hoursAgo(8), likes: 1543, retweets: 512, replies: 214 },
    { id: "phi-5", authorName: "EJ Smith", authorHandle: "EJSmith94", authorOutlet: "Philadelphia Inquirer", content: "Dallas Goedert targeting a return from IR in two weeks. Monitor closely — he's a top-3 TE when healthy.", timestamp: daysAgo(1), likes: 1876, retweets: 634, replies: 267 },
  ],
  "pittsburgh-steelers": [
    { id: "pit-1", authorName: "Gerry Dulac", authorHandle: "gerrydulac", authorOutlet: "Pittsburgh Post-Gazette", content: "Justin Fields getting every first-team rep. His legs make him an instant fantasy asset. Low-end QB1.", timestamp: minutesAgo(28), likes: 1234, retweets: 412, replies: 178 },
    { id: "pit-2", authorName: "Mark Kaboly", authorHandle: "MarkKaboly", authorOutlet: "The Athletic", content: "Najee Harris grinding in camp as always. He'll get his 250 touches. Reliable but not a difference maker.", timestamp: hoursAgo(2), likes: 876, retweets: 267, replies: 112 },
    { id: "pit-3", authorName: "Brooke Pryor", authorHandle: "bepryor", authorOutlet: "ESPN", content: "George Pickens is the most talented WR on this roster and everyone knows it. Needs a QB upgrade to truly break out.", timestamp: hoursAgo(5), likes: 1543, retweets: 512, replies: 214 },
    { id: "pit-4", authorName: "Gerry Dulac", authorHandle: "gerrydulac", authorOutlet: "Pittsburgh Post-Gazette", content: "Pat Freiermuth healthy all camp. The Steelers lean on their TE in the red zone. Solid fantasy floor.", timestamp: hoursAgo(10), likes: 654, retweets: 198, replies: 84 },
    { id: "pit-5", authorName: "Mark Kaboly", authorHandle: "MarkKaboly", authorOutlet: "The Athletic", content: "Steelers practicing in pads for the second straight week. Physical team. Expect smash-mouth football and low scores.", timestamp: daysAgo(1), likes: 432, retweets: 134, replies: 58 },
  ],
  "san-francisco-49ers": [
    { id: "sf-1", authorName: "Matt Barrows", authorHandle: "mattbarrows", authorOutlet: "The Athletic", content: "Brock Purdy healthy and sharp. He's proven he's no game manager — this is an elite fantasy QB situation.", timestamp: minutesAgo(32), likes: 1543, retweets: 512, replies: 214 },
    { id: "sf-2", authorName: "Nick Wagoner", authorHandle: "nwagoner", authorOutlet: "ESPN", content: "Deebo Samuel taking all WR1 reps with Purdy. Their connection is special. Boom-or-bust WR2 value.", timestamp: hoursAgo(1), likes: 1234, retweets: 412, replies: 178 },
    { id: "sf-3", authorName: "David Lombardi", authorHandle: "LombardiHimself", authorOutlet: "The Athletic", content: "Christian McCaffrey is the most valuable fantasy player alive when healthy. Watch the injury reports obsessively.", timestamp: hoursAgo(4), likes: 3421, retweets: 1234, replies: 512 },
    { id: "sf-4", authorName: "Matt Barrows", authorHandle: "mattbarrows", authorOutlet: "The Athletic", content: "George Kittle looking like a man possessed. His blocking AND receiving are elite. TE1 every single week.", timestamp: hoursAgo(9), likes: 2103, retweets: 712, replies: 289 },
    { id: "sf-5", authorName: "Nick Wagoner", authorHandle: "nwagoner", authorOutlet: "ESPN", content: "Brandon Aiyuk back and thriving after trade rumors settled. He's all-in on the 49ers. WR2 with WR1 upside.", timestamp: daysAgo(1), likes: 1876, retweets: 634, replies: 267 },
  ],
  "seattle-seahawks": [
    { id: "sea-1", authorName: "Bob Condotta", authorHandle: "bcondotta", authorOutlet: "Seattle Times", content: "Geno Smith entering camp with full command. His performances the last two years weren't a fluke.", timestamp: minutesAgo(42), likes: 876, retweets: 267, replies: 112 },
    { id: "sea-2", authorName: "Brady Henderson", authorHandle: "BradyHenderson", authorOutlet: "ESPN", content: "DK Metcalf monster in camp. 6'4, 235 lbs, and runs a 4.33. He's an absolute weapon. WR1 locked.", timestamp: hoursAgo(2), likes: 2103, retweets: 712, replies: 289 },
    { id: "sea-3", authorName: "Gregg Bell", authorHandle: "gbellseattle", authorOutlet: "The News Tribune", content: "Tyler Lockett healthy and being used in his traditional slot role. Reliable WR3 floor in PPR.", timestamp: hoursAgo(5), likes: 654, retweets: 198, replies: 84 },
    { id: "sea-4", authorName: "Bob Condotta", authorHandle: "bcondotta", authorOutlet: "Seattle Times", content: "Kenneth Walker taking first-team RB reps. His vision and burst are exceptional. RB1 in this offense.", timestamp: hoursAgo(10), likes: 1234, retweets: 412, replies: 178 },
    { id: "sea-5", authorName: "Brady Henderson", authorHandle: "BradyHenderson", authorOutlet: "ESPN", content: "Noah Fant catching everything thrown his way. Seahawks feed their TE in the passing game. Streamable every week.", timestamp: daysAgo(1), likes: 543, retweets: 167, replies: 71 },
  ],
  "tampa-bay-buccaneers": [
    { id: "tb-1", authorName: "Greg Auman", authorHandle: "gregauman", authorOutlet: "The Athletic", content: "Baker Mayfield entering year two in Tampa with massive confidence. His rapport with Evans is elite.", timestamp: minutesAgo(18), likes: 1123, retweets: 378, replies: 156 },
    { id: "tb-2", authorName: "Rick Stroud", authorHandle: "NFLSTROUD", authorOutlet: "Tampa Bay Times", content: "Mike Evans is ageless. He's going to hit 1,000 yards for the 10th straight year. Lock him up.", timestamp: hoursAgo(2), likes: 1876, retweets: 634, replies: 267 },
    { id: "tb-3", authorName: "Jenna Laine", authorHandle: "JennaLaineESPN", authorOutlet: "ESPN", content: "Chris Godwin recovering from his ankle but targeting a Week 1 return. WR3 upside when healthy.", timestamp: hoursAgo(5), likes: 987, retweets: 312, replies: 134 },
    { id: "tb-4", authorName: "Greg Auman", authorHandle: "gregauman", authorOutlet: "The Athletic", content: "Rachaad White emerging as the clear RB1. His pass-catching makes him a PPR darling. RB2 floor.", timestamp: hoursAgo(9), likes: 1234, retweets: 412, replies: 178 },
    { id: "tb-5", authorName: "Rick Stroud", authorHandle: "NFLSTROUD", authorOutlet: "Tampa Bay Times", content: "Cade Otton developing into a reliable TE for Mayfield. Not a top-12 TE but a streamer in the right matchup.", timestamp: daysAgo(1), likes: 432, retweets: 134, replies: 58 },
  ],
  "tennessee-titans": [
    { id: "ten-1", authorName: "Jim Wyatt", authorHandle: "jwyattsports", authorOutlet: "Titans.com", content: "Will Levis flashing in his second year. The arm talent is undeniable. Fringe QB2 in 2-QB leagues.", timestamp: minutesAgo(55), likes: 765, retweets: 234, replies: 98 },
    { id: "ten-2", authorName: "Paul Kuharsky", authorHandle: "PaulKuharskyNFL", authorOutlet: "paulkuharsky.com", content: "Tony Pollard getting all the first-team reps. Tennessee is going to ride him hard. RB2 in favorable matchups.", timestamp: hoursAgo(3), likes: 987, retweets: 312, replies: 134 },
    { id: "ten-3", authorName: "Turron Davenport", authorHandle: "TDavenport_NFL", authorOutlet: "ESPN", content: "DeAndre Hopkins making a huge impact in camp. Levis trusts him immediately. WR3 floor with big-play upside.", timestamp: hoursAgo(6), likes: 1234, retweets: 412, replies: 178 },
    { id: "ten-4", authorName: "Jim Wyatt", authorHandle: "jwyattsports", authorOutlet: "Titans.com", content: "Nick Westbrook-Ikhine getting quality reps. The WR depth behind Hopkins is thin. Monitor for injury news.", timestamp: hoursAgo(12), likes: 432, retweets: 134, replies: 58 },
    { id: "ten-5", authorName: "Paul Kuharsky", authorHandle: "PaulKuharskyNFL", authorOutlet: "paulkuharsky.com", content: "Titans not a fantasy-friendly offense right now. Manage your expectations unless your league rewards rushing.", timestamp: daysAgo(1), likes: 543, retweets: 167, replies: 71 },
  ],
  "washington-commanders": [
    { id: "was-1", authorName: "John Keim", authorHandle: "john_keim", authorOutlet: "ESPN", content: "Sam Howell showing major improvement in camp. His deep ball has been elite this week. Sneaky upside QB.", timestamp: minutesAgo(35), likes: 876, retweets: 267, replies: 112 },
    { id: "was-2", authorName: "Nicki Jhabvala", authorHandle: "NickiJhabvala", authorOutlet: "Washington Post", content: "Terry McLaurin demanding targets and getting them. He's the alpha in this offense regardless of QB. WR2 floor.", timestamp: hoursAgo(2), likes: 1234, retweets: 412, replies: 178 },
    { id: "was-3", authorName: "Craig Hoffman", authorHandle: "CraigHoffman", authorOutlet: "106.7 The Fan", content: "Brian Robinson Jr. is the workhorse RB. Antonio Gibson used as a satellite back. Robinson is your RB2.", timestamp: hoursAgo(5), likes: 876, retweets: 267, replies: 112 },
    { id: "was-4", authorName: "John Keim", authorHandle: "john_keim", authorOutlet: "ESPN", content: "Jahan Dotson chemistry with Howell is developing. He's a target monster when the timing is on. WR3 with upside.", timestamp: hoursAgo(10), likes: 654, retweets: 198, replies: 84 },
    { id: "was-5", authorName: "Nicki Jhabvala", authorHandle: "NickiJhabvala", authorOutlet: "Washington Post", content: "Logan Thomas healthy at TE. Washington's tight end room is underrated. Thomas is a legitimate streamer every week.", timestamp: daysAgo(1), likes: 432, retweets: 134, replies: 58 },
  ],
};
