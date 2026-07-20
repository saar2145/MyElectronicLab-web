// Version: 1.0
// Title: Join Code Generator | Important Data: 6 chars, uppercase, excludes
// visually-ambiguous characters (0/O, 1/I/L) since mentors read these codes
// aloud/write them on a whiteboard for students to type in.

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function generateJoinCode(length = 6): string {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return code;
}
