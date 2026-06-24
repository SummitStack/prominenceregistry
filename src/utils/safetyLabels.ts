export const HAZARD_LABELS: Record<string, string> = {
  'altitude-sickness': 'Altitude Sickness',
  avalanche: 'Avalanche',
  bears: 'Bears & Wildlife',
  bergschrund: 'Bergschrund',
  'class-4-climbing': 'Class 4 Climbing',
  'crevasse-fall': 'Crevasse Fall',
  dehydration: 'Dehydration',
  exposure: 'Exposure',
  'heat-exhaustion': 'Heat Exhaustion',
  hypothermia: 'Hypothermia',
  'lightning-exposure': 'Lightning Exposure',
  'loose-rock-scree': 'Loose Rock & Scree',
  'off-trail-navigation': 'Off-Trail Navigation',
  rockfall: 'Rockfall',
  'scrambling-exposed': 'Exposed Scrambling',
  'water-crossing': 'Water Crossing',
  'whiteout-conditions': 'Whiteout Conditions',
  'wind-extreme-weather': 'Extreme Wind & Weather',
};

export const TECHNICAL_REQUIREMENT_LABELS: Record<string, string> = {
  'alpine-start': 'Alpine Start',
  'glacier-travel': 'Glacier Travel',
  'altitude-acclimatization': 'Altitude Acclimatization',
  'off-trail-nav': 'Off-Trail Navigation',
  'rock-scrambling-loose': 'Loose Rock Scrambling',
  'exposed-scrambling': 'Exposed Scrambling',
  'snow-travel': 'Snow Travel',
  'water-crossings': 'Water Crossings',
  'exposed-rock-climbing': 'Exposed Rock Climbing',
};

export const GEAR_LABELS: Record<string, string> = {
  'ice-axe': 'Ice Axe',
  crampons: 'Crampons',
  microspikes: 'Microspikes',
  helmet: 'Helmet',
  'avalanche-gear': 'Avalanche Safety Gear',
  'rope-harness': 'Rope & Harness',
  'climbing-protection': 'Climbing Protection',
  'belay-device': 'Belay Device',
  sunscreen: 'Sunscreen',
  sunglasses: 'Sunglasses',
  hat: 'Sun Hat',
  'water-capacity': 'Water Capacity (3L+)',
  'high-calorie-food': 'High-Calorie Food',
  'insulating-layer': 'Insulating Layer',
  'shell-jacket': 'Shell Jacket',
  'shell-pants': 'Shell Pants',
  'insulating-hat': 'Insulating Hat',
  gloves: 'Gloves',
  compass: 'Compass',
  'emergency-comm': 'Emergency Communication',
  'duct-tape': 'Duct Tape',
  gaiters: 'Gaiters',
  'traction-descent': 'Traction for Descent',
  'climbing-shoes': 'Climbing Shoes',
  'insect-repellent': 'Insect Repellent',
};

export function getHazardLabel(id: string): string {
  return HAZARD_LABELS[id] ?? id;
}

export function getTechnicalRequirementLabel(id: string): string {
  return TECHNICAL_REQUIREMENT_LABELS[id] ?? id;
}

export function getGearLabel(id: string): string {
  return GEAR_LABELS[id] ?? id;
}
