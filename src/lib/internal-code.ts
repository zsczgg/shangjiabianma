export const CODE_PREFIX = 'yyhxfz';
export const MAX_SEQUENCE = 999999;
export function formatInternalCode(value: number) {
  if (!Number.isInteger(value) || value < 1 || value > MAX_SEQUENCE) throw new Error('内部编码流水号必须在 1 到 999999 之间');
  return `${CODE_PREFIX}${String(value).padStart(6, '0')}`;
}
