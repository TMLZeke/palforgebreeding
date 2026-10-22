/**
 * Palworld 1.0 rideable pals, from the Palworld wiki "Rideable Pals" page
 * (palworld.wiki.gg, retrieved 2026-07). Speeds are base values without
 * passives or condensation bonuses.
 */
export type MountCategory = "ground" | "swim" | "fly" | "glider";

export type MountInfo = {
  /** Pal display name matching the dataset */
  name: string;
  category: MountCategory;
  saddleLevel: number;
  runSpeed: number | null;
  sprintSpeed: number | null;
  stamina: number | null;
  /** Average speed over sprint + stamina recharge cycle (null if unknown) */
  average: number | null;
  /** Distance per full stamina bar (null if unknown) */
  distance: number | null;
  /** Flying mounts that drown (instead of hover) when out of stamina over water */
  drowns?: boolean;
  skill: string;
};

export const MOUNTS: MountInfo[] = [
  // ── Ground ──────────────────────────────────────────────
  { name: "Rushoar", category: "ground", saddleLevel: 6, runSpeed: 450, sprintSpeed: 700, stamina: 100, average: 617, distance: 7000, skill: "Increased mining efficiency while riding" },
  { name: "Melpaca", category: "ground", saddleLevel: 7, runSpeed: 460, sprintSpeed: 800, stamina: 100, average: 687, distance: 8000, skill: "Drops Wool when assigned to Ranch" },
  { name: "Direhowl", category: "ground", saddleLevel: 9, runSpeed: 800, sprintSpeed: 1050, stamina: 70, average: 946, distance: 7350, skill: "Moves slightly faster than most mounts" },
  { name: "Eikthyrdeer", category: "ground", saddleLevel: 12, runSpeed: 700, sprintSpeed: 900, stamina: 100, average: 833, distance: 9000, skill: "Double jump + increased logging efficiency" },
  { name: "Grintale", category: "ground", saddleLevel: 13, runSpeed: 600, sprintSpeed: 800, stamina: 100, average: 733, distance: 8000, skill: "Stronger Neutral attacks" },
  { name: "Chillet", category: "ground", saddleLevel: 13, runSpeed: 600, sprintSpeed: 800, stamina: 100, average: 733, distance: 8000, skill: "Applies Dragon damage to player attacks" },
  { name: "Sweepa", category: "ground", saddleLevel: 14, runSpeed: 300, sprintSpeed: 500, stamina: 100, average: 433, distance: 5000, skill: "Stats scale with Swee in team" },
  { name: "Univolt", category: "ground", saddleLevel: 14, runSpeed: 720, sprintSpeed: 1100, stamina: 100, average: 973, distance: 11000, skill: "Applies Electric damage to player attacks" },
  { name: "Arsox", category: "ground", saddleLevel: 16, runSpeed: 600, sprintSpeed: 800, stamina: 100, average: 733, distance: 8000, skill: "Keeps the rider warm in the cold" },
  { name: "Dinossom", category: "ground", saddleLevel: 19, runSpeed: 550, sprintSpeed: 700, stamina: 100, average: 650, distance: 7000, skill: "Stronger Grass attacks" },
  { name: "Broncherry", category: "ground", saddleLevel: 20, runSpeed: 350, sprintSpeed: 500, stamina: 100, average: 450, distance: 5000, skill: "Increases player carry weight" },
  { name: "Kingpaca", category: "ground", saddleLevel: 22, runSpeed: 500, sprintSpeed: 700, stamina: 100, average: 633, distance: 7000, skill: "Increases player carry weight by 100" },
  { name: "Dazemu", category: "ground", saddleLevel: 22, runSpeed: 900, sprintSpeed: 1200, stamina: 100, average: 1100, distance: 12000, skill: "Runs faster over sand" },
  { name: "Maraith", category: "ground", saddleLevel: 23, runSpeed: 600, sprintSpeed: 800, stamina: 100, average: 733, distance: 8000, skill: "Applies Dark damage to player attacks" },
  { name: "Mossanda", category: "ground", saddleLevel: 24, runSpeed: 500, sprintSpeed: 700, stamina: 100, average: 633, distance: 7000, skill: "Can rapidly fire a grenade launcher" },
  { name: "Surfent Terra", category: "ground", saddleLevel: 24, runSpeed: 500, sprintSpeed: 650, stamina: 100, average: 600, distance: 6500, skill: "Reduces weight of metal ore while riding" },
  { name: "Mossanda Lux", category: "ground", saddleLevel: 25, runSpeed: 500, sprintSpeed: 700, stamina: 100, average: 633, distance: 7000, skill: "Can rapidly fire a grenade launcher" },
  { name: "Eikthyrdeer Terra", category: "ground", saddleLevel: 25, runSpeed: 700, sprintSpeed: 900, stamina: 100, average: 833, distance: 9000, skill: "Increased damage to trees" },
  { name: "Rayhound", category: "ground", saddleLevel: 26, runSpeed: 700, sprintSpeed: 1150, stamina: 100, average: 1000, distance: 11500, skill: "Can double jump" },
  { name: "Fenglope", category: "ground", saddleLevel: 26, runSpeed: 750, sprintSpeed: 1050, stamina: 100, average: 950, distance: 10500, skill: "Can double jump" },
  { name: "Broncherry Aqua", category: "ground", saddleLevel: 27, runSpeed: 350, sprintSpeed: 500, stamina: 100, average: 450, distance: 5000, skill: "Increases player carry weight" },
  { name: "Mammorest", category: "ground", saddleLevel: 28, runSpeed: 430, sprintSpeed: 600, stamina: 100, average: 543, distance: 6000, skill: "Increased damage to trees" },
  { name: "Tarantriss", category: "ground", saddleLevel: 28, runSpeed: 640, sprintSpeed: 1000, stamina: 100, average: null, distance: null, skill: "Can double jump, can grapple" },
  { name: "Reindrix", category: "ground", saddleLevel: 29, runSpeed: 550, sprintSpeed: 700, stamina: 100, average: 650, distance: 7000, skill: "Keeps the rider cool in the heat" },
  { name: "Dinossom Lux", category: "ground", saddleLevel: 29, runSpeed: 550, sprintSpeed: 700, stamina: 100, average: 650, distance: 7000, skill: "Stronger Electric attacks" },
  { name: "Pyrin", category: "ground", saddleLevel: 30, runSpeed: 850, sprintSpeed: 1300, stamina: 100, average: 1150, distance: 13000, skill: "Applies Fire damage to player attacks" },
  { name: "Kitsun", category: "ground", saddleLevel: 30, runSpeed: 700, sprintSpeed: 900, stamina: 100, average: 833, distance: 9000, skill: "Unaffected by cold or heat while mounted" },
  { name: "Reptyro", category: "ground", saddleLevel: 31, runSpeed: 390, sprintSpeed: 550, stamina: 100, average: 497, distance: 5500, skill: "Increased damage to ores" },
  { name: "Blazehowl", category: "ground", saddleLevel: 32, runSpeed: 750, sprintSpeed: 900, stamina: 100, average: 850, distance: 9000, skill: "Grass Pals drop more items" },
  { name: "Pyrin Noct", category: "ground", saddleLevel: 33, runSpeed: 850, sprintSpeed: 1300, stamina: 100, average: 1150, distance: 13000, skill: "Applies Dark damage to player attacks" },
  { name: "Blazehowl Noct", category: "ground", saddleLevel: 35, runSpeed: 750, sprintSpeed: 900, stamina: 100, average: 850, distance: 9000, skill: "Neutral Pals drop more items" },
  { name: "Reptyro Cryst", category: "ground", saddleLevel: 37, runSpeed: 390, sprintSpeed: 550, stamina: 100, average: 497, distance: 5500, skill: "Increased damage to ores" },
  { name: "Blazamut", category: "ground", saddleLevel: 38, runSpeed: 700, sprintSpeed: 900, stamina: 100, average: 833, distance: 9000, skill: "Stronger Fire attacks" },
  { name: "Grizzbolt", category: "ground", saddleLevel: 40, runSpeed: 470, sprintSpeed: 550, stamina: 100, average: 523, distance: 5500, skill: "Can rapidly fire a minigun" },
  { name: "Kingpaca Cryst", category: "ground", saddleLevel: 42, runSpeed: 500, sprintSpeed: 700, stamina: 100, average: 633, distance: 7000, skill: "Increases player carry weight by 100" },
  { name: "Palumba", category: "ground", saddleLevel: 42, runSpeed: 550, sprintSpeed: 1000, stamina: 180, average: null, distance: null, skill: "Runs faster over grass" },
  { name: "Jormuntide Ignis", category: "ground", saddleLevel: 43, runSpeed: 600, sprintSpeed: 1000, stamina: 150, average: 642, distance: 7000, skill: "Stronger Fire attacks" },
  { name: "Yakumo", category: "ground", saddleLevel: 43, runSpeed: 370, sprintSpeed: 520, stamina: 100, average: 470, distance: 5200, skill: "Synch Passive Skills" },
  { name: "Relaxaurus", category: "ground", saddleLevel: 44, runSpeed: 650, sprintSpeed: 800, stamina: 100, average: 750, distance: 8000, skill: "Can rapidly fire missiles" },
  { name: "Wumpo", category: "ground", saddleLevel: 44, runSpeed: 365, sprintSpeed: 550, stamina: 100, average: 488, distance: 5500, skill: "Increases player carry weight" },
  { name: "Chillet Ignis", category: "ground", saddleLevel: 45, runSpeed: 600, sprintSpeed: 800, stamina: 100, average: 733, distance: 8000, skill: "Applies Fire damage to player attacks" },
  { name: "Mammorest Cryst", category: "ground", saddleLevel: 45, runSpeed: 430, sprintSpeed: 600, stamina: 100, average: 543, distance: 6000, skill: "Increased damage to trees" },
  { name: "Wumpo Botan", category: "ground", saddleLevel: 45, runSpeed: 365, sprintSpeed: 550, stamina: 100, average: 488, distance: 5500, skill: "Increases player carry weight" },
  { name: "Braloha", category: "ground", saddleLevel: 46, runSpeed: 600, sprintSpeed: 1020, stamina: 270, average: null, distance: null, skill: "No effects while riding" },
  { name: "Relaxaurus Lux", category: "ground", saddleLevel: 46, runSpeed: 650, sprintSpeed: 800, stamina: 100, average: 750, distance: 8000, skill: "Can rapidly fire missiles" },
  { name: "Shroomer", category: "ground", saddleLevel: 46, runSpeed: 400, sprintSpeed: 700, stamina: 100, average: 600, distance: 7000, skill: "No effects while mounted" },
  { name: "Shroomer Noct", category: "ground", saddleLevel: 47, runSpeed: 400, sprintSpeed: 700, stamina: 100, average: 600, distance: 7000, skill: "No effects while mounted" },
  { name: "Paladius", category: "ground", saddleLevel: 49, runSpeed: 800, sprintSpeed: 1400, stamina: 100, average: 1200, distance: 14000, skill: "Can triple jump" },
  { name: "Necromus", category: "ground", saddleLevel: 49, runSpeed: 900, sprintSpeed: 1600, stamina: 100, average: 1367, distance: 16000, skill: "Can triple jump" },
  { name: "Xenogard", category: "ground", saddleLevel: 51, runSpeed: 790, sprintSpeed: 1200, stamina: 100, average: 1063, distance: 12000, skill: "Gain more Meteorite Fragment and Quartz" },
  { name: "Fenglope Lux", category: "ground", saddleLevel: 52, runSpeed: 750, sprintSpeed: 1050, stamina: 140, average: null, distance: null, skill: "Double jump, Water Pals drop more items" },
  { name: "Kitsun Noct", category: "ground", saddleLevel: 53, runSpeed: 700, sprintSpeed: 1100, stamina: 140, average: null, distance: null, skill: "Applies Dark damage to player attacks" },
  { name: "Gildane", category: "ground", saddleLevel: 54, runSpeed: 840, sprintSpeed: 1260, stamina: 200, average: null, distance: null, skill: "Applies Earth damage to player attacks" },
  { name: "Blazamut Ryu", category: "ground", saddleLevel: 55, runSpeed: 700, sprintSpeed: 900, stamina: 100, average: 833, distance: 9000, skill: "Stronger Dragon attacks" },
  { name: "Azurmane", category: "ground", saddleLevel: 56, runSpeed: 900, sprintSpeed: 1260, stamina: 220, average: 1211, distance: null, skill: "Can dash in the air at high speed" },
  { name: "Starryon", category: "ground", saddleLevel: 57, runSpeed: 900, sprintSpeed: 1200, stamina: 230, average: null, distance: null, skill: "Increased speed at night" },
  { name: "Celesdir", category: "ground", saddleLevel: 58, runSpeed: 800, sprintSpeed: 1200, stamina: 260, average: null, distance: null, skill: "Increases player's auto recovery speed" },
  { name: "Silvegis", category: "ground", saddleLevel: 58, runSpeed: 700, sprintSpeed: 1050, stamina: 280, average: null, distance: null, skill: "Increases duration of shields" },
  { name: "Bastigor", category: "ground", saddleLevel: 59, runSpeed: 750, sprintSpeed: 1100, stamina: 270, average: null, distance: null, skill: "Can attack with an ice hammer" },
  { name: "Hartalis", category: "ground", saddleLevel: 65, runSpeed: 900, sprintSpeed: 1900, stamina: 400, average: null, distance: null, skill: "Triple jump, generates a barrier" },

  // ── Swimming ────────────────────────────────────────────
  { name: "Surfent", category: "swim", saddleLevel: 10, runSpeed: 500, sprintSpeed: 800, stamina: 100, average: 600, distance: 6500, skill: "No stamina depletion over water" },
  { name: "Azurobe", category: "swim", saddleLevel: 24, runSpeed: 600, sprintSpeed: 900, stamina: 160, average: 733, distance: 8000, skill: "Applies Water damage to player attacks" },
  { name: "Azurobe Cryst", category: "swim", saddleLevel: 29, runSpeed: 600, sprintSpeed: 900, stamina: 160, average: null, distance: null, skill: "Applies Ice damage to player attacks" },
  { name: "Polapup", category: "swim", saddleLevel: 34, runSpeed: 250, sprintSpeed: 375, stamina: 120, average: null, distance: null, skill: "Can slide down slopes" },
  { name: "Whalaska", category: "swim", saddleLevel: 35, runSpeed: 550, sprintSpeed: 660, stamina: 200, average: null, distance: null, skill: "Makes the fishing minigame easier" },
  { name: "Ghangler", category: "swim", saddleLevel: 37, runSpeed: 400, sprintSpeed: 600, stamina: 320, average: null, distance: null, skill: "Pals bite faster while fishing at night" },
  { name: "Jormuntide", category: "swim", saddleLevel: 39, runSpeed: 600, sprintSpeed: 1000, stamina: 150, average: 642, distance: 7000, skill: "No stamina depletion over water" },
  { name: "Ghangler Ignis", category: "swim", saddleLevel: 61, runSpeed: 400, sprintSpeed: 600, stamina: 320, average: null, distance: null, skill: "Pals bite faster while fishing at night" },
  { name: "Whalaska Ignis", category: "swim", saddleLevel: 62, runSpeed: 550, sprintSpeed: 660, stamina: 200, average: null, distance: null, skill: "Makes the fishing minigame easier" },
  { name: "Neptilius", category: "swim", saddleLevel: 63, runSpeed: 750, sprintSpeed: 1120, stamina: 410, average: null, distance: null, skill: "Can jump high over water" },

  // ── Flying (hovers without stamina) ─────────────────────
  { name: "Nitewing", category: "fly", saddleLevel: 15, runSpeed: 600, sprintSpeed: 750, stamina: 100, average: 700, distance: 7500, skill: "First flying mount available" },
  { name: "Vanwyrm", category: "fly", saddleLevel: 21, runSpeed: 700, sprintSpeed: 850, stamina: 150, average: 813, distance: 12750, skill: "Increased damage to enemy weak points" },
  { name: "Elphidran", category: "fly", saddleLevel: 21, runSpeed: 630, sprintSpeed: 800, stamina: 130, average: 753, distance: 10400, skill: "Dark Pals drop more items" },
  { name: "Elphidran Aqua", category: "fly", saddleLevel: 28, runSpeed: 630, sprintSpeed: 800, stamina: 130, average: 753, distance: 10400, skill: "Fire Pals drop more items" },
  { name: "Helzephyr", category: "fly", saddleLevel: 33, runSpeed: 700, sprintSpeed: 1100, stamina: 170, average: 1009, distance: 18700, skill: "Applies Dark damage to player attacks" },
  { name: "Beakon", category: "fly", saddleLevel: 34, runSpeed: 750, sprintSpeed: 1200, stamina: 160, average: 1093, distance: 19200, skill: "Applies Electric damage to player attacks" },
  { name: "Ragnahawk", category: "fly", saddleLevel: 37, runSpeed: 800, sprintSpeed: 1300, stamina: 150, average: 1175, distance: 19500, skill: "Applies Fire damage to player attacks" },
  { name: "Faleris", category: "fly", saddleLevel: 38, runSpeed: 1000, sprintSpeed: 1400, stamina: 230, average: 1329, distance: 32200, skill: "Ice Pals drop more items" },
  { name: "Suzaku", category: "fly", saddleLevel: 40, runSpeed: 850, sprintSpeed: 1100, stamina: 350, average: 1069, distance: 38500, skill: "Stronger Fire attacks" },
  { name: "Vanwyrm Cryst", category: "fly", saddleLevel: 41, runSpeed: 700, sprintSpeed: 850, stamina: 150, average: 813, distance: 12750, skill: "Increased damage to enemy weak points" },
  { name: "Suzaku Aqua", category: "fly", saddleLevel: 43, runSpeed: 850, sprintSpeed: 1100, stamina: 350, average: 1069, distance: 38500, skill: "Stronger Water attacks" },
  { name: "Astegon", category: "fly", saddleLevel: 47, runSpeed: 600, sprintSpeed: 800, stamina: 300, average: 771, distance: 24000, skill: "Increased damage to ores" },
  { name: "Jetragon", category: "fly", saddleLevel: 50, runSpeed: 1700, sprintSpeed: 3300, stamina: 100, average: 2767, distance: 33000, skill: "Continuous rocket launcher fire" },
  { name: "Helzephyr Lux", category: "fly", saddleLevel: 52, runSpeed: 700, sprintSpeed: 1100, stamina: 170, average: 1009, distance: 18700, skill: "Applies Electric damage to player attacks" },
  { name: "Selyne", category: "fly", saddleLevel: 53, runSpeed: 450, sprintSpeed: 550, stamina: 300, average: 536, distance: 16500, skill: "Enhances own Neutral/Dark attacks, no player guns" },
  { name: "Faleris Aqua", category: "fly", saddleLevel: 55, runSpeed: 1000, sprintSpeed: 1400, stamina: 230, average: null, distance: null, skill: "Fire Pals drop more items" },

  // ── Flying (drowns without stamina over water) ──────────
  { name: "Quivern", category: "fly", saddleLevel: 36, runSpeed: 800, sprintSpeed: 950, stamina: 220, average: 922, distance: 20900, drowns: true, skill: "Stronger Dragon attacks" },
  { name: "Shadowbeak", category: "fly", saddleLevel: 47, runSpeed: 850, sprintSpeed: 1200, stamina: 250, average: 1142, distance: 30000, drowns: true, skill: "Stronger Dark attacks" },
  { name: "Frostallion", category: "fly", saddleLevel: 48, runSpeed: 1000, sprintSpeed: 1500, stamina: 300, average: 1429, distance: 45000, drowns: true, skill: "Player attacks become Ice + stronger Ice attacks" },
  { name: "Frostallion Noct", category: "fly", saddleLevel: 48, runSpeed: 1000, sprintSpeed: 1500, stamina: 300, average: 1429, distance: 45000, drowns: true, skill: "Player attacks become Dark + stronger Dark attacks" },
  { name: "Quivern Botan", category: "fly", saddleLevel: 49, runSpeed: 800, sprintSpeed: 950, stamina: 220, average: 922, distance: 20900, drowns: true, skill: "Stronger Grass attacks" },
  { name: "Xenolord", category: "fly", saddleLevel: 60, runSpeed: 550, sprintSpeed: 660, stamina: 300, average: null, distance: null, drowns: true, skill: "Higher speed while flying" },

  // ── Gliders ─────────────────────────────────────────────
  { name: "Celaray", category: "glider", saddleLevel: 7, runSpeed: null, sprintSpeed: 700, stamina: null, average: null, distance: null, skill: "Move quickly while gliding" },
  { name: "Killamari", category: "glider", saddleLevel: 9, runSpeed: null, sprintSpeed: 550, stamina: null, average: null, distance: null, skill: "Float for long periods while gliding" },
  { name: "Hangyu", category: "glider", saddleLevel: 20, runSpeed: null, sprintSpeed: 550, stamina: null, average: null, distance: null, skill: "Carries the player up high while gliding" },
  { name: "Galeclaw", category: "glider", saddleLevel: 23, runSpeed: null, sprintSpeed: 700, stamina: null, average: null, distance: null, skill: "Fire a gun while gliding" },
  { name: "Killamari Primo", category: "glider", saddleLevel: 23, runSpeed: null, sprintSpeed: 550, stamina: null, average: null, distance: null, skill: "Float for long periods while gliding" },
  { name: "Celaray Lux", category: "glider", saddleLevel: 26, runSpeed: null, sprintSpeed: 700, stamina: null, average: null, distance: null, skill: "Move quickly while gliding" },
  { name: "Hangyu Cryst", category: "glider", saddleLevel: 31, runSpeed: null, sprintSpeed: 550, stamina: null, average: null, distance: null, skill: "Carries the player up high while gliding" },
];