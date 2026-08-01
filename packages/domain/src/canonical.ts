function canonicalValue(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalValue).join(",")}]`;
  }
  const record = value as Readonly<Record<string, unknown>>;
  const entries = Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalValue(record[key])}`);
  return `{${entries.join(",")}}`;
}

export function canonicalize(value: unknown): string {
  return canonicalValue(value);
}

export function deterministicDigest(value: unknown): string {
  const input = canonicalize(value);
  let hash = 0xcbf29ce484222325n;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= BigInt(input.charCodeAt(index));
    hash = BigInt.asUintN(64, hash * 0x100000001b3n);
  }
  return `fs1-${hash.toString(16).padStart(16, "0")}`;
}
