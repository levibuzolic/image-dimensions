const isWebp = bytes =>
	// RIFF
	bytes[0] === 0x52
	&& bytes[1] === 0x49
	&& bytes[2] === 0x46
	&& bytes[3] === 0x46
	// WEBP
	&& bytes[8] === 0x57
	&& bytes[9] === 0x45
	&& bytes[10] === 0x42
	&& bytes[11] === 0x50;

const isVP8Lossy = bytes =>
	// `VP8 ` (note the space)
	bytes[12] === 0x56
	&& bytes[13] === 0x50
	&& bytes[14] === 0x38
	&& bytes[15] === 0x20;

const isVP8Lossless = bytes =>
	// `VP8L`
	bytes[12] === 0x56
	&& bytes[13] === 0x50
	&& bytes[14] === 0x38
	&& bytes[15] === 0x4C;

const isVP8Extended = bytes =>
	// `VP8X`
	bytes[12] === 0x56
	&& bytes[13] === 0x50
	&& bytes[14] === 0x38
	&& bytes[15] === 0x58;

/* eslint-disable no-bitwise */
const readUInt16LE = (bytes, offset) => bytes[offset] | (bytes[offset + 1] << 8);
const readUInt24LE = (bytes, offset) => bytes[offset] + (bytes[offset + 1] * (2 ** 8)) + (bytes[offset + 2] * (2 ** 16));
const readUInt32LE = (bytes, offset) => bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] * 0x1_00_00_00);
/* eslint-enable no-bitwise */

export default function webp(bytes) {
	if (!isWebp(bytes)) {
		return;
	}

	const maxSize = 0x3F_FF;

	if (isVP8Lossy(bytes)) {
		return {
			/* eslint-disable no-bitwise */
			width: readUInt16LE(bytes, 26) & maxSize,
			height: readUInt16LE(bytes, 28) & maxSize,
			/* eslint-enable no-bitwise */
		};
	}

	if (isVP8Lossless(bytes)) {
		const bits = readUInt32LE(bytes, 21);

		return {
			/* eslint-disable no-bitwise */
			width: (bits & maxSize) + 1,
			height: ((bits >> 14) & maxSize) + 1,
			/* eslint-enable no-bitwise */
		};
	}

	if (isVP8Extended(bytes)) {
		return {
			width: readUInt24LE(bytes, 20 + 4) + 1,
			height: readUInt24LE(bytes, 20 + 7) + 1,
		};
	}
}
