// Utility function to properly encode a file path for use in custom protocol URLs
// This encodes each path segment individually while preserving slashes and drive letters

export function encodePathForProtocol(path: string): string {
    // Replace backslashes with forward slashes
    const normalized = path.replace(/\\/g, '/')
    // Split, encode each segment, rejoin
    const parts = normalized.split('/')
    return parts.map((part, i) => {
        // Don't encode drive letter (e.g., "C:") - convert to hostname format (c)
        if (i === 0 && /^[A-Za-z]:$/.test(part)) {
            return part.toLowerCase().replace(':', '')
        }
        return encodeURIComponent(part)
    }).join('/')
}
