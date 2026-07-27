// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import versionRaw from '../../VERSION?raw';

export const APP_VERSION: string = typeof versionRaw === 'string' ? versionRaw.trim() : '1.1.0-mvp';
