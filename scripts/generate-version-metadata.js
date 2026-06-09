// This script convert GITHUB_REF to metadata that can be use as version
// main -> latest

// 1. Remove common GitHub ref prefixes (refs/heads/, refs/tags/, refs/pull/)
// 2. Convert to lowercase and replace non-alphanumeric chars with hyphens (ignore dot)
// 3. Remove multiple consecutive hyphens or leading/trailing hyphens

const VERSION_MAP = {
  main: "latest"
}

function slugify(inputStr) {
  return inputStr
    .replace(/^refs\/(heads|tags|pull)\//, '')
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function toVersion(slug) {
  if (slug in VERSION_MAP) {
    return VERSION_MAP[slug]
  }

  return slug
}

const args = process.argv.slice(2);
const inputRef = args[0];

if (!inputRef) {
  console.error('Error: Please provide a GitHub ref as an argument.');
  console.log('Usage: node generate-version-metadata.js <github-ref>');
  process.exit(1);
}

const slug = slugify(inputRef)
const version = toVersion(slug)

console.log(version);
