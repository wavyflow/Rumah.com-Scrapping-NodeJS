import { createHash } from "crypto";

export function md5(val: string): string {
    return createHash('md5').update(val).digest('hex')
}