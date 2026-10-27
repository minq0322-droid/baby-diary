const HANGUL = /[가-힣]$/;

function particle(name: string, withFinal: string, withoutFinal: string): string {
  const last = name.trim().slice(-1);
  if (!HANGUL.test(last))
    return `${name}${withFinal}(${withoutFinal})`;
  const hasFinal = (last.charCodeAt(0) - 0xac00) % 28 !== 0;
  return `${name}${hasFinal ? withFinal : withoutFinal}`;
}

export const topic = (name: string) => particle(name, '은', '는');
export const subject = (name: string) => particle(name, '이', '가');
export const object = (name: string) => particle(name, '을', '를');

export function callName(name: string): string {
  const short = /^[가-힣]{3}$/.test(name) ? name.slice(1) : name;
  const last = short.slice(-1);
  return HANGUL.test(last) && (last.charCodeAt(0) - 0xac00) % 28 !== 0
    ? short + '이' : short;
}
