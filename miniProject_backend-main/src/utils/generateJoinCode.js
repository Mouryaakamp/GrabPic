/**
 * Generate a human-friendly join code for events.
 *
 * Used when an organizer creates an event. The generated code is then shown
 * to attendees, who must provide it via the /events/join API before they can
 * access event photos or run face searches.
 *
 * Characteristics:
 * - Length: 6 characters (e.g. ABC7XY)
 * - Characters: uppercase letters (excluding confusing ones) + digits 2–9
 */

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const DEFAULT_LENGTH = 6;

function generateJoinCode(length = DEFAULT_LENGTH) {
  let code = '';
  for (let i = 0; i < length; i += 1) {
    const index = Math.floor(Math.random() * ALPHABET.length);
    code += ALPHABET[index];
  }
  return code;
}

module.exports = { generateJoinCode };
