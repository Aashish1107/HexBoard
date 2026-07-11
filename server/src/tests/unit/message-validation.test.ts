import { validateMessage } from "../../chat/message-validation";

describe("chat message validation", () => {
    describe("invalid messages", () => {
        it("rejects empty messages", () => {
            const result = validateMessage("");
            expect(result.valid).toBe(false);
        });

        it("rejects whitespace-only messages", () => {
            const result = validateMessage("   ");
            expect(result.valid).toBe(false);
        });

        it("rejects messages that are too long", () => {
            const longText = "a".repeat(1000);
            const result = validateMessage(longText);
            expect(result.valid).toBe(false);
        });

        it("rejects non-string messages", () => {
            const result = validateMessage(123 as unknown as string);
            expect(result.valid).toBe(false);
        });

        it("rejects null messages", () => {
            const result = validateMessage(null as unknown as string);
            expect(result.valid).toBe(false);
        });

        it("rejects undefined messages", () => {
            const result = validateMessage(undefined as unknown as string);
            expect(result.valid).toBe(false);
        });
    });

    describe("valid messages", () => {
        it("accepts normal messages", () => {
            const result = validateMessage("hello");
            expect(result.valid).toBe(true);
        });

        it("accepts messages with punctuation", () => {
            const result = validateMessage("hello world!");
            expect(result.valid).toBe(true);
        });
    });
});