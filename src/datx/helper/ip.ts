const octet = '(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])';
const re = new RegExp(`^${octet}[.]${octet}[.]${octet}[.]${octet}$`);
export function isIPv4(s) {
  return re.test(s);
}