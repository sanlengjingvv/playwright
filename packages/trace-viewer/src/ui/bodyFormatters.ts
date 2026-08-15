/**
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as React from 'react';

export type BodyFormatter = (body: string, contentType: string) => string | undefined;
export type BodyFormatters = Map<string, BodyFormatter>;

export const BodyFormattersContext = React.createContext<BodyFormatters | undefined>(undefined);

export function useBodyFormatters(): BodyFormatters | undefined {
  return React.useContext(BodyFormattersContext);
}

/**
 * Loads the module referenced by the traceViewer.bodyFormatters config option. The module is served
 * by the local trace viewer server from the user's project, so this is a plain dynamic import - no
 * eval, and relative imports inside the module resolve against the same route.
 */
export async function loadBodyFormatters(url: string): Promise<BodyFormatters> {
  const formatters: BodyFormatters = new Map();
  let module: any;
  try {
    module = await import(/* @vite-ignore */ url);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(`[playwright] Failed to load body formatters from ${url}:`, e);
    return formatters;
  }

  const exported = module?.default;
  if (!exported || typeof exported !== 'object') {
    // eslint-disable-next-line no-console
    console.error(`[playwright] Body formatters module ${url} must default-export an object mapping mime types to functions.`);
    return formatters;
  }

  for (const [mimeType, formatter] of Object.entries(exported)) {
    if (typeof formatter !== 'function') {
      // eslint-disable-next-line no-console
      console.error(`[playwright] Body formatter for "${mimeType}" is not a function, ignoring.`);
      continue;
    }
    formatters.set(mimeType.trim().toLowerCase(), formatter as BodyFormatter);
  }
  return formatters;
}

/**
 * Reads the `bodyFormatters` query param installed by the trace viewer server and loads the module
 * it points at. Resolves to undefined when the viewer runs without a project behind it, e.g. on
 * trace.playwright.dev or inside an HTML report.
 */
export async function loadBodyFormattersFromQuery(): Promise<BodyFormatters | undefined> {
  const param = new URLSearchParams(window.location.search).get('bodyFormatters');
  if (!param)
    return undefined;
  // The param is relative to the viewer page, not to the bundled module doing the import.
  return await loadBodyFormatters(new URL(param, window.location.href).href);
}

/**
 * Matches on the mime essence, ignoring parameters such as "; charset=utf-8". Falls back from the
 * exact type to "type/*" to "*\/*".
 */
export function lookupBodyFormatter(formatters: BodyFormatters | undefined, contentType: string | undefined): BodyFormatter | undefined {
  if (!formatters?.size || !contentType)
    return undefined;
  const essence = contentType.split(';')[0].trim().toLowerCase();
  if (!essence)
    return undefined;
  const type = essence.split('/')[0];
  return formatters.get(essence) ?? formatters.get(`${type}/*`) ?? formatters.get('*/*');
}
