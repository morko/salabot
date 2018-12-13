

/**
 * Wrap text in a multi code block and escape grave characters.
 *
 * @param text The input text.
 *
 * @returns The wrapped text.
 */
module.exports.mcb = mcb;
function mcb(text) {
	return '```\n' + text.replace(/```/g, '´´´') + '\n```';
}
/**
 * Wrap text in a code block and escape grave characters.
 *
 * @param text The input text.
 *
 * @returns The wrapped text.
 */
module.exports.cb = cb;
function cb(text) {
	return '`' + text.replace(/`/g, '´') + '`';
}

/**
 * Wrap text to italics and escape grave characters.
 *
 * @param text The input text.
 *
 * @returns The wrapped text.
 */
module.exports.i = i;
function i(text) {
	return '*' + text.replace(/\*/g, '\\*') + '*';
}

/**
 * Wrap text to bold and escape grave characters.
 *
 * @param text The input text.
 *
 * @returns The wrapped text.
 */
module.exports.b = b;
function b(text) {
	return '**' + text.replace(/\*\*/g, '\\*\*') + '**';
}