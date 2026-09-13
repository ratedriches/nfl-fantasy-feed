export interface BeatWriter {
  name: string;
  handle: string;
  outlet: string;
};

export interface Team {
  name: string;
  slug: string;
  abbrev: string;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  beatWriters: BeatWriter[];
}

export const teams: Team[] = [
  {
    name: "Arizona Cardinals",
    slug: "arizona-cardinals",
    abbrev: "ari",
    primaryColor: "#97233F",
    secondaryColor: "#000000",
    textColor: "#ffffff",
    beatWriters: [
      { name: "Darren Urban", handle: "Cardschatter", outlet: "AZCardinals.com" },
    ],
  },
  {
    name: "Atlanta Falcons",
    slug: "atlanta-falcons",
    abbrev: "atl",
    primaryColor: "#A71930",
    secondaryColor: "#000000",
    textColor: "#ffffff",
    beatWriters: [
      { name: "D. Orlando Ledbetter", handle: "BowTieSportsGuy", outlet: "Falcons Beat" },
    ],
  },
  {
    name: "Baltimore Ravens",
    slug: "baltimore-ravens",
    abbrev: "bal",
    primaryColor: "#241773",
    secondaryColor: "#000000",
    textColor: "#ffffff",
    beatWriters: [
      { name: "Jeff Zrebiec", handle: "jeffzrebiec", outlet: "The Athletic" },
    ],
  },
  {
    name: "Buffalo Bills",
    slug: "buffalo-bills",
    abbrev: "buf",
    primaryColor: "#00338D",
    secondaryColor: "#C60C30",
    textColor: "#ffffff",
    beatWriters: [
      { name: "Joe Buscaglia", handle: "JoeBuscaglia", outlet: "The Athletic" },
    ],
  },
  {
    name: "Carolina Panthers",
    slug: "carolina-panthers",
    abbrev: "car",
    primaryColor: "#0085CA",
    secondaryColor: "#101820",
    textColor: "#ffffff",
    beatWriters: [
      { name: "Joe Person", handle: "josephperson", outlet: "The Athletic" },
    ],
  },
  {
    name: "Chicago Bears",
    slug: "chicago-bears",
    abbrev: "chi",
    primaryColor: "#0B162A",
    secondaryColor: "#C83803",
    textColor: "#ffffff",
    beatWriters: [
      { name: "Dan Wiederer", handle: "danwiederer", outlet: "Chicago Tribune" },
    ],
  },
  {
    name: "Cincinnati Bengals",
    slug: "cincinnati-bengals",
    abbrev: "cin",
    primaryColor: "#FB4F14",
    secondaryColor: "#000000",
    textColor: "#ffffff",
    beatWriters: [
      { name: "Jay Morrison", handle: "ByJayMorrison", outlet: "The Athletic" },
    ],
  },
  {
    name: "Cleveland Browns",
    slug: "cleveland-browns",
    abbrev: "cle",
    primaryColor: "#311D00",
    secondaryColor: "#FF3C00",
    textColor: "#ffffff",
    beatWriters: [
      { name: "Zac Jackson", handle: "AkronJackson", outlet: "The Athletic" },
    ],
  },
  {
    name: "Dallas Cowboys",
    slug: "dallas-cowboys",
    abbrev: "dal",
    primaryColor: "#003594",
    secondaryColor: "#869397",
    textColor: "#ffffff",
    beatWriters: [
      { name: "Jon Machota", handle: "jonmachota", outlet: "The Athletic" },
    ],
  },
  {
    name: "Denver Broncos",
    slug: "denver-broncos",
    abbrev: "den",
    primaryColor: "#FB4F14",
    secondaryColor: "#002244",
    textColor: "#ffffff",
    beatWriters: [
      { name: "Mike Klis", handle: "mikeklis9news", outlet: "9NEWS Denver" },
    ],
  },
  {
    name: "Detroit Lions",
    slug: "detroit-lions",
    abbrev: "det",
    primaryColor: "#0076B6",
    secondaryColor: "#B0B7BC",
    textColor: "#ffffff",
    beatWriters: [
      { name: "Tim Twentyman", handle: "ttwentyman", outlet: "DetroitLions.com" },
    ],
  },
  {
    name: "Green Bay Packers",
    slug: "green-bay-packers",
    abbrev: "gb",
    primaryColor: "#203731",
    secondaryColor: "#FFB612",
    textColor: "#ffffff",
    beatWriters: [
      { name: "Matt Schneidman", handle: "mattschneidman", outlet: "The Athletic" },
      { name: "Rob Demovsky", handle: "RobDemovsky", outlet: "ESPN" },
    ],
  },
  {
    name: "Houston Texans",
    slug: "houston-texans",
    abbrev: "hou",
    primaryColor: "#03202F",
    secondaryColor: "#A71930",
    textColor: "#ffffff",
    beatWriters: [
      { name: "Aaron Wilson", handle: "AaronWilson_NFL", outlet: "KPRC 2" },
    ],
  },
  {
    name: "Indianapolis Colts",
    slug: "indianapolis-colts",
    abbrev: "ind",
    primaryColor: "#002C5F",
    secondaryColor: "#A2AAAD",
    textColor: "#ffffff",
    beatWriters: [
      { name: "Mike Chappell", handle: "mchappell51", outlet: "Colts Beat" },
    ],
  },
  {
    name: "Jacksonville Jaguars",
    slug: "jacksonville-jaguars",
    abbrev: "jax",
    primaryColor: "#006778",
    secondaryColor: "#D7A22A",
    textColor: "#ffffff",
    beatWriters: [
      { name: "John Oehser", handle: "JohnOehser", outlet: "Jaguars.com" },
      { name: "Demetrius Harvey", handle: "Demetrius82", outlet: "Jaguars Beat" },
    ],
  },
  {
    name: "Kansas City Chiefs",
    slug: "kansas-city-chiefs",
    abbrev: "kc",
    primaryColor: "#E31837",
    secondaryColor: "#FFB81C",
    textColor: "#ffffff",
    beatWriters: [
      { name: "Sam McDowell", handle: "SamMcDowell11", outlet: "Kansas City Star" },
    ],
  },
  {
    name: "Las Vegas Raiders",
    slug: "las-vegas-raiders",
    abbrev: "lv",
    primaryColor: "#000000",
    secondaryColor: "#A5ACAF",
    textColor: "#ffffff",
    beatWriters: [
      { name: "Paul Gutierrez", handle: "PaulHGutierrez", outlet: "ESPN" },
    ],
  },
  {
    name: "Los Angeles Chargers",
    slug: "los-angeles-chargers",
    abbrev: "lac",
    primaryColor: "#0080C6",
    secondaryColor: "#FFC20E",
    textColor: "#ffffff",
    beatWriters: [
      { name: "Kris Rhim", handle: "krisrhim1", outlet: "Chargers Beat" },
    ],
  },
  {
    name: "Los Angeles Rams",
    slug: "los-angeles-rams",
    abbrev: "lar",
    primaryColor: "#003594",
    secondaryColor: "#FFA300",
    textColor: "#ffffff",
    beatWriters: [
      { name: "Stu Jackson", handle: "StuJRams", outlet: "Rams.com" },
    ],
  },
  {
    name: "Miami Dolphins",
    slug: "miami-dolphins",
    abbrev: "mia",
    primaryColor: "#008E97",
    secondaryColor: "#FC4C02",
    textColor: "#ffffff",
    beatWriters: [
      { name: "David Furones", handle: "DavidFurones_", outlet: "South Florida Sun Sentinel" },
    ],
  },
  {
    name: "Minnesota Vikings",
    slug: "minnesota-vikings",
    abbrev: "min",
    primaryColor: "#4F2683",
    secondaryColor: "#FFC62F",
    textColor: "#ffffff",
    beatWriters: [
      { name: "Ben Goessling", handle: "BenGoessling", outlet: "Minneapolis Star Tribune" },
    ],
  },
  {
    name: "New England Patriots",
    slug: "new-england-patriots",
    abbrev: "ne",
    primaryColor: "#002244",
    secondaryColor: "#C60C30",
    textColor: "#ffffff",
    beatWriters: [
      { name: "Phil Perry", handle: "PhilAPerry", outlet: "NBC Sports Boston" },
      { name: "Mike Reiss", handle: "MikeReiss", outlet: "ESPN" },
    ],
  },
  {
    name: "New Orleans Saints",
    slug: "new-orleans-saints",
    abbrev: "no",
    primaryColor: "#101820",
    secondaryColor: "#D3BC8D",
    textColor: "#ffffff",
    beatWriters: [
      { name: "Katherine Terrell", handle: "Kat_Terrell", outlet: "ESPN" },
    ],
  },
  {
    name: "New York Giants",
    slug: "new-york-giants",
    abbrev: "nyg",
    primaryColor: "#0B2265",
    secondaryColor: "#A71930",
    textColor: "#ffffff",
    beatWriters: [
      { name: "Dan Duggan", handle: "DDuggan21", outlet: "The Athletic" },
      { name: "Jordan Raanan", handle: "JordanRaanan", outlet: "ESPN" },
    ],
  },
  {
    name: "New York Jets",
    slug: "new-york-jets",
    abbrev: "nyj",
    primaryColor: "#125740",
    secondaryColor: "#000000",
    textColor: "#ffffff",
    beatWriters: [
      { name: "Brian Costello", handle: "BrianCoz", outlet: "New York Post" },
    ],
  },
  {
    name: "Philadelphia Eagles",
    slug: "philadelphia-eagles",
    abbrev: "phi",
    primaryColor: "#004C54",
    secondaryColor: "#A5ACAF",
    textColor: "#ffffff",
    beatWriters: [
      { name: "Tim McManus", handle: "Tim_McManus", outlet: "ESPN" },
    ],
  },
  {
    name: "Pittsburgh Steelers",
    slug: "pittsburgh-steelers",
    abbrev: "pit",
    primaryColor: "#101820",
    secondaryColor: "#FFB612",
    textColor: "#ffffff",
    beatWriters: [
      { name: "Nick Farabaugh", handle: "FarabaughFB", outlet: "Steelers Beat" },
    ],
  },
  {
    name: "San Francisco 49ers",
    slug: "san-francisco-49ers",
    abbrev: "sf",
    primaryColor: "#AA0000",
    secondaryColor: "#B3995D",
    textColor: "#ffffff",
    beatWriters: [
      { name: "Matt Maiocco", handle: "MaioccoNBCS", outlet: "NBC Sports Bay Area" },
    ],
  },
  {
    name: "Seattle Seahawks",
    slug: "seattle-seahawks",
    abbrev: "sea",
    primaryColor: "#002244",
    secondaryColor: "#69BE28",
    textColor: "#ffffff",
    beatWriters: [
      { name: "Brady Henderson", handle: "BradyHenderson", outlet: "ESPN" },
      { name: "Gregg Bell", handle: "gbellseattle", outlet: "The News Tribune" },
    ],
  },
  {
    name: "Tampa Bay Buccaneers",
    slug: "tampa-bay-buccaneers",
    abbrev: "tb",
    primaryColor: "#D50A0A",
    secondaryColor: "#FF7900",
    textColor: "#ffffff",
    beatWriters: [
      { name: "Rick Stroud", handle: "NFLSTROUD", outlet: "Tampa Bay Times" },
    ],
  },
  {
    name: "Tennessee Titans",
    slug: "tennessee-titans",
    abbrev: "ten",
    primaryColor: "#0C2340",
    secondaryColor: "#4B92DB",
    textColor: "#ffffff",
    beatWriters: [
      { name: "Turron Davenport", handle: "TDavenport_NFL", outlet: "ESPN" },
      { name: "Jim Wyatt", handle: "jwyattsports", outlet: "Titans.com" },
    ],
  },
  {
    name: "Washington Commanders",
    slug: "washington-commanders",
    abbrev: "was",
    primaryColor: "#5A1414",
    secondaryColor: "#FFB612",
    textColor: "#ffffff",
    beatWriters: [
      { name: "John Keim", handle: "john_keim", outlet: "ESPN" },
      { name: "Nicki Jhabvala", handle: "NickiJhabvala", outlet: "Washington Post" },
    ],
  },
];
