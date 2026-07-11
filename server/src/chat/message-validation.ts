export interface ValidationResult {
    valid: boolean;
}

const MAX_LENGTH = 500;

export function validateMessage(message: string): ValidationResult {
    // check null/undefined/non-string
    if (typeof message !== "string") {
        return { valid: false };
    }

    // check empty or whitespace
    if (message.trim().length === 0) {
        return { valid: false };
    }

    // check length
    if (message.length > MAX_LENGTH) {
        return { valid: false };
    }

    return { valid: true };
}