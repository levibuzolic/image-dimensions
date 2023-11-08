const isJpegxl = bytes => isNaked(bytes) || isIsobmff(bytes);

// JPEG-XL 'naked' codestream with no additional metadata. Starts with 0xFF0A.
const isNaked = bytes =>
	bytes[0] === 0xFF
	&& bytes[1] === 0x0A;

// JPEG-XL ISOBMFF-based container, starts with 0x0000000C 4A584C20 0D0A870A.
const isIsobmff = bytes =>
	bytes[0] === 0x00
	&& bytes[1] === 0x00
	&& bytes[2] === 0x00
	&& bytes[3] === 0x0C
	&& bytes[4] === 0x4A // J
	&& bytes[5] === 0x58 // X
	&& bytes[6] === 0x4C // L
	&& bytes[7] === 0x20
	&& bytes[8] === 0x0D
	&& bytes[9] === 0x0A
	&& bytes[10] === 0x87
	&& bytes[11] === 0x0A;

function decodeSizeHeader(bytes) {
	const dataView = new DataView(bytes.buffer);
	let offset = 0;

	function readBit(length) {
		let result = 0;
		for (let i = 0; i < length; i++) {
			const byteOffset = offset >> 3;
			const bitOffset = 7 - (offset & 7);
			const bit = (dataView.getUint8(byteOffset) >> bitOffset) & 1;
			result = (result << 1) | bit;
			offset++;
		}
		return result;
	}

	function readU32(length) {
		let value = 0;
		for (let i = 0; i < length; i++) {
			value = (value << 1) | readBit(1);
		}
		return value;
	}

	// Decode the SizeHeader fields
	let div8 = readBit(1) === 1;
	let h_div8 = div8 ? 1 + readU32(5) : 0;

	let height;
	if (!div8) {
		height = readU32(9) + 1;
		if (height === 1 << 9) {
			height += readU32(13) + 1;
			if (height === 1 << 22) {
				height += readU32(18) + 1;
				if (height === 1 << 40) {
					height += readU32(30) + 1;
				}
			}
		}
	} else {
		height = 8 * h_div8;
	}

	let ratio = readU32(3);
	let w_div8 = 0;
	if (div8 && ratio === 0) {
		w_div8 = 1 + readU32(5);
	}

	let width;
	if (!div8 && ratio === 0) {
		width = readU32(9) + 1;
		if (width === 1 << 9) {
			width += readU32(13) + 1;
			if (width === 1 << 22) {
				width += readU32(18) + 1;
				if (width === 1 << 40) {
					width += readU32(30) + 1;
				}
			}
		}
	} else {
		if (ratio === 1) width = height;
		else if (ratio === 2) width = (height * 6) / 5;
		else if (ratio === 3) width = (height * 4) / 3;
		else if (ratio === 4) width = (height * 3) / 2;
		else if (ratio === 5) width = (height * 16) / 9;
		else if (ratio === 6) width = (height * 5) / 4;
		else if (ratio === 7) width = height * 2;
	}

	return { width, height };
}


export default function jpegxl(bytes) {

	let bytesString = '';
	let string = '';
	for (let i = 0; i < 50; i++) {
		// string += `${i} | ${bytes[i]} | ${bytes[i].toString(16).padStart(2, '0')} | ${String.fromCharCode(bytes[i])}\n`;
		// bytesString += `${bytes[i].toString(16).padStart(2, '0')}`;
		// string += ` ${String.fromCharCode(bytes[i])}`;
	}

	// console.log(bytesString);
	// console.log(string);

	if (!isJpegxl(bytes)) {
		return;
	}

	return decodeSizeHeader(bytes);
}
