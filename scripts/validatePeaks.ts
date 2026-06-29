import peaksData from '../src/data/peaks/peaks.json';
import { PeaksArraySchema } from '../src/data/peakSchema';

const result = PeaksArraySchema.safeParse(peaksData);

if (!result.success) {
  console.error('\n❌ peak data validation failed:\n');
  result.error.issues.forEach((issue) => {
    const path = issue.path.join(' → ');
    console.error(`  [${path}] ${issue.message}`);
  });
  process.exit(1);
} else {
  console.log(`✅ peak data valid — ${result.data.length} peaks passed schema validation`);
}
