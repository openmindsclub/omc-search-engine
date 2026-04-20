const SALARY_PATTERNS = [
  /\$\s*(\d[\d,]*\.?\d*)\s*[kK]?\s*[-–to]+\s*\$?\s*(\d[\d,]*\.?\d*)\s*[kK]?/,
  /(\d[\d,]+)\s*[-–to]+\s*(\d[\d,]+)\s*(?:USD|usd|dollars?)/,
  /up\s+to\s+\$?\s*(\d[\d,]*\.?\d*)\s*[kK]?/i,
  /\$\s*(\d[\d,]*\.?\d*)\s*[kK]?\s*\/\s*(?:yr|year|annum|y)/i,
];

function parseSalaryValue(raw: string, isK: boolean): number {
  const n = parseFloat(raw.replace(/,/g, ''));
  return isK || n < 1000 ? Math.round(n * 1000) : Math.round(n);
}

export function extractSalary(text: string): {
  raw: string;
  min: number;
  max: number;
} {
  for (const pattern of SALARY_PATTERNS) {
    const match = text.match(pattern);
    if (!match) continue;

    const raw = match[0];

    if (match[1] && match[2]) {
      const isK = /[kK]/.test(raw);
      const min = parseSalaryValue(match[1], isK);
      const max = parseSalaryValue(match[2], isK);
      return { raw, min, max };
    }

    if (match[1]) {
      const isK = /[kK]/.test(raw);
      const val = parseSalaryValue(match[1], isK);
      return { raw, min: val, max: val };
    }
  }

  return { raw: '', min: -1, max: -1 };
}

const KNOWN_SKILLS = [
  'javascript',
  'typescript',
  'python',
  'java',
  'kotlin',
  'swift',
  'go',
  'golang',
  'rust',
  'ruby',
  'php',
  'c#',
  'c\\+\\+',
  'scala',
  'elixir',
  'react',
  'vue',
  'angular',
  'svelte',
  'next\\.js',
  'nuxt',
  'remix',
  'html',
  'css',
  'sass',
  'tailwind',
  'webpack',
  'vite',
  'node\\.js',
  'express',
  'nestjs',
  'django',
  'fastapi',
  'flask',
  'rails',
  'spring',
  'laravel',
  'postgresql',
  'mysql',
  'mongodb',
  'redis',
  'elasticsearch',
  'sqlite',
  'dynamodb',
  'firestore',
  'cassandra',
  'aws',
  'gcp',
  'azure',
  'docker',
  'kubernetes',
  'terraform',
  'ci/cd',
  'github actions',
  'jenkins',
  'ansible',
  'graphql',
  'rest',
  'grpc',
  'kafka',
  'rabbitmq',
  'git',
  'linux',
  'agile',
  'scrum',
];

const EXPERIENCE_PATTERN =
  /\b(\d+\+?\s*(?:years?|yrs?)(?:\s+of)?\s+(?:experience|exp)\b[^.]{0,100})/gi;

const DEGREE_PATTERN =
  /\b((?:bachelor'?s?|master'?s?|phd|b\.?s\.?|m\.?s\.?)\s+(?:degree\s+)?(?:in\s+[a-z\s]{3,30})?)/gi;

export function extractRequirements(text: string): string[] {
  const found = new Set<string>();

  for (const skill of KNOWN_SKILLS) {
    const re = new RegExp(`\\b${skill}\\b`, 'i');
    if (re.test(text)) {
      found.add(skill.replace(/\\\./g, '.').replace(/\\\+/g, '+'));
    }
  }

  for (const match of text.matchAll(EXPERIENCE_PATTERN)) {
    found.add(match[1].trim());
  }

  for (const match of text.matchAll(DEGREE_PATTERN)) {
    const degree = match[1].trim();
    if (degree.length > 3) found.add(degree);
  }

  return [...found];
}
