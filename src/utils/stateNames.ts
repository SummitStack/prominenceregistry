const STATE_NAMES: Record<string, string> = {
  WA: 'Washington',
  CA: 'California',
  CO: 'Colorado',
  AZ: 'Arizona',
  NV: 'Nevada',
  UT: 'Utah',
  WY: 'Wyoming',
  MT: 'Montana',
  OR: 'Oregon',
  ID: 'Idaho',
  NM: 'New Mexico',
  TX: 'Texas',
  NH: 'New Hampshire',
  NC: 'North Carolina',
  TN: 'Tennessee',
  SD: 'South Dakota',
  ND: 'North Dakota',
};

export function getStateName(abbrev: string): string {
  return STATE_NAMES[abbrev] ?? abbrev;
}
